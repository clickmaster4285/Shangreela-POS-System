import { io, type Socket } from "socket.io-client";
import { getBackendOrigin } from "@/lib/api";

const SOCKET_ORIGIN = getBackendOrigin();

const socket: Socket = io(SOCKET_ORIGIN, {
  path: "/socket.io",
  transports: ["websocket"],
  autoConnect: false,
});

export default socket;
