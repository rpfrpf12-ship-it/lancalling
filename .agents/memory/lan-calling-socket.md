---
name: LAN Calling socket architecture
description: Key decisions for the socket.io relay server and mobile client connection.
---

## Server
- `artifacts/api-server/src/socket.ts` — `setupSocket(httpServer)` attached in `index.ts` via `http.createServer(app)`
- Socket.IO path: `/api/socket.io` (matches proxy route `/api`)
- In-memory Map `socketId → DeviceInfo`; old registrations for same device ID are removed on re-register
- Events relayed: `private-message`, `call-offer`, `call-answer`, `call-reject`, `call-end` — all use `relay(event, {to: deviceId})` helper

## Mobile client
- Connects to `https://${EXPO_PUBLIC_DOMAIN}` with `path: "/api/socket.io"`, transports `["websocket","polling"]`
- Device ID persisted in AsyncStorage (`@lan_device_id`)
- `SocketContext` manages connection lifecycle; `MessagesContext` consumes socket for private messages

## Call flow
- No WebRTC (react-native-webrtc not compatible with Expo Go)
- Call screen uses socket signaling only: outgoing → `call-offer`, answer → `call-answer`, end → `call-end`
- Incoming calls shown via `IncomingCallModal` (root layout overlay), accept navigates to `/call/[deviceId]?mode=incoming-accepted`

**Why:** react-native-webrtc requires a custom native build; socket-only signaling demo works in Expo Go.
