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

export const getDelivery = catchAsync(async (req, res, next) => {
  const delivery = await Delivery.findOne({ _id: req.params.id }).populate(
    'rider'
  );
  res.status(200).json({
    status: 'success',
    data: delivery,
  });
});

export const getAllCustomerDeliveries = catchAsync(async (req, res, next) => {
  const deliveries = await Delivery.find({
    customer: req.customer.customerId,
  }).populate('rider');
  res.status(200).json({
    status: 'success',
    data: deliveries,
  });
});

export const getAllRiderDeliveries = catchAsync(async (req, res, next) => {
  const deliveries = await Delivery.find({ rider: req.rider.riderId });
  res.status(200).json({
    status: 'success',
    data: deliveries,
  });
});

export const updateDeliveryStatus = catchAsync(async (req, res, next) => {
  const newDelivery = await Delivery.findByIdAndUpdate(req.body.id, req.body, {
    new: true,
    runValidators: false,
  });
  res.status(200).json({
    status: 'success',
    data: newDelivery,
  });
});
