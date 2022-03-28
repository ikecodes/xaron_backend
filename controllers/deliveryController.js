import Delivery from '../model/deliveryModel.js';
import catchAsync from '../utils/catchAsync.js';

// @desc a customer creates a delivery request
// @route POST /api/v1/xaron/deliveries
// @access private
export const createDelivery = catchAsync(async (req, res, next) => {
  const delivery = await Delivery.create(req.body);
  res.status(200).json({
    status: 'success',
    message: 'successfully created delivery order',
    data: delivery,
  });
});

// @desc get a single delivery by its id
// @route GET /api/v1/xaron/deliveries/6233b8db07ed8cd2f292cff6
// @access private
export const getDelivery = catchAsync(async (req, res, next) => {
  const delivery = await Delivery.findOne({ _id: req.params.id }).populate(
    'rider'
  );
  res.status(200).json({
    status: 'success',
    data: delivery,
  });
});

// @desc get a deliveries requested and executed for a particular customer
// @route GET /api/v1/xaron/deliveries
// @access private
export const getAllCustomerDeliveries = catchAsync(async (req, res, next) => {
  const deliveries = await Delivery.find({
    customer: req.customer.customerId,
  }).populate('rider');
  res.status(200).json({
    status: 'success',
    data: deliveries,
  });
});

// @desc get a deliveries made by a particular rider
// @route GET /api/v1/xaron/deliveries/riderDeliveries
// @access private
export const getAllRiderDeliveries = catchAsync(async (req, res, next) => {
  const deliveries = await Delivery.find({ rider: req.rider.riderId });
  res.status(200).json({
    status: 'success',
    data: deliveries,
  });
});

// @desc get a deliveries made by the partner riders, total amount and commission to be paid by week end
// @route GET /api/v1/xaron/deliveries/partnerDeliveries
// @access private
export const getAllPartnersDeliveries = catchAsync(async (req, res, next) => {
  let d;
  d = new Date(Date.now());
  d.setDate(d.getDate() - 6);
  const deliveries = await Delivery.find({ createdAt: { $gte: d } });
  const total = deliveries.reduce((prev, curr) => {
    return prev + curr.charge;
  }, 0);
  res.status(200).json({
    status: 'success',
    total,
    commission: 100 * deliveries.length,
    numberOfDeliveries: deliveries.length,
    date: `${d} - ${new Date(Date.now())}`,
    data: deliveries,
  });
});

// @desc rider can update delivery status
// @route PATCH /api/v1/xaron/deliveries/riderDeliveries
// @access private
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
