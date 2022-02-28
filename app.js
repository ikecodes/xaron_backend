import express from 'express';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import compression from 'compression';

//Utils
import globalErrorHandler from './controllers/errorController.js';
import AppError from './utils/appError.js';

//Routes
import userRouter from './routes/userRoutes.js';
import riderRouter from './routes/riderRoutes.js';

const app = express();

//development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
//http security headers
app.use(helmet());
// limit requests for api
const limiter = rateLimit({
  max: 100,
  windowsMs: 60 * 60 * 1000,
  message: 'too many requests from this IP, please try again later',
});

app.use(compression());
app.use('/api', limiter);

// body parser, reading data into the body (req.body)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// data sanitization against NOSQL query injection
app.use(mongoSanitize());

// data sanitizatin against XSS
app.use(xss());

// prevent parameter pollution
app.use(hpp());

app.use('/api/v1/xaron/users', userRouter);
app.use('/api/v1/xaron/riders', riderRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;
