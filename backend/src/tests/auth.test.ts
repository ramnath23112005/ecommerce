import mongoose from 'mongoose';
import { AuthService } from '../services/AuthService';

describe('AuthService', () => {
  const authService = new AuthService();

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', () => {
      const tokens = authService.generateTokens({
        id: '123',
        email: 'test@test.com',
        role: 'customer' as any,
      });

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
    });
  });

  describe('register', () => {
    it('should throw error for duplicate email', async () => {
      await expect(
        authService.register('Test', 'existing@test.com', 'password123')
      ).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should throw error for invalid credentials', async () => {
      await expect(
        authService.login('nonexistent@test.com', 'wrongpass')
      ).rejects.toThrow();
    });
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
