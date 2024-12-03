const express = require("express");
const WebSocket = require("ws");

const app = express();
const PORT = 3000;

app.use(express.static("public")); // Static dosyaları servis eder

const server = app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});

const wss = new WebSocket.Server({ server });

// Admin ve kullanıcı bağlantıları
let adminSocket = null;
let userSockets = [];

// Yeni bağlantı kurulduğunda
wss.on("connection", (ws) => {
  console.log("Yeni bir bağlantı kuruldu.");

  ws.on("message", (message) => {
    try {
      const { type, content } = JSON.parse(message);

      if (type === "admin") {
        console.log("Admin bağlandı.");
        adminSocket = ws;

        ws.on("close", () => {
          console.log("Admin bağlantısı kesildi.");
          adminSocket = null;
        });
      } else if (type === "user") {
        console.log("Kullanıcıdan mesaj alındı:", content);

        if (adminSocket) {
          adminSocket.send(JSON.stringify({ type: "user", content }));
        }
      } else if (type === "response") {
        console.log("Admin'den gelen cevap:", content);

        userSockets.forEach((userSocket) => {
          userSocket.send(JSON.stringify({ type: "response", content }));
        });
      }
    } catch (error) {
      console.error("Mesaj işleme hatası:", error);
    }
  });

  // Kullanıcı soketlerini listeye ekle
  if (!adminSocket) {
    userSockets.push(ws);

    ws.on("close", () => {
      console.log("Bir kullanıcı bağlantısını kesti.");
      userSockets = userSockets.filter((socket) => socket !== ws);
    });
  }
});
