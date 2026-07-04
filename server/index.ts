import { createServer } from "http";
import { Server } from "socket.io";
import { setupSocketHandlers } from "./handlers";

const PORT = parseInt(process.env.SOCKET_PORT ?? "3001", 10);
const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:3000";

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: [CLIENT_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

setupSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`\n🚀 NovaChat Socket.IO server running on port ${PORT}`);
  console.log(`   CORS origin: ${CLIENT_URL}\n`);
});
