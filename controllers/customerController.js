import Customer from '../model/customerModel.js';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import createAndSendToken from '../utils/createAndSendToken.js';
import cloudinary from '../utils/cloudinary.js';
import { Mail } from '../utils/sendEmail.js';

// @desc register a customer
// @route POST api/v1/xaron/customers/signup
// @access public
export const signup = catchAsync(async (req, res, next) => {
  const { email, phone } = req.body;

  let sameEmailCustomer = await Customer.findOne({ email });
  if (sameEmailCustomer)
    return next(new AppError('customer with this email already exists', 401));

  let samePhoneCustomer = await Customer.findOne({ phone });
  if (samePhoneCustomer)
    return next(
      new AppError('customer with this phone number already exists', 401)
    );

  const newCustomer = await Customer.create({
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    password: req.body.password,
    phone: req.body.phone,
    country: req.body.country,
  });
  res.status(200).json({
    status: 'success',
    message: 'Successfully created an account',
    data: newCustomer,
  });
});

// @desc send token
// @route POST api/v1/xaron/customers/sendEmail
// @access public
export const sendEmail = catchAsync(async (req, res, next) => {
  const customer = await Customer.findOne({ email: req.body.email });
  if (!customer) {
    return next(new AppError('There is no user with email address.', 404));
  }

  const token = customer.createEmailConfirmToken();

  await customer.save({ validateBeforeSave: false });

  const options = {
    mail: customer.email,
    subject: 'Welcome to Xaron!',
    email: '../email/xaron-welcome.ejs',
    firtname: customer.firstname,
    token: token,
  };
  await Mail(options);

  res.status(200).json({
    status: 'success',
    message: 'token sent to mail',
  });
});

// @desc confirm token
// @route POST api/v1/xaron/customers/confirmEmail
// @access public
export const confirmEmail = catchAsync(async (req, res, next) => {
  const customer = await Customer.findOne({
    emailConfirmToken: req.body.token,
    email: req.body.email,
  });

  if (!customer) {
    return next(new AppError('token is invalid', 400));
  }
  customer.emailConfirmToken = undefined;
  await customer.save();
  res.status(200).json({
    status: 'success',
    message: 'Token confirmation successful, you can now login',
  });
});

// @desc confirm token
// @route POST api/v1/xaron/customers/login
// @access public
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('please provide email and password!', 400));
  }
  const customer = await Customer.findOne({ email }).select('+password');
  if (
    !customer ||
    !(await customer.correctPassword(password, customer.password))
  )
    return next(new AppError('incorrect email or password', 401));
  if (customer.emailConfirmToken) {
    return next(new AppError('you need to verify you email to login', 401));
  } else {
    createAndSendToken(customer, 200, res);
  }
});

export const updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    next(
      new AppError(
        'this route is not for password update, please /updateMyPassword',
        400
      )
    );
  }
  const updatedCustomer = await Customer.findByIdAndUpdate(
    req.customer._id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200).json({
    status: 'success',
    data: updatedCustomer,
  });
});
export const updatePhoto = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    next(
      new AppError(
        'this route is not for password update, please /updateMyPassword',
        400
      )
    );
  }
  if (req.customer.publicid)
    // first destroy the previous image from cloudinary
    await cloudinary.uploader.destroy(req.customer.publicid);

  // Then upload new image
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    {
      upload_preset: 'profile_images',
    }
  );

  const updatedCustomer = await Customer.findByIdAndUpdate(
    req.customer._id,
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
    data: updatedCustomer,
  });
});

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
  // 3) Check if user still exists
  const currentCustomer = await Customer.findById(decoded.id);
  if (!currentCustomer) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }
  // 4) Check if user changed password after the token was issued
  if (currentCustomer.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }
  req.customer = currentCustomer;
  req.customer.customerId = decoded.id;
  next();
});

export const forgotPassword = catchAsync(async (req, res, next) => {
  const customer = await Customer.findOne({ email: req.body.email });
  if (!customer) {
    return next(new AppError('There is no user with email address.', 404));
  }

  const resetToken = customer.createPasswordResetToken();
  await customer.save({ validateBeforeSave: false });

  const options = {
    mail: customer.email,
    subject: 'Password Reset',
    email: '../email/forgotPassword.ejs',
    firtname: customer.firstname,
    token: resetToken,
  };
  try {
    await Mail(options);
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    customer.passwordResetToken = undefined;
    customer.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

export const confirmResetToken = catchAsync(async (req, res, next) => {
  const customer = await Customer.findOne({
    passwordResetToken: req.body.token,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!customer) {
    return next(new AppError('token is invalid or has expired', 400));
  }

  res.status(200).json({
    status: 'success',
    message: 'successful, proceed to reset password',
    data: customer.email,
  });
});

export const resetPassword = catchAsync(async (req, res, next) => {
  const customer = await Customer.findOne({
    email: req.body.email,
    passwordResetToken: req.body.token,
  });
  if (!customer) return next(new AppError('token is invalid', 401));

  customer.password = req.body.password;
  customer.passwordResetExpires = undefined;
  customer.passwordResetToken = undefined;
  await customer.save();
  createAndSendToken(customer, 200, res);
});

export const updatePassword = catchAsync(async (req, res, next) => {
  const customer = await Customer.findById(req.customer.id).select('+password');
  if (
    !(await customer.correctPassword(
      req.body.passwordCurrent,
      customer.password
    ))
  ) {
    return next(new AppError('your current password is incorrect', 401));
  }
  customer.password = req.body.password;
  customer.passwordConfirm = req.body.passwordConfirm;
  await customer.save();
  res.status(200).json({
    status: 'success',
    message: 'Your password has been updated',
  });
  // createAndSendToken(user, 200, res);
});
