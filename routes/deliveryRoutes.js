import express from 'express';

const router = express.Router();

import {
  createDelivery,
  getAllCustomerDeliveries,
  getAllRiderDeliveries,
  updateDeliveryStatus,
} from '../controllers/deliveryController.js';
import { protect as customerProtect } from '../controllers/customerController.js';
import { protect as riderProtect } from '../controllers/riderController.js';

// router.get('/riderDeliveries', riderProtect, getAllRiderDeliveries);
router
  .route('/riderDeliveries')
  .get(riderProtect, getAllRiderDeliveries)
  .patch(riderProtect, updateDeliveryStatus);

router.use(customerProtect);
router.route('/').post(createDelivery).get(getAllCustomerDeliveries);
export default router;
