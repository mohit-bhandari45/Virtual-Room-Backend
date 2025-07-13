import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GithubStrategy } from "passport-github2";
import { prisma } from "@/lib/db";
import axios from "axios";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "";
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "";
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "";
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || "";

export function initializePassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await prisma.user.findUnique({
            where: { email: profile.emails?.[0]?.value },
          });
          if (!user) {
            user = await prisma.user.create({
              data: {
                name: profile.displayName,
                email: profile.emails?.[0]?.value || "",
                password: "google-oauth",
                avatarURL: profile.photos?.[0]?.value,
              },
            });
          }
          return done(null, user);
        } catch (err) {
          return done(err, undefined);
        }
      }
    )
  );

  passport.use(
    new GithubStrategy(
      {
        clientID: GITHUB_CLIENT_ID,
        clientSecret: GITHUB_CLIENT_SECRET,
        callbackURL: GITHUB_CALLBACK_URL
      },
      async (accessToken: any, refreshToken: any, profile: { emails: { value: any; }[]; displayName: any; username: any; photos: { value: any; }[]; }, done: (arg0: unknown, arg1: { id: string; name: string | null; username: string | null; email: string; password: string; avatarURL: string | null; createdAt: Date; } | undefined) => any) => {
        try {
          // 👇 Fetch verified primary email
          const { data: emails } = await axios.get("https://api.github.com/user/emails", {
            headers: {
              Authorization: `token ${accessToken}`,
              Accept: "application/vnd.github+json",
            },
          });

          const primaryEmailObj = emails.find((email: any) => email.primary && email.verified);
          const email = primaryEmailObj?.email;

          if (!email) return done(new Error("No verified primary email found"), undefined);

          let user = await prisma.user.findUnique({ where: { email } });

          if (!user) {
            user = await prisma.user.create({
              data: {
                name: profile.displayName || profile.username,
                email,
                password: "github-oauth",
                avatarURL: profile.photos?.[0]?.value || "",
              },
            });
          }

          return done(null, user);
        } catch (err) {
          return done(err, undefined);
        }
      }
    )
  );
} 