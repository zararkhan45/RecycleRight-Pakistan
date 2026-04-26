import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { forbidden, unauthorized } from "../lib/httpErrors";

export type AuthContext = {
  userId: number;
  role: "household" | "collector" | "admin";
};

type JwtPayload = {
  sub: string;
  role: AuthContext["role"];
};

function getJwtSecret() {
  const secret = process.env["JWT_SECRET"];
  if (!secret) throw new Error("JWT_SECRET environment variable is required.");
  return secret;
}

export function signToken(ctx: AuthContext) {
  return jwt.sign({ role: ctx.role } satisfies Omit<JwtPayload, "sub">, getJwtSecret(), {
    subject: String(ctx.userId),
    expiresIn: "24h",
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const raw = req.headers.authorization;
  if (!raw) return next(unauthorized("Missing Authorization header"));

  const [scheme, token] = raw.split(" ");
  if (scheme !== "Bearer" || !token) return next(unauthorized("Invalid Authorization header"));

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload & jwt.JwtPayload;
    const userId = Number(decoded.sub);
    if (!Number.isFinite(userId)) return next(unauthorized("Invalid token subject"));

    res.locals.auth = {
      userId,
      role: decoded.role,
    } satisfies AuthContext;

    next();
  } catch {
    next(unauthorized("Invalid or expired token"));
  }
}

export function requireRole(...roles: AuthContext["role"][]) {
  return (_req: Request, res: Response, next: NextFunction) => {
    const auth = res.locals.auth as AuthContext | undefined;
    if (!auth) return next(unauthorized());
    if (!roles.includes(auth.role)) return next(forbidden());
    next();
  };
}

