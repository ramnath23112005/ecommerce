import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { IJWTPayload } from '../../../shared/types';
import logger from '../utils/logger';

let io: Server;

export function initializeSocketIO(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: config.frontendUrl,
      credentials: true,
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token as string, config.jwt.secret) as IJWTPayload;
      (socket as any).user = decoded;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as IJWTPayload;
    logger.info(`[Socket] User connected: ${user.email} (${socket.id})`);

    socket.join(`user:${user.id}`);

    if (user.role === 'admin') {
      socket.join('admin');
    }
    if (user.role === 'seller') {
      socket.join(`seller:${user.id}`);
    }

    socket.on('subscribe:order', (orderId: string) => {
      socket.join(`order:${orderId}`);
    });

    socket.on('unsubscribe:order', (orderId: string) => {
      socket.leave(`order:${orderId}`);
    });

    socket.on('disconnect', (reason: string) => {
      logger.info(`[Socket] User disconnected: ${user.email} (${socket.id}) reason: ${reason}`);
    });
  });

  logger.info('[Socket.IO] Initialized');
  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

export function emitToUser(userId: string, event: string, data: any): void {
  io.to(`user:${userId}`).emit(event, data);
}

export function emitToAdmin(event: string, data: any): void {
  io.to('admin').emit(event, data);
}

export function emitToSeller(sellerId: string, event: string, data: any): void {
  io.to(`seller:${sellerId}`).emit(event, data);
}

export function emitToOrder(orderId: string, event: string, data: any): void {
  io.to(`order:${orderId}`).emit(event, data);
}
