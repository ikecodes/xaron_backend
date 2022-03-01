import express from 'express';

const router = express.Router();

import {
  createDelivery,
  getAllCustomerDeliveries,
  getAllRiderDeliveries,
} from '../controllers/deliveryController.js';
import { protect as customerProtect } from '../controllers/customerAuthController.js';
import { protect as riderProtect } from '../controllers/riderAuthController.js';

router.get('/riderDeliveries', riderProtect, getAllRiderDeliveries);
router.use(customerProtect);
router.route('/').post(createDelivery).get(getAllCustomerDeliveries);
export default router;
