import http from 'http';
import { createApp } from './app';
import { env } from './config';
import { prisma } from './prisma';
import { createSocketRealtimeBus } from './realtime';
import { createSocketServer } from './socket';

const server = http.createServer();
const socketServer = createSocketServer(server);
const app = createApp({
  prisma,
  realtime: createSocketRealtimeBus(socketServer),
});

server.on('request', app);

server.listen(env.PORT, () => {
  console.log(`Backend listening on http://localhost:${env.PORT}`);
});
