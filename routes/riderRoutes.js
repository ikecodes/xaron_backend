import express from 'express';

import {
  signup,
  login,
  updateMe,
  updatePassword,
  protect,
  resetPassword,
  forgotPassword,
} from '../controllers/riderController.js';
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);

router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

router.use(protect);
router.post('/updateMe', updateMe);
router.post('/updatePassword', updatePassword);
export default router;
