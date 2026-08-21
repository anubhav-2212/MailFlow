import "dotenv/config"
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import prisma from "./prisma.js";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL;

if (!googleClientId) {
  throw new Error("GOOGLE_CLIENT_ID is not configured");
}

if (!googleClientSecret) {
  throw new Error("GOOGLE_CLIENT_SECRET is not configured");
}

if (!googleCallbackUrl) {
  throw new Error("GOOGLE_CALLBACK_URL is not configured");
}

passport.use(
  new GoogleStrategy(
    {
      clientID: googleClientId,
      clientSecret: googleClientSecret,
      callbackURL: googleCallbackUrl,
    },

    async (
      _accessToken,
      _refreshToken,
      profile,
      done,
    ) => {
      try {
        const googleId = profile.id;

        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(
            new Error("Google account does not have an email"),
            undefined,
          );
        }

        const name =
          profile.displayName ||
          profile.name?.givenName ||
          "Google User";

        const avatar =
          profile.photos?.[0]?.value ?? null;

        const user = await prisma.user.upsert({
          where: {
            googleId,
          },

          update: {
            email,
            name,
            avatar,
          },

          create: {
            googleId,
            email,
            name,
            avatar,
          },
        });

        return done(null, user);
      } catch (error) {
        return done(error, undefined);
      }
    },
  ),
);

export default passport;