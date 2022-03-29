import express from 'express';
import upload from '../utils/multer.js';

import {
  signup,
  login,
  getAllRiders,
  getRider,
  deactivateRider,
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

router.get('/', getAllRiders);
router.get('/:id', getRider);
router.get('/deactivateRider/:id', deactivateRider);

router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

router.use(protect);
router.post('/updateMe', updateMe);
router.post('/updatePhoto', upload.single('photo'), updatePhoto);
router.post('/updatePassword', updatePassword);
export default router;
