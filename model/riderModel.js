import mongoose from 'mongoose';
import crypto from 'crypto';
import validator from 'validator';
import bcrypt from 'bcryptjs';

const riderSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: [true, 'Please tell us your first name!'],
    },
    lastname: {
      type: String,
      required: [true, 'Please tell us your last name!'],
    },
    middlename: String,
    bank: {
      type: String,
      required: [true, 'Please tell us your bank name!'],
    },
    accountnumber: {
      type: Number,
      required: [true, 'Please tell us your account number!'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Please provide phone number'],
      unique: true,
    },
    country: {
      type: String,
      required: [true, 'Please provide your county'],
    },
    state: {
      type: String,
      required: [true, 'Please provide your state'],
    },
    address: {
      type: String,
      required: [true, 'Please provide your address'],
    },
    photo: { type: String, default: 'default.jpg' },
    publicid: String,
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 8,
      select: false,
    },
    partnerid: {
      type: String,
      required: [true, 'Please provide Id of organisation'],
    },
    guarantorname: {
      type: String,
      required: [true, 'Please tell us your guarantor name!'],
    },
    guarantorrelationship: {
      type: String,
      required: [true, 'Please tell us your guarantor relationship!'],
    },
    guarantoremail: {
      type: String,
      required: [true, 'Please provide guarantor email'],
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    guarantorphone: {
      type: String,
      required: [true, 'Please provide guarantor phone number'],
    },
    guarantorcountry: {
      type: String,
      required: [true, 'Please provide guarantor county'],
    },
    guarantorstate: {
      type: String,
      required: [true, 'Please provide guarantor state'],
    },
    guarantoraddress: {
      type: String,
      required: [true, 'Please provide guarantor address'],
    },
    emailConfirmToken: String,
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
    },
  },

  { timestamps: true }
);

riderSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

riderSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// riderSchema.pre(/^find/, function (next) {
//   this.find({ active: { $ne: false } });
//   next();
// });

riderSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

riderSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

riderSchema.methods.createEmailConfirmToken = function () {
  const confirmToken = Math.floor(100000 + Math.random() * 900000);
  this.emailConfirmToken = confirmToken;
  return confirmToken;
};

riderSchema.methods.createPasswordResetToken = function () {
  const resetToken = Math.floor(100000 + Math.random() * 900000);
  this.passwordResetToken = resetToken;
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const Rider = mongoose.model('Rider', riderSchema);

export default Rider;
