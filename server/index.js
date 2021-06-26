const WebSocket = require("ws");
const express = require("express");
const http = require("http");
const { v4: uuidv4 } = require("uuid");
const app = express();

const PORT = process.env.PORT || 3900;
const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

let users = {};

const config = require("config");

require("./startup/cors")(app);
require("./startup/routes")(app);
require("./startup/db")();
require("./startup/config")();

const sendTo = (connection, message) => {
  connection.send(JSON.stringify(message));
};

const sendToAll = (clients, type, { id, name: userName }) => {
  Object.values(clients).forEach((client) => {
    if (client.name !== userName) {
      client.send(
        JSON.stringify({
          type,
          user: { id, userName },
        })
      );
    }
  });
};

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    console.log("Recieved Message: %s", msg);

    let data;
    try {
      data = JSON.parse(msg);
    } catch (e) {
      console.log("Invalid JSON");
      data = {};
    }

    const { type, name, offer, answer, candidate } = data;
    switch (type) {
      case "login":
        if (users[name]) {
          sendTo(ws, {
            type: "login",
            success: false,
            message: "Username unavailable",
          });
        } else {
          const id = uuidv4();
          const loggedIn = Object.values(users).map(
            ({ id, name: userName }) => ({ id, userName })
          );
          users[name] = ws;
          ws.name = name;
          ws.id = id;
          sendTo(ws, {
            type: "login",
            success: true,
            users: loggedIn,
          });
          sendToAll(users, "updateUsers", ws);
        }
        break;
      case "offer":
        const offerRecipient = users[name];
        if (!!offerRecipient) {
          sendTo(offerRecipient, {
            type: "offer",
            offer,
            name: ws.name,
          });
        } else {
          sendTo(ws, {
            type: "error",
            message: `User ${name} doesnot exist.`,
          });
        }
        break;
      case "answer":
        const answerRecipient = users[name];
        if (!!answerRecipient) {
          sendTo(answerRecipient, {
            type: "answer",
            answer,
          });
        } else {
          sendTo(ws, {
            type: "error",
            message: `User ${name} doesnot exist.`,
          });
        }
        break;
      case "candidate":
        const candidateRecipient = users[name];
        if (!!candidateRecipient) {
          sendTo(candidateRecipient, {
            type: "candidate",
            candidate,
          });
        } else {
          sendTo(ws, {
            type: "error",
            message: `User ${name} doesnot exist.`,
          });
        }
        break;
      case "leave":
        sendToAll(users, "leave", ws);
        break;
      default:
        sendTo(ws, {
          type: "error",
          message: "Command not found: " + type,
        });
        break;
    }
  });

  ws.send(
    JSON.stringify({
      type: "connect",
      message: "Hello, WebSocket Server here!",
    })
  );

  ws.on("close", function () {
    // delete users[ws.name];
    sendToAll(users, "leave", ws);
  });
});

server.listen(PORT, () => console.log(`Listening on PORT ${PORT}...`));

// node index.js
// wscat -c ws://localhost:9000
