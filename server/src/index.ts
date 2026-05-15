import express from "express";
import cors from "cors";
import { createServer } from "http";
import { z } from "zod";
import { config } from "./config";
import {
  createGuestUser,
  loginGoogleMock,
  loginLocalUser,
  registerLocalUser,
  requireAuth,
  type AuthenticatedRequest,
} from "./auth";
import { prisma } from "./lib/prisma";
import { connectRedisSafe, redis } from "./lib/redis";
import { createSocketServer } from "./socket";
import { dispatchAndPersist, getCachedState, getOrCreateCityState, persistState } from "./state-store";
import type { ServerAction, ServerGameState } from "./sim/types";
import { applyServerAction } from "./sim/engine";
import { getUploadSignedUrl } from "./storage";

const app = express();
const httpServer = createServer(app);
const { emitCityState } = createSocketServer(httpServer);

app.use(
  cors({
    origin: config.corsOrigin === "*" ? true : config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_, res) => {
  res.json({ ok: true, service: "resilience-city-ai-server" });
});

app.post("/auth/register", async (req, res) => {
  try {
    const auth = await registerLocalUser(req.body);
    res.status(201).json(auth);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Registration failed." });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const auth = await loginLocalUser(req.body);
    res.json(auth);
  } catch (error) {
    res.status(401).json({ message: error instanceof Error ? error.message : "Login failed." });
  }
});

app.post("/auth/google", async (req, res) => {
  try {
    const auth = await loginGoogleMock(req.body);
    res.json(auth);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Google login failed." });
  }
});

app.post("/auth/guest", async (_, res) => {
  try {
    const auth = await createGuestUser();
    res.status(201).json(auth);
  } catch {
    res.status(500).json({ message: "Guest initialization failed." });
  }
});

app.get("/player/profile", requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
  if (!user) {
    res.status(404).json({ message: "User not found." });
    return;
  }
  const city = await prisma.city.findFirst({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });
  res.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      provider: user.provider,
    },
    activeCityId: city?.id ?? null,
  });
});

app.get("/game/state", requireAuth, async (req: AuthenticatedRequest, res) => {
  const { cityId, state } = await getOrCreateCityState(req.auth!.userId);
  res.json({ cityId, state });
});

app.post("/game/action", requireAuth, async (req: AuthenticatedRequest, res) => {
  const schema = z.object({
    cityId: z.string().min(1),
    action: z.any(),
  });
  const payload = schema.parse(req.body);
  const city = await prisma.city.findFirst({
    where: { id: payload.cityId, userId: req.auth!.userId },
  });
  if (!city) {
    res.status(404).json({ message: "City not found." });
    return;
  }
  const current = (getCachedState(city.id) ?? city.gameStateJson) as unknown as ServerGameState;
  const action = payload.action as ServerAction;
  const next = await dispatchAndPersist(city.id, current, action);
  await recordActionArtifacts(city.id, action, next);
  emitCityState(city.id, next);
  res.json({ state: next });
});

app.post("/game/save", requireAuth, async (req: AuthenticatedRequest, res) => {
  const schema = z.object({
    cityId: z.string().min(1),
    state: z.any(),
  });
  const payload = schema.parse(req.body);
  const city = await prisma.city.findFirst({
    where: { id: payload.cityId, userId: req.auth!.userId },
  });
  if (!city) {
    res.status(404).json({ message: "City not found." });
    return;
  }
  await persistState(payload.cityId, payload.state as ServerGameState);
  emitCityState(payload.cityId, payload.state);
  res.json({ ok: true });
});

app.get("/missions", requireAuth, async (req: AuthenticatedRequest, res) => {
  const city = await prisma.city.findFirst({
    where: { userId: req.auth!.userId },
    orderBy: { updatedAt: "desc" },
    select: { gameStateJson: true, id: true },
  });
  if (!city) {
    res.json({ missions: [] });
    return;
  }
  const state = city.gameStateJson as unknown as ServerGameState;
  res.json({
    cityId: city.id,
    activeWarnings: state.warnings,
    mentorLog: state.mentorLog,
    liveMetrics: {
      resilience: state.resilienceScore,
      sustainability: state.sustainabilityScore,
      engineering: state.engineeringScore,
      risk: state.riskScore,
    },
  });
});

app.post("/analysis/location", requireAuth, async (req: AuthenticatedRequest, res) => {
  const schema = z.object({
    cityId: z.string().min(1),
    regionId: z.string().min(1),
  });
  const payload = schema.parse(req.body);
  const city = await prisma.city.findFirst({ where: { id: payload.cityId, userId: req.auth!.userId } });
  if (!city) {
    res.status(404).json({ message: "City not found." });
    return;
  }
  const riskSeed = payload.regionId.length * 7;
  const response = {
    seismicZone: (riskSeed % 5) + 1,
    floodExposure: (riskSeed * 3) % 100,
    windLoad: (riskSeed * 5) % 100,
    soilQuality: Math.max(15, 100 - ((riskSeed * 4) % 100)),
    drainageQuality: Math.max(10, 100 - ((riskSeed * 6) % 100)),
    recommendations: [
      "Use reinforced frames and avoid weak soft-story floors.",
      "Maintain stormwater drainage and flood overflow channels.",
      "Place emergency shelters near major road access points.",
    ],
  };
  await prisma.aiRecommendation.create({
    data: {
      cityId: city.id,
      category: "location-analysis",
      message: `Location analysis completed for ${payload.regionId}.`,
      severity: "info",
      contextJson: response as unknown as object,
    },
  });
  res.json(response);
});

app.post("/ai/recommendations", requireAuth, async (req: AuthenticatedRequest, res) => {
  const schema = z.object({ cityId: z.string().min(1), prompt: z.string().min(3) });
  const payload = schema.parse(req.body);
  const city = await prisma.city.findFirst({ where: { id: payload.cityId, userId: req.auth!.userId } });
  if (!city) {
    res.status(404).json({ message: "City not found." });
    return;
  }
  const state = city.gameStateJson as unknown as ServerGameState;
  const guidance = [
    state.citizens.panic > 45
      ? "Panic levels are high: run evacuation + triage in immediate sequence."
      : "Panic is manageable: prioritize critical infrastructure hardening.",
    state.resilienceScore < 60
      ? "Resilience is low: add hospitals, shelters, and reinforced residential stock."
      : "Resilience baseline is healthy: focus on climate adaptation investments.",
    state.climate.airQuality < 50
      ? "Air quality is degrading: build green corridors and limit high-emission expansion."
      : "Air quality is stable: maintain sustainability upgrades to prevent smog spikes.",
  ];
  await prisma.aiRecommendation.createMany({
    data: guidance.map((message) => ({
      cityId: city.id,
      category: "mentor",
      message,
      severity: "info",
      contextJson: { prompt: payload.prompt } as unknown as object,
    })),
  });
  res.json({ suggestions: guidance });
});

app.post("/disasters/simulate", requireAuth, async (req: AuthenticatedRequest, res) => {
  const schema = z.object({
    cityId: z.string().min(1),
    disaster: z.string().min(3),
    intensity: z.number().min(1).max(10),
  });
  const payload = schema.parse(req.body);
  const city = await prisma.city.findFirst({ where: { id: payload.cityId, userId: req.auth!.userId } });
  if (!city) {
    res.status(404).json({ message: "City not found." });
    return;
  }
  const current = (getCachedState(city.id) ?? city.gameStateJson) as unknown as ServerGameState;
  const next = await dispatchAndPersist(city.id, current, {
    type: "trigger-disaster",
    payload: { disaster: payload.disaster as any, intensity: payload.intensity },
  });
  emitCityState(city.id, next);
  res.json({ state: next });
});

app.post("/rescue/operate", requireAuth, async (req: AuthenticatedRequest, res) => {
  const schema = z.object({
    cityId: z.string().min(1),
    operation: z.enum(["usar", "triage", "evacuate", "airlift", "fireline"]),
  });
  const payload = schema.parse(req.body);
  const city = await prisma.city.findFirst({ where: { id: payload.cityId, userId: req.auth!.userId } });
  if (!city) {
    res.status(404).json({ message: "City not found." });
    return;
  }
  const current = (getCachedState(city.id) ?? city.gameStateJson) as unknown as ServerGameState;
  const next = await dispatchAndPersist(city.id, current, {
    type: "run-rescue",
    payload: { operation: payload.operation },
  });
  emitCityState(city.id, next);
  res.json({ state: next });
});

app.post("/storage/signed-upload-url", requireAuth, async (req: AuthenticatedRequest, res) => {
  const schema = z.object({
    filename: z.string().min(1),
    contentType: z.string().min(3),
    cityId: z.string().min(1),
  });
  const payload = schema.parse(req.body);
  const city = await prisma.city.findFirst({ where: { id: payload.cityId, userId: req.auth!.userId } });
  if (!city) {
    res.status(404).json({ message: "City not found." });
    return;
  }
  const key = `cities/${city.id}/${Date.now()}-${payload.filename}`;
  const signed = await getUploadSignedUrl(key, payload.contentType);
  res.json(signed);
});

async function runServerTick() {
  const cities = await prisma.city.findMany({
    select: { id: true, gameStateJson: true },
  });
  for (const city of cities) {
    const current = (getCachedState(city.id) ?? city.gameStateJson) as unknown as ServerGameState;
    const next = applyServerAction(current, { type: "tick" });
    await persistState(city.id, next);
    if (next.tick % 3 === 0) {
      await prisma.metricSnapshot.create({
        data: {
          cityId: city.id,
          tick: next.tick,
          resilienceScore: next.resilienceScore,
          sustainability: next.sustainabilityScore,
          engineering: next.engineeringScore,
          climateScore: next.climateScore,
          riskScore: next.riskScore,
          citizenHealth: next.citizens.health,
          citizenTrust: next.citizens.trust,
          panic: next.citizens.panic,
        },
      });
    }
    emitCityState(city.id, next);
    try {
      await redis.set(`city:${city.id}:state`, JSON.stringify(next), "EX", 120);
    } catch {
      // redis optional in local development
    }
  }
}

async function recordActionArtifacts(cityId: string, action: ServerAction, next: ServerGameState) {
  if (action.type === "build") {
    const latest = next.buildings[next.buildings.length - 1];
    if (!latest) return;
    await prisma.building.create({
      data: {
        cityId,
        templateId: latest.templateId,
        name: latest.name,
        category: "mixed",
        structuralScore: latest.structuralScore,
        fireResistance: latest.fireResistance,
        floodResistance: latest.floodResistance,
        sustainability: latest.sustainability,
        maintenanceScore: latest.condition,
        condition: latest.condition,
        occupancy: 0,
        resilientFeatures: [] as unknown as object,
      },
    });
  }
  if (action.type === "trigger-disaster" && next.activeDisaster) {
    await prisma.disasterEvent.create({
      data: {
        cityId,
        type: next.activeDisaster.type,
        intensity: next.activeDisaster.intensity,
        status: "active",
        impactedCitizens: next.activeDisaster.impactedCitizens,
        infrastructureLoss: next.activeDisaster.infrastructureDamage,
        detailsJson: next.activeDisaster as unknown as object,
      },
    });
  }
  if (action.type === "run-rescue") {
    await prisma.rescueOperation.create({
      data: {
        cityId,
        operationType: action.payload.operation,
        effectiveness: next.rescue.triageEfficiency,
        casualties: next.citizens.injured,
        savedLives: next.citizens.safe,
        detailsJson: next.citizens as unknown as object,
      },
    });
  }
}

async function bootstrap() {
  await connectRedisSafe();
  setInterval(() => {
    void runServerTick();
  }, config.tickMs);

  httpServer.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Resilience City AI backend listening on :${config.port}`);
  });
}

bootstrap().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
