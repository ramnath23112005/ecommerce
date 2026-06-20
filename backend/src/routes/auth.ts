import { Router } from 'express';
import passport from 'passport';
import { register, login, refreshToken, logout, forgotPassword, resetPassword, getMe, updateProfile, googleAuthCallback } from '../controllers/AuthController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../utils/validators';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', passport.authenticate('google', { session: false }), googleAuthCallback);

router.use(protect);
router.get('/me', getMe);
router.put('/profile', updateProfile);
router.post('/logout', logout);

export default router;
