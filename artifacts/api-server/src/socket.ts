import type { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { logger } from "./lib/logger";

interface DeviceInfo {
  id: string;
  name: string;
  socketId: string;
}

export function setupSocket(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    path: "/api/socket.io",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const devices = new Map<string, DeviceInfo>();

  function findSocketId(deviceId: string): string | undefined {
    for (const [sid, d] of devices.entries()) {
      if (d.id === deviceId) return sid;
    }
    return undefined;
  }

  function relay(event: string, data: { to: string }) {
    const sid = findSocketId(data.to);
    if (sid) io.to(sid).emit(event, data);
  }

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "Socket connected");

    socket.on("register-device", (data: { id: string; name: string }) => {
      for (const [sid, d] of devices.entries()) {
        if (d.id === data.id) {
          devices.delete(sid);
          break;
        }
      }
      const device: DeviceInfo = { id: data.id, name: data.name, socketId: socket.id };
      devices.set(socket.id, device);

      socket.emit("device-list", Array.from(devices.values()));
      socket.broadcast.emit("device-online", device);
      logger.info({ deviceId: data.id, name: data.name }, "Device registered");
    });

    socket.on("private-message", (data) => relay("private-message", data));
    socket.on("call-offer", (data) => relay("call-offer", data));
    socket.on("call-answer", (data) => relay("call-answer", data));
    socket.on("call-reject", (data) => relay("call-reject", data));
    socket.on("call-end", (data) => relay("call-end", data));

    socket.on("disconnect", () => {
      const device = devices.get(socket.id);
      if (device) {
        devices.delete(socket.id);
        io.emit("device-offline", device.id);
        logger.info({ deviceId: device.id }, "Device disconnected");
      }
    });
  });

  return io;
}
