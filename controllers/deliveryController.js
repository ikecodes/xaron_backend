import Delivery from '../model/deliveryModel.js';
import catchAsync from '../utils/catchAsync.js';

export const createDelivery = catchAsync(async (req, res, next) => {
  const delivery = await Delivery.create(req.body);

  res.status(200).json({
    status: 'success',
    message: 'successfully created delivery order',
    data: delivery,
  });
});

export const getAllCustomerDeliveries = catchAsync(async (req, res, next) => {
  const deliveries = await Delivery.find({
    customer: req.body.customerId,
  }).populate('rider');
  res.status(200).json({
    status: 'success',
    data: deliveries,
  });
});

export const getAllRiderDeliveries = catchAsync(async (req, res, next) => {
  const deliveries = await Delivery.find({ rider: req.body.riderId });
  res.status(200).json({
    status: 'success',
    data: deliveries,
  });
});