import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema(
  {
    sendername: {
      type: String,
      required: [true, 'Please tell us senders name!'],
    },
    senderphone: {
      type: String,
      required: [true, 'Please tell us senders phone number'],
    },
    senderaddress: {
      type: String,
      required: [true, 'Please tell us senders address'],
    },
    senderlat: Number,
    senderlng: Number,
    receivername: {
      type: String,
      required: [true, 'Please tell us receivers name!'],
    },
    receiverphone: {
      type: String,
      required: [true, 'Please tell us receivers phone number'],
    },
    receiveraddress: {
      type: String,
      required: [true, 'Please tell us receivers address'],
    },
    receiverlat: Number,
    receiverlng: Number,
    package: [
      {
        packagetype: {
          type: String,
          required: [true, 'Please tell us the type of package'],
        },
        packagequantity: {
          type: String,
          required: [true, 'Please tell us the quantity of package'],
        },
      },
    ],
    packagenote: {
      type: String,
      required: [true, 'Please tell us package delivery note'],
    },
    customer: {
      type: mongoose.Schema.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer Id is required'],
    },
    rider: {
      type: mongoose.Schema.ObjectId,
      ref: 'Rider',
      required: [true, 'Rider Id is required'],
    },
    charge: {
      type: Number,
      required: [true, 'What is the total amount charged for this delivery'],
    },
    partnerid: {
      type: String,
      required: [true, 'Which partner ID does this delivery belong to'],
    },
    orderstatus: {
      type: String,
      default: 'pending',
    },
    paymentstatus: {
      type: String,
      default: 'pending',
    },
  },

  { timestamps: true }
);

const Delivery = mongoose.model('Delivery', deliverySchema);

export default Delivery;
