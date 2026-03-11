import { Server } from "socket.io";
import Room from "./models/Room.js";

export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  const roomPlayers = {};

  io.on("connection", (socket) => {
    console.log("🟢 A user connected");

    socket.on("joinRoom", async ({ roomCode, playerId, playerName, role }) => {

      socket.join(roomCode);

      if (!roomPlayers[roomCode]) {
        roomPlayers[roomCode] = [];
      }

      roomPlayers[roomCode] = roomPlayers[roomCode].filter(p => p.playerId !== playerId);

      roomPlayers[roomCode].push({
        id: socket.id,
        playerId,
        role,
        name: playerName
      });

      console.log(`${playerName} joined room ${roomCode}`);

      const players = roomPlayers[roomCode];

      const hasHost = players.some(p => p.role === "host");
      const hasGuest = players.some(p => p.role === "guest");

      if (hasHost && hasGuest) {

        const room = await Room.findOne({ code: roomCode });

        if (!room || !room.questions.length) {
          console.log("⚠ Questions not ready yet");
          return;
        }

        const firstQuestion = room.questions[0];

        io.to(roomCode).emit("startGame", {
          question: firstQuestion,
          index: 0,
          total: room.questions.length
        });
      }
    });


    socket.on("submitAnswer", async ({ roomCode, role, answer, time }) => {

      const room = await Room.findOne({ code: roomCode });

      if (!room) return;

      /* ⭐ Prevent duplicate submissions */
      if (room.answers[role] !== null) {
        console.log("⚠ Duplicate submission ignored:", role);
        return;
      }

      room.answers[role] = answer;
      room.timeTaken[role] += time;

      await room.save();

      if (room.answers.host !== null && room.answers.guest !== null) {

        const currentQuestion = room.questions[room.currentIndex];

        const correctAnswer = currentQuestion.answer;

        let hostCorrect = room.answers.host === correctAnswer;
        let guestCorrect = room.answers.guest === correctAnswer;

        if (hostCorrect) room.scores.host += 10;
        if (guestCorrect) room.scores.guest += 10;

        room.answers.host = null;
        room.answers.guest = null;

        room.currentIndex++;

        await room.save();

        io.to(roomCode).emit("roundResult", {
          correctAnswer,
          hostCorrect,
          guestCorrect,
          scores: room.scores
        });

        if (room.currentIndex >= room.questions.length) {

          let winner = "draw";

          if (room.scores.host > room.scores.guest) winner = "host";
          else if (room.scores.guest > room.scores.host) winner = "guest";
          else {

            if (room.timeTaken.host < room.timeTaken.guest) winner = "host";
            else if (room.timeTaken.guest < room.timeTaken.host) winner = "guest";
          }

          io.to(roomCode).emit("gameOver", {
            scores: room.scores,
            winner
          });

          await Room.deleteOne({ code: roomCode });

          delete roomPlayers[roomCode];

        } else {

          const nextQuestion = room.questions[room.currentIndex];

          io.to(roomCode).emit("nextQuestion", {
            question: nextQuestion,
            index: room.currentIndex,
            total: room.questions.length
          });

        }

      }

    });


    socket.on("chatMessage", ({ roomCode, playerName, message }) => {
      io.to(roomCode).emit("chatMessage", { playerName, message });
    });


    socket.on("disconnect", async () => {

      console.log("🔴 A user disconnected");

      for (const roomCode in roomPlayers) {

        const players = roomPlayers[roomCode];

        const leavingPlayer = players.find(p => p.id === socket.id);

        if (!leavingPlayer) continue;

        const remainingPlayer = players.find(p => p.id !== socket.id);

        if (remainingPlayer) {

          const winnerRole = remainingPlayer.role;

          const room = await Room.findOne({ code: roomCode });

          io.to(remainingPlayer.id).emit("gameOver", {
            scores: room ? room.scores : { host: 0, guest: 0 },
            winner: winnerRole
          });

        }

        await Room.deleteOne({ code: roomCode });

        delete roomPlayers[roomCode];
      }

    });

  });
};