import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export default () => {
  const LocalDB = process.env.LOCAL_DATABASE;
  const RemoteDB = process.env.REMOTE_DATABASE;
  mongoose
    .connect(RemoteDB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log('successfully connected to database 😁');
    });
};
