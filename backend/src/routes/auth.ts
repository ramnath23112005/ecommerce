import { Router } from 'express';
import passport from 'passport';
import {
  register, login, verifyEmail, resendVerificationEmail, verifyTwoFactor,
  refreshToken, logout, logoutAllDevices,
  forgotPassword, resetPassword, changePassword,
  googleAuthCallback, getMe, updateProfile,
  getSessions, terminateSession, getLoginHistory,
  setupTwoFactor, enableTwoFactor, disableTwoFactor, getBackupCodes,
} from '../controllers/AuthController';
import { protect, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../utils/validators';

const router = Router();

// Public auth routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);
router.post('/verify-2fa', verifyTwoFactor);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', passport.authenticate('google', { session: false }), googleAuthCallback);

// Protected routes
router.use(protect);

// Profile
router.get('/me', getMe);
router.put('/profile', updateProfile);
router.post('/logout', logout);
router.post('/logout-all', logoutAllDevices);
router.put('/change-password', changePassword);

// Sessions
router.get('/sessions', getSessions);
router.delete('/sessions/:sessionId', terminateSession);

// Login history
router.get('/login-history', getLoginHistory);

// Two-Factor Authentication
router.post('/2fa/setup', setupTwoFactor);
router.post('/2fa/enable', enableTwoFactor);
router.post('/2fa/disable', disableTwoFactor);
router.get('/2fa/backup-codes', getBackupCodes);

export default router;
