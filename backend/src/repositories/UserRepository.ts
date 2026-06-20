import { BaseRepository } from './BaseRepository';
import User, { IUserDocument } from '../models/User';

export class UserRepository extends BaseRepository<IUserDocument> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string): Promise<IUserDocument | null> {
    return this.model.findOne({ email: email.toLowerCase() }).exec();
  }

  async findByEmailWithPassword(email: string): Promise<IUserDocument | null> {
    return this.model.findOne({ email: email.toLowerCase() }).select('+password').exec();
  }

  async findByGoogleId(googleId: string): Promise<IUserDocument | null> {
    return this.model.findOne({ googleId }).exec();
  }

  async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    await this.model.findByIdAndUpdate(userId, { refreshToken }).exec();
  }
}
