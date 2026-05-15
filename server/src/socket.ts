import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { config } from "./config";

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin === "*" ? true : config.corsOrigin,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("city:join", (payload: { cityId: string }) => {
      if (payload?.cityId) {
        socket.join(`city:${payload.cityId}`);
      }
    });
  });

  function emitCityState(cityId: string, state: unknown) {
    io.to(`city:${cityId}`).emit("city:state", state);
  }

  return { io, emitCityState };
}
