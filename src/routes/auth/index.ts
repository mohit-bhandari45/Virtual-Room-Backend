import { loginHandler, signUpHandler } from "@/controllers/authControllers";
import { Router } from "express";
import passport from "passport";
import { encode } from "@/utils/jwt";

const router = Router();

router.post("/signup", signUpHandler);
router.post("/login", loginHandler);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/auth/google/failure", session: false }),
  (req, res) => {
    const user = req.user;
    if (!user) {
      return res.redirect("/auth/google/failure");
    }
    const token = encode(user as any);
    res.redirect(`http://localhost:3000/login-success?token=${token}`);
  }
);

router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "/auth/github/failure", session: false }),
  async (req: any, res) => {
    const user = req.user;
    if (!user) {
      return res.redirect("/auth/github/failure");
    }
    const token = encode(user as any);
    res.redirect(`http://localhost:3000/login-success?token=${token}`);
  }
);

router.get("/google/failure", (req, res) => {
  res.status(401).json({ msg: "Google authentication failed" });
});
router.get("/github/failure", (req, res) => {
  res.status(401).json({ msg: "Github authentication failed" });
});

export default router;