const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/user.model');

// serialize / deserialize
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// Google strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ 'oauth.googleId': profile.id });
    if (!user) {
      user = await User.create({
        fullName: profile.displayName,
        email: profile.emails[0].value,
        oauth: { googleId: profile.id },
        roles: ['customer']
      });
    }
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

// Facebook strategy
passport.use(new FacebookStrategy({
  clientID: process.env.FB_APP_ID,
  clientSecret: process.env.FB_APP_SECRET,
  callbackURL: '/auth/facebook/callback',
  profileFields: ['id', 'emails', 'name']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ 'oauth.facebookId': profile.id });
    if (!user) {
      user = await User.create({
        fullName: `${profile.name.givenName} ${profile.name.familyName}`,
        email: profile.emails?.[0]?.value,
        oauth: { facebookId: profile.id },
        roles: ['customer']
      });
    }
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));
