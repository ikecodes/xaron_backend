import express from 'express';

const router = express.Router();

import {
  createDelivery,
  getDelivery,
  getAllCustomerDeliveries,
  getAllRiderDeliveries,
  getAllPartnersDeliveries,
  updateDeliveryStatus,
} from '../controllers/deliveryController.js';
import { protect as customerProtect } from '../controllers/customerController.js';
import { protect as riderProtect } from '../controllers/riderController.js';

// router.get('/riderDeliveries', riderProtect, getAllRiderDeliveries);

router.route('/partnerDeliveries').get(getAllPartnersDeliveries);
router
  .route('/riderDeliveries')
  .get(riderProtect, getAllRiderDeliveries)
  .patch(riderProtect, updateDeliveryStatus);

router.use(customerProtect);
router.route('/').post(createDelivery).get(getAllCustomerDeliveries);
router.route('/:id').get(getDelivery);
export default router;
