import dotenv from 'dotenv';
import ejs from 'ejs';
// import createError from 'http-errors';
import path from 'path';
dotenv.config();
import sgMail from '@sendgrid/mail';

let key = `${process.env.SENDGRID_API_KEY}`;
let from = `${process.env.SENDGRID_EMAIL}`;

sgMail.setApiKey(key);

export const Mail = async (options) => {
  try {
    let { mail, subject, variables, email } = options;
    const data = await ejs.renderFile(path.join(__dirname, email), variables, {
      async: true,
    });

    const msg = {
      to: mail, // replace this with your email address
      from,
      subject: subject,
      html: data,
    };

    await sgMail.send(msg);
  } catch (error) {
    console.log('error mailer', error);
    // throw new createError.Conflict(
    //   `Request was succesfull, but an Error occured sending confirmation mail`
    // );
  }
};
