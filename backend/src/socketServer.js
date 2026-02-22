import { Server } from "socket.io";

export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  // Keep track of players per room
  const roomPlayers = {};

  io.on("connection", (socket) => {
    console.log("🟢 A user connected");

    socket.on("joinRoom", ({ roomCode, playerId, playerName, role }) => {
      socket.join(roomCode);
      console.log(`${playerName} (${role}) joined room ${roomCode}`);

      if (!roomPlayers[roomCode]) {
        roomPlayers[roomCode] = [];
      }

      roomPlayers[roomCode].push({ id: socket.id, playerId, role });

      // Only send puzzles when both host and guest are in
      const players = roomPlayers[roomCode];
      const hasHost = players.some(p => p.role === "host");
      const hasGuest = players.some(p => p.role === "guest");

      if (hasHost && hasGuest) {
        // Find host socket and emit loadPuzzles
        const hostSocketId = players.find(p => p.role === "host")?.id;
        io.to(hostSocketId).emit("loadPuzzles");
      }
    });

    socket.on("sendPuzzles", ({ roomCode, puzzles }) => {
      socket.to(roomCode).emit("receivePuzzles", { puzzles });
    });

    socket.on("nextPuzzle", ({ roomCode, currentIndex }) => {
      io.to(roomCode).emit("syncPuzzle", currentIndex);
    });

    socket.on("submitAnswer", ({ roomCode, playerName, answer }) => {
      io.to(roomCode).emit("answerSubmitted", { playerName, answer });
    });
  
    socket.on("chatMessage", ({ roomCode, playerName, message }) => {
    io.to(roomCode).emit("chatMessage", { playerName, message });
    });


    socket.on("disconnect", () => {
      console.log("🔴 A user disconnected");

      for (const code in roomPlayers) {
        roomPlayers[code] = roomPlayers[code].filter(p => p.id !== socket.id);
      }
    });
  });
};
