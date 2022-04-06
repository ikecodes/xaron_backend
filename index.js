import dotenv from 'dotenv';
import { Server } from 'socket.io';
import http from 'http';
import socket from './socketio/index.js';
import db from './db/index.js';

dotenv.config();

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXCEPTION 😁');
  process.exit(1);
});

import app from './app.js';

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// call socket
socket(io);

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`App running on port ${port}...`);
  db();
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION 😁');
  server.close(() => {
    process.exit(1);
  });
});
