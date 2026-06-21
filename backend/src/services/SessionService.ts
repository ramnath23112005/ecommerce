import UserSession, { IUserSessionDocument } from '../models/UserSession';
import LoginHistory from '../models/LoginHistory';
import { SessionStatus, LoginMethod, LoginStatus } from '../../../shared/enums';
import { NotFoundError, BadRequestError } from '../utils/AppError';
import { config } from '../config';

export class SessionService {
  async createSession(
    userId: string,
    refreshToken: string,
    deviceInfo: { userAgent: string; ip: string; platform: string; browser: string; location?: string }
  ): Promise<IUserSessionDocument> {
    const ttl = parseInt(config.jwt.refreshExpiresIn) || 30;
    const expiresAt = new Date(Date.now() + ttl * 24 * 60 * 60 * 1000);

    const session = await UserSession.create({
      user: userId,
      refreshToken,
      deviceInfo,
      status: SessionStatus.ACTIVE,
      expiresAt,
    });

    return session;
  }

  async findSessionByRefreshToken(token: string): Promise<IUserSessionDocument | null> {
    return UserSession.findOne({ refreshToken: token, status: SessionStatus.ACTIVE });
  }

  async rotateSession(oldToken: string, newToken: string): Promise<IUserSessionDocument | null> {
    const session = await UserSession.findOne({ refreshToken: oldToken, status: SessionStatus.ACTIVE });
    if (!session) return null;

    session.refreshToken = newToken;
    session.lastActivity = new Date();
    await session.save();
    return session;
  }

  async revokeSession(token: string): Promise<void> {
    await UserSession.updateOne(
      { refreshToken: token },
      { status: SessionStatus.REVOKED }
    );
  }

  async revokeAllUserSessions(userId: string, excludeToken?: string): Promise<void> {
    const filter: any = { user: userId, status: SessionStatus.ACTIVE };
    if (excludeToken) {
      filter.refreshToken = { $ne: excludeToken };
    }
    await UserSession.updateMany(filter, { status: SessionStatus.REVOKED });
  }

  async getUserSessions(userId: string): Promise<IUserSessionDocument[]> {
    return UserSession.find({ user: userId })
      .sort({ lastActivity: -1 })
      .limit(50);
  }

  async getSessionById(sessionId: string, userId: string): Promise<IUserSessionDocument> {
    const session = await UserSession.findOne({ _id: sessionId, user: userId });
    if (!session) throw new NotFoundError('Session not found');
    return session;
  }

  async terminateSession(sessionId: string, userId: string): Promise<void> {
    const result = await UserSession.updateOne(
      { _id: sessionId, user: userId },
      { status: SessionStatus.REVOKED }
    );
    if (result.matchedCount === 0) throw new NotFoundError('Session not found');
  }

  async recordLogin(
    userId: string,
    method: LoginMethod,
    status: LoginStatus,
    req: { ip: string; userAgent: string; device: string; location?: string },
    reason?: string
  ): Promise<void> {
    await LoginHistory.create({
      user: userId,
      method,
      status,
      ip: req.ip,
      userAgent: req.userAgent,
      device: req.device,
      location: req.location,
      reason,
    });
  }

  async getLoginHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      LoginHistory.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      LoginHistory.countDocuments({ user: userId }),
    ]);

    return { data, total, page, limit };
  }

  async detectSuspiciousLogin(
    userId: string,
    ip: string,
    userAgent: string
  ): Promise<string | null> {
    const recentLogins = await LoginHistory.find({
      user: userId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }).sort({ createdAt: -1 }).limit(10);

    if (recentLogins.length === 0) return null;

    const hasSameIp = recentLogins.some(l => l.ip === ip);
    const hasSameAgent = recentLogins.some(l => l.userAgent === userAgent);

    if (!hasSameIp && !hasSameAgent) {
      return 'Login from new device and location';
    }
    if (!hasSameIp) {
      return 'Login from new IP address';
    }
    if (!hasSameAgent) {
      return 'Login from new browser or device';
    }

    const failureRate = recentLogins.filter(l => l.status === LoginStatus.FAILED).length;
    if (failureRate >= 3) {
      return 'Multiple recent login failures';
    }

    return null;
  }

  async cleanupExpiredSessions(): Promise<number> {
    const result = await UserSession.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    return result.deletedCount;
  }
}
