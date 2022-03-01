import crypto from 'crypto';
import Rider from '../model/riderModel.js';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import createAndSendToken from '../utils/createAndSendToken.js';

export const signup = catchAsync(async (req, res, next) => {
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

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('please provide email and password!', 400));
  }
  const rider = await Rider.findOne({ email }).select('+password');
  if (!rider || !(await rider.correctPassword(password, rider.password)))
    return next(new AppError('incorrect email or password', 401));
  createAndSendToken(rider, 200, res);
});

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
  next();
});

export const forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get rider based on POSTed email
  const rider = await Rider.findOne({ email: req.body.email });
  if (!rider) {
    return next(new AppError('There is no rider with email address.', 404));
  }

  // 2) Generate the random reset token
  const resetToken = rider.createPasswordResetToken();
  await rider.save({ validateBeforeSave: false });

  // 3) Send it to rider's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/swifts/riders/resetPassword/${resetToken}`;
    // await new Email(rider, resetURL).sendPasswordReset();
    // console.log(rider.email);
    // await sendEmail({
    //   email: rider.email,
    //   subject: 'your password reset token',
    //   message: `this is a password reset email sent by Onuorah E. to test his API ${resetURL}`,
    // });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    rider.passwordResetToken = undefined;
    rider.passwordResetExpires = undefined;
    await rider.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});
export const resetPassword = catchAsync(async (req, res, next) => {
  //1) get rider based on token
  const hashedPassword = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const rider = await Rider.findOne({
    passwordResetToken: hashedPassword,
    passwordResetExpires: { $gt: Date.now() },
  });
  //2) set new password id token !expired and rider still exists
  if (!rider) {
    return next(new AppError('token is invalid or has expired', 400));
  }
  rider.password = req.body.password;
  rider.passwordConfirm = req.body.passwordConfirm;
  rider.passwordResetExpires = undefined;
  rider.passwordResetToken = undefined;
  await rider.save();
  // createAndSendToken(rider, 200, res);
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
