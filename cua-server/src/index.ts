import dotenv from "dotenv";
import http from "http";
import { Server as SocketIOServer, Socket } from "socket.io";


// Load environment variables first
dotenv.config();

import { handleTestCaseInitiated } from "./handlers/test-case-initiation-handler";
import { handleSocketMessage } from "./handlers/user-messages-handler";
import { testCaseUpdateHandler } from "./handlers/test-case-update-handler";
import logger from "./utils/logger";

// Configuration
// Listen on port 8000 by default (override with SOCKET_PORT)
const PORT = process.env.SOCKET_PORT
  ? parseInt(process.env.SOCKET_PORT, 10)
  : 8000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

// Create an HTTP server
const httpServer = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Socket.IO server is running.");
});

// Attach Socket.IO server
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
  },
});

io.on("connection", (socket) => {
  logger.info(`New client connected: ${socket.id}`);

  // Initialize socket data
  socket.data.testCaseReviewAgent = undefined;
  socket.data.lastCallId = undefined;
  socket.data.previousResponseId = undefined;
  socket.data.testCaseStatus = "pending";

  // Log all events
  socket.onAny((event, msg) => {
    logger.trace(
      `Received event: ${event} with message: ${JSON.stringify(msg)}`
    );
  });

  // Handle incoming messages
  socket.on("message", (msg) => {
    handleSocketMessage(socket, msg).catch((error) => {
      logger.error("Error handling socket message", error);
    });
  });

  socket.on("testCaseInitiated", (data) => {
    handleTestCaseInitiated(socket, data).catch((error) => {
      logger.error("Error handling testCaseInitiated", error);
    });
  });

  socket.on("testCaseUpdate", (status) => {
    testCaseUpdateHandler(socket, status).catch((error) => {
      logger.error("Error handling testCaseUpdate", error);
    });
  });
});

// Start listening
httpServer.listen(PORT, () => {
  logger.info(`Socket.IO server listening on port ${PORT}`);
  logger.info(`CORS origin: ${CORS_ORIGIN}`);
});
