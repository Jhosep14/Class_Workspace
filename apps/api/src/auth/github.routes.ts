import { createHash, randomBytes } from "node:crypto";
import { Router } from "express";

export const githubRouter = Router();

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

githubRouter.get("/github", (req, res) => {
  const state = randomBytes(32).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256")
    .update(verifier)
    .digest("base64url");

  // Keep one-time CSRF state and the PKCE verifier server-side for the callback check.
  req.session.oauthState = state;
  req.session.pkceVerifier = verifier;

  const params = new URLSearchParams({
    client_id: requiredEnv("GITHUB_CLIENT_ID"),
    redirect_uri: requiredEnv("GITHUB_CALLBACK_URL"),
    scope: "read:user",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

githubRouter.get("/github/callback", async (req, res) => {
  const { code, state } = req.query;
  const savedState = req.session.oauthState;
  const verifier = req.session.pkceVerifier;

  if (
    typeof code !== "string" ||
    typeof state !== "string" ||
    !savedState ||
    state !== savedState ||
    !verifier
  ) {
    res.status(400).send("Sign-in could not be verified.");
    return;
  }

  delete req.session.oauthState;
  delete req.session.pkceVerifier;

  const tokenResponse = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: requiredEnv("GITHUB_CLIENT_ID"),
        client_secret: requiredEnv("GITHUB_CLIENT_SECRET"),
        redirect_uri: requiredEnv("GITHUB_CALLBACK_URL"),
        code,
        code_verifier: verifier,
      }),
    },
  );

  const token = (await tokenResponse.json()) as {
    access_token?: string;
  };

  if (!tokenResponse.ok || !token.access_token) {
    res.status(401).send("GitHub sign-in failed.");
    return;
  }

  const profileResponse = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token.access_token}`,
    },
  });

  const profile = (await profileResponse.json()) as {
    id?: number;
    login?: string;
  };

  if (
    !profileResponse.ok ||
    typeof profile.id !== "number" ||
    typeof profile.login !== "string"
  ) {
    res.status(401).send("Could not read the GitHub profile.");
    return;
  }

  // Rotate the session ID after login to prevent session-fixation attacks.
  await new Promise<void>((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  req.session.user = {
    githubId: profile.id,
    login: profile.login,
  };

  await new Promise<void>((resolve, reject) => {
    req.session.save((error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  res.redirect("/");
});

githubRouter.get("/me", (req, res) => {
  res.json({
    user: req.session.user ?? null,
  });
});

githubRouter.post("/logout", (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      next(error);
      return;
    }

    res.clearCookie("app.sid", { path: "/" });
    res.sendStatus(204);
  });
});
