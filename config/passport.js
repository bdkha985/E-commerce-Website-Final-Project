// config/passport.js

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const User = require("../models/user.model");

// Serialize / Deserialize
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// =========================================================================
// GOOGLE STRATEGY
// =========================================================================
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const googleId = profile.id;
                const email = profile.emails?.[0]?.value?.toLowerCase();
                const displayName = profile.displayName;

                // 1. Tìm Google ID
                let user = await User.findOne({ "oauth.googleId": googleId });

                if (user) {
                    // Case A: Đã từng đăng nhập bằng Google
                    return done(null, user);
                }

                // 2. Nếu chưa có Google ID, thử tìm theo Email
                if (email) {
                    user = await User.findOne({ email: email });

                    if (user) {
                        // Case B: Email đã tồn tại (do đăng ký thủ công hoặc FB trước đó)
                        // => THỰC HIỆN LIÊN KẾT (LINKING)
                        if (!user.oauth) user.oauth = {};
                        user.oauth.googleId = googleId;
                        await user.save();
                        return done(null, user);
                    }
                }

                // 3. Case C: Chưa có ID, chưa có Email => Tạo User mới hoàn toàn
                user = await User.create({
                    fullName: displayName,
                    email: email,
                    roles: ["customer"],
                    oauth: { googleId: googleId },
                    passwordHash: null,
                    phone: "",
                });

                return done(null, user);
            } catch (err) {
                console.error("[Passport Google Error]", err);
                return done(err, null);
            }
        }
    )
);

// =========================================================================
// FACEBOOK STRATEGY
// =========================================================================
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
                const email = profile.emails?.[0]?.value?.toLowerCase();

                // Xử lý tên hiển thị
                const displayName =
                    profile.displayName ||
                    [profile.name?.givenName, profile.name?.familyName]
                        .filter(Boolean)
                        .join(" ") ||
                    "Facebook User";

                // 1. Tìm theo Facebook ID
                let user = await User.findOne({
                    "oauth.facebookId": facebookId,
                });

                if (user) {
                    return done(null, user);
                }

                // 2. Nếu chưa, tìm theo Email để liên kết
                if (email) {
                    user = await User.findOne({ email: email });
                    if (user) {
                        // => LIÊN KẾT TÀI KHOẢN
                        if (!user.oauth) user.oauth = {};
                        user.oauth.facebookId = facebookId;
                        await user.save();
                        return done(null, user);
                    }
                }

                // 3. Tạo mới
                const finalEmail = email || `fb-${facebookId}@no-email.com`;

                user = await User.create({
                    fullName: displayName,
                    email: finalEmail,
                    roles: ["customer"],
                    oauth: { facebookId: facebookId },
                    passwordHash: null,
                    phone: "",
                });

                return done(null, user);
            } catch (err) {
                console.error("[Passport Facebook Error]", err);
                return done(err, null);
            }
        }
    )
);
