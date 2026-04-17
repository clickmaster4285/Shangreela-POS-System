import { io, type Socket } from "socket.io-client";

const API_URL =
  import.meta.env.VITE_REACT_APP_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api";

const SOCKET_ORIGIN = String(API_URL).replace(/\/api\/?$/, "");

const socket: Socket = io(SOCKET_ORIGIN, {
  path: "/socket.io",
  transports: ["websocket"],
  autoConnect: false,
});

export default socket;
