import crypto from 'crypto';
import Rider from '../model/riderModel.js';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import createAndSendToken from '../utils/createAndSendToken.js';
import cloudinary from '../utils/cloudinary.js';
import { Mail } from '../utils/sendEmail.js';

// @desc register a rider
// @route POST api/v1/xaron/riders/signup
// @access public
export const signup = catchAsync(async (req, res, next) => {
  const { email, phone } = req.body;

  const sameEmailRider = await Rider.findOne({ email });
  if (sameEmailRider)
    return next(new AppError('rider with this email already exists', 401));

  const samePhoneRider = await Rider.findOne({ phone });
  if (samePhoneRider)
    return next(
      new AppError('rider with this phone number already exists', 401)
    );

  const newRider = await Rider.create({
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    middlename: req.body.middlename,
    bank: req.body.bank,
    accountnumber: req.body.accountnumber,
    email: req.body.email,
    password: req.body.password,
    phone: req.body.phone,
    country: req.body.country,
    state: req.body.state,
    address: req.body.address,
    partnerid: req.body.partnerid,
    guarantorname: req.body.guarantorname,
    guarantorrelationship: req.body.guarantorrelationship,
    guarantoremail: req.body.guarantoremail,
    guarantorphone: req.body.guarantorphone,
    guarantorcountry: req.body.guarantorcountry,
    guarantorstate: req.body.guarantorstate,
    guarantoraddress: req.body.guarantoraddress,
  });
  res.status(200).json({
    status: 'success',
    message: 'Successfully created an account',
    data: newRider,
  });
});

// @desc send token
// @route POST api/v1/xaron/riders/sendEmail
// @access public
export const sendEmail = catchAsync(async (req, res, next) => {
  const rider = await Rider.findOne({ email: req.body.email });
  if (!rider) {
    return next(new AppError('There is no user with email address.', 404));
  }

  const token = rider.createEmailConfirmToken();

  await rider.save({ validateBeforeSave: false });

  const options = {
    mail: rider.email,
    subject: 'Welcome to Xaron!',
    email: '../email/xaron-welcome.ejs',
    firtname: rider.firstname,
    token: token,
  };
  await Mail(options);

  res.status(200).json({
    status: 'success',
    message: 'token sent to mail',
  });
});

// @desc confirm token
// @route POST api/v1/xaron/riders/confirmEmail
// @access public
export const confirmEmail = catchAsync(async (req, res, next) => {
  const rider = await Rider.findOne({
    emailConfirmToken: req.body.token,
    email: req.body.email,
  });

  if (!rider) {
    return next(new AppError('token is invalid', 400));
  }
  rider.emailConfirmToken = undefined;
  await rider.save();
  res.status(200).json({
    status: 'success',
    message: 'Token confirmation successful, you can now login',
  });
});

// @desc login a rider
// @route POST api/v1/xaron/riders/login
// @access public
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('please provide email and password!', 400));
  }
  const rider = await Rider.findOne({ email }).select('+password');
  if (!rider || !(await rider.correctPassword(password, rider.password)))
    return next(new AppError('incorrect email or password', 401));
  if (rider.emailConfirmToken) {
    return next(new AppError('you need to verify you email to login', 401));
  } else {
    createAndSendToken(rider, 200, res);
  }
});

// @desc all riders available
// @route GET api/v1/xaron/riders/partnerRiders/6231078b009f24bd5fd0d727
// @access public
export const getAllRiders = catchAsync(async (req, res, next) => {
  if (!req.params.id)
    return next(new AppError('please provide a partner ID', 401));
  const riders = await Rider.find({ partnerid: req.params.id });
  if (!riders.length)
    return next(new AppError('no rider with that partnerid found', 404));
  res.status(200).json({
    status: 'success',
    data: riders,
  });
});

// @desc get a single rider
// @route GET api/v1/xaron/riders/6231078b009f24bd5fd0d727
// @access public
export const getRider = catchAsync(async (req, res, next) => {
  const rider = await Rider.findOne({ _id: req.params.id });
  if (!rider) return next(new AppError('no rider found with this id', 404));
  res.status(200).json({
    status: 'success',
    data: rider,
  });
});

// @desc activate or deactivate rider
// @route PATCH api/v1/xaron/riders/6231078b009f24bd5fd0d727
// @access public
export const updateRiderActiveStatus = catchAsync(async (req, res, next) => {
  const rider = await Rider.findOne({ _id: req.params.id });
  if (!rider) return next(new AppError('no rider found with this id', 404));

  if (rider.active === true) {
    rider.active = false;
    await rider.save();
    res.status(200).json({
      status: 'success',
      message: 'rider successfully deactivated',
    });
  } else {
    rider.active = true;
    await rider.save();
    res.status(200).json({
      status: 'success',
      message: 'rider successfully activated',
      data: rider,
    });
  }
});

// @desc edit driver details
// @route GET api/v1/xaron/riders/updateMe
// @access private
export const updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    next(
      new AppError(
        'this route is not for password update, please /updatePassword',
        400
      )
    );
  }
  const updatedRider = await Rider.findByIdAndUpdate(req.rider._id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
    data: updatedRider,
  });
});

// @desc update rider profile photo
// @route POST api/v1/xaron/riders/updatePhoto
// @access private
export const updatePhoto = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    next(
      new AppError(
        'this route is not for password update, please /updateMyPassword',
        400
      )
    );
  }
  if (req.rider.publicid)
    // first destroy the previous image from cloudinary
    await cloudinary.uploader.destroy(req.rider.publicid);

  // Then upload new image
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    {
      upload_preset: 'profile_images',
    }
  );
  const updatedRider = await Rider.findByIdAndUpdate(
    req.rider._id,
    {
      photo: secure_url,
      publicid: public_id,
    },
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200).json({
    status: 'success',
    data: updatedRider,
  });
});

// @desc rider auth protector
export const protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }
  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // 3) Check if rider still exists
  const currentRider = await Rider.findById(decoded.id);
  if (!currentRider) {
    return next(
      new AppError(
        'The rider belonging to this token does no longer exist.',
        401
      )
    );
  }
  // 4) Check if rider changed password after the token was issued
  if (currentRider.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('Rider recently changed password! Please log in again.', 401)
    );
  }
  req.rider = currentRider;
  req.rider.riderId = decoded.id;
  next();
});

export const forgotPassword = catchAsync(async (req, res, next) => {
  const rider = await Rider.findOne({ email: req.body.email });
  if (!rider) {
    return next(new AppError('There is no user with email address.', 404));
  }

  const resetToken = rider.createPasswordResetToken();
  await rider.save({ validateBeforeSave: false });

  const options = {
    mail: rider.email,
    subject: 'Password Reset',
    email: '../email/forgotPassword.ejs',
    firtname: rider.firstname,
    token: resetToken,
  };
  try {
    await Mail(options);
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    rider.passwordResetToken = undefined;
    rider.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

export const confirmResetToken = catchAsync(async (req, res, next) => {
  const rider = await Rider.findOne({
    passwordResetToken: req.body.token,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!rider) {
    return next(new AppError('token is invalid or has expired', 400));
  }

  res.status(200).json({
    status: 'success',
    message: 'successful, proceed to reset password',
    data: rider.email,
  });
});

export const resetPassword = catchAsync(async (req, res, next) => {
  const rider = await Rider.findOne({
    email: req.body.email,
    passwordResetToken: req.body.token,
  });
  if (!rider) return next(new AppError('token is invalid', 401));
  rider.password = req.body.password;
  rider.passwordResetExpires = undefined;
  rider.passwordResetToken = undefined;
  await rider.save();
  createAndSendToken(rider, 200, res);
});

export const updatePassword = catchAsync(async (req, res, next) => {
  const rider = await Rider.findById(req.rider.id).select('+password');
  if (
    !(await rider.correctPassword(req.body.passwordCurrent, rider.password))
  ) {
    return next(new AppError('your current password is incorrect', 401));
  }
  rider.password = req.body.password;
  rider.passwordConfirm = req.body.passwordConfirm;
  await rider.save();

  res.status(200).json({
    status: 'success',
    message: 'Your password has been updated',
  });
  // createAndSendToken(rider, 200, res);
});
