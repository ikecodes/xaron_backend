import crypto from 'crypto';
import Customer from '../model/customerModel.js';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import createAndSendToken from '../utils/createAndSendToken.js';

export const signup = catchAsync(async (req, res, next) => {
  const { email, phone } = req.body;
  const customer = await Customer.findOne({ email, phone });
  if (customer)
    return next(
      new AppError('driver with this email or phone number already exists', 401)
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
  createAndSendToken(customer, 200, res);
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
  next();
});

export const forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on posted email
  const customer = await Customer.findOne({ email: req.body.email });
  if (!customer) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // 2) Generate the random reset token
  const resetToken = customer.createPasswordResetToken();
  await customer.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    // await sendEmail({
    //   email: user.email,
    //   subject: 'your password reset token',
    //   message: `this is a password reset email sent by Onuorah E. to test his API ${resetURL}`,
    // });

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
export const resetPassword = catchAsync(async (req, res, next) => {
  //1) get user based on token

  const customer = await Customer.findOne({
    passwordResetToken: req.body.token,
    passwordResetExpires: { $gt: Date.now() },
  });
  //2) set new password id token !expired and user still exists
  console.log(customer);
  if (!customer) {
    return next(new AppError('token is invalid or has expired', 400));
  }
  customer.password = req.body.password;
  customer.passwordConfirm = req.body.passwordConfirm;
  customer.passwordResetExpires = undefined;
  customer.passwordResetToken = undefined;
  await customer.save();
  createAndSendToken(user, 200, res);
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
