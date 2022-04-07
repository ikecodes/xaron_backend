import express from 'express';
import upload from '../utils/multer.js';

import {
  signup,
  login,
  sendEmail,
  confirmEmail,
  getAllRiders,
  getRider,
  updateRiderActiveStatus,
  updateMe,
  updatePhoto,
  updatePassword,
  protect,
  resetPassword,
  forgotPassword,
} from '../controllers/riderController.js';
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/sendEmail', sendEmail);
router.post('/confirmEmail', confirmEmail);

router.get('/partnerRiders/:id', getAllRiders);
router.get('/partnerRider/:id', getRider);
router.get('/updateRiderActiveStatus/:id', updateRiderActiveStatus);

router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

router.use(protect);
router.post('/updateMe', updateMe);
router.post('/updatePhoto', upload.single('photo'), updatePhoto);
router.post('/updatePassword', updatePassword);
export default router;
