import express from 'express';
import upload from '../utils/multer.js';
import {
  signup,
  sendEmail,
  confirmEmail,
  login,
  updateMe,
  updatePhoto,
  updatePassword,
  protect,
  forgotPassword,
  confirmResetToken,
  resetPassword,
} from '../controllers/customerController.js';
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/sendEmail', sendEmail);
router.post('/confirmEmail', confirmEmail);
router.post('/forgotPassword', forgotPassword);
router.post('/confirmResetToken', confirmResetToken);
router.post('/resetPassword', resetPassword);

router.use(protect);
router.post('/updateMe', updateMe);
router.post('/updatePhoto', upload.single('photo'), updatePhoto);
router.post('/updatePassword', updatePassword);
export default router;
