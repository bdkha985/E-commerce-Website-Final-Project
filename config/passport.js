//config/passport.js

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const User = require("../models/user.model");

// serialize / deserialize
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});

// Google strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ "oauth.googleId": profile.id });
                if (!user) {
                    user = await User.create({
                        fullName: profile.displayName,
                        email: profile.emails[0].value,
                        oauth: { googleId: profile.id },
                        roles: ["customer"],
                    });
                }
                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);

passport.use(
    new FacebookStrategy(
        {
            clientID: process.env.FB_APP_ID,
            clientSecret: process.env.FB_APP_SECRET,
            callbackURL:
                process.env.FB_CALLBACK_URL ||
                "http://localhost:8081/auth/facebook/callback",
            profileFields: ["id", "emails", "name", "displayName"],
        },
        async (accessToken, refreshToken, profile, done) => {
            try {

                const facebookId = profile.id;
                const email = profile.emails?.[0]?.value?.toLowerCase() || null;
                const displayName =
                    profile.displayName ||
                    [profile.name?.givenName, profile.name?.familyName]
                        .filter(Boolean)
                        .join(" ") ||
                    "Facebook User";

                // 1) Tìm theo facebookId
                let user = await User.findOne({
                    "oauth.facebookId": facebookId,
                });

                // 2) Nếu chưa có, thử khớp theo email
                if (!user && email) {
                    user = await User.findOne({ email });
                    if (user) {
                        user.oauth = { ...(user.oauth || {}), facebookId };
                        await user.save();
                    }
                }

                // 3) Nếu vẫn chưa có, tạo mới
                if (!user) {
                    try {
                        user = await User.create({
                            fullName: displayName,
                            email: email || `fb-${facebookId}@example.local`,
                            passwordHash: null,
                            phone: "",
                            roles: ["customer"],
                            oauth: { facebookId },
                        });
                    } catch (e) {
                        // Trường hợp email trùng (E11000) -> link tài khoản
                        if (e?.code === 11000 && email) {
                            user = await User.findOneAndUpdate(
                                { email },
                                { $set: { "oauth.facebookId": facebookId } },
                                { new: true }
                            );
                        } else {
                            console.error("[FB create user error]", e);
                            return done(null, false, {
                                message:
                                    "Không thể tạo/lấy tài khoản Facebook.",
                            });
                        }
                    }
                }

                return done(null, user);
            } catch (err) {
                console.error("[FacebookStrategy ERROR]", err);
                return done(null, false, {
                    message: "Xác thực Facebook thất bại.",
                });
            }
        }
    )
);
