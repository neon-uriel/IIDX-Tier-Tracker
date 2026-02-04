const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('../db');
const { findOrCreateUser, isAdmin } = require('../services/authService');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const { rows } = await db.query('SELECT id, display_name, email FROM users WHERE id = $1', [id]);
    const user = rows[0];
    if (user) {
      user.is_admin = isAdmin(user);
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        const user = await findOrCreateUser(profile);
        return done(null, user);
    } catch(err) {
        return done(err, null);
    }
  }
));
