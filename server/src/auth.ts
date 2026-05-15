import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { config } from "./config";
import { prisma } from "./lib/prisma";

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2).max(50).optional(),
});

export async function registerLocalUser(input: unknown) {
  const payload = authSchema.parse(input);
  const existing = await prisma.user.findUnique({ where: { email: payload.email } });
  if (existing) {
    throw new Error("Account already exists.");
  }
  const passwordHash = await bcrypt.hash(payload.password, 10);
  const user = await prisma.user.create({
    data: {
      email: payload.email,
      passwordHash,
      displayName: payload.displayName ?? payload.email.split("@")[0],
      provider: "local",
    },
  });
  return issueToken(user.id, user.email, user.displayName);
}

export async function loginLocalUser(input: unknown) {
  const payload = authSchema.pick({ email: true, password: true }).parse(input);
  const user = await prisma.user.findUnique({ where: { email: payload.email } });
  if (!user || !user.passwordHash) {
    throw new Error("Invalid credentials.");
  }
  const valid = await bcrypt.compare(payload.password, user.passwordHash);
  if (!valid) {
    throw new Error("Invalid credentials.");
  }
  return issueToken(user.id, user.email, user.displayName);
}

export async function createGuestUser() {
  const suffix = Math.random().toString(36).slice(2, 8);
  const email = `guest-${suffix}@resilience.local`;
  const user = await prisma.user.create({
    data: {
      email,
      displayName: `Guest ${suffix.toUpperCase()}`,
      provider: "guest",
    },
  });
  return issueToken(user.id, user.email, user.displayName);
}

export async function loginGoogleMock(input: unknown) {
  const schema = z.object({
    email: z.string().email(),
    displayName: z.string().min(2).max(60).optional(),
  });
  const payload = schema.parse(input);
  const user =
    (await prisma.user.findUnique({ where: { email: payload.email } })) ??
    (await prisma.user.create({
      data: {
        email: payload.email,
        displayName: payload.displayName ?? payload.email.split("@")[0],
        provider: "google",
      },
    }));
  return issueToken(user.id, user.email, user.displayName);
}

function issueToken(userId: string, email: string, displayName: string) {
  const token = jwt.sign({ sub: userId, email, displayName }, config.jwtSecret, {
    expiresIn: "7d",
  });
  return {
    token,
    user: {
      id: userId,
      email,
      displayName,
    },
  };
}

export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    email: string;
    displayName: string;
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Missing token." });
    return;
  }
  const token = header.slice("Bearer ".length);
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as {
      sub: string;
      email: string;
      displayName: string;
    };
    req.auth = {
      userId: decoded.sub,
      email: decoded.email,
      displayName: decoded.displayName,
    };
    next();
  } catch {
    res.status(401).json({ message: "Invalid token." });
  }
}
