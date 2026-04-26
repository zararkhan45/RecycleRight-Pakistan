import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import {
  AuthLoginBody,
  AuthLoginResponse,
  AuthMeResponse,
  AuthRegisterBody,
} from "@workspace/api-zod";
import { db, usersTable } from "@workspace/db";

import { conflict, unauthorized } from "../lib/httpErrors";
import { mapUser } from "../lib/dbMappers";
import { requireAuth, signToken, type AuthContext } from "../middleware/auth";

const router: IRouter = Router();

router.post("/auth/register", async (req, res, next) => {
  try {
    const body = AuthRegisterBody.parse(req.body);

    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, body.email))
      .limit(1);

    if (existing.length) throw conflict("Email already registered");

    const passwordHash = await bcrypt.hash(body.password, 12);

    const inserted = await db
      .insert(usersTable)
      .values({
        name: body.name,
        email: body.email,
        passwordHash,
        role: body.role,
        status: body.role === "collector" ? "pending_verification" : "active",
      })
      .returning();

    const user = inserted[0];
    if (!user) throw new Error("Failed to create user");

    const ctx: AuthContext = { userId: user.id, role: user.role };
    const token = signToken(ctx);

    const data = AuthLoginResponse.parse({ token, user: mapUser(user) });
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

router.post("/auth/login", async (req, res, next) => {
  try {
    const body = AuthLoginBody.parse(req.body);

    const rows = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, body.email))
      .limit(1);

    const user = rows[0];
    if (!user) throw unauthorized("Invalid email or password");

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) throw unauthorized("Invalid email or password");

    const ctx: AuthContext = { userId: user.id, role: user.role };
    const token = signToken(ctx);

    const data = AuthLoginResponse.parse({ token, user: mapUser(user) });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get("/auth/me", requireAuth, async (_req, res, next) => {
  try {
    const auth = res.locals.auth as AuthContext;

    const rows = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, auth.userId))
      .limit(1);

    const user = rows[0];
    if (!user) throw unauthorized("User not found");

    const data = AuthMeResponse.parse(mapUser(user));
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;

