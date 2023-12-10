import express from 'express';
import morgan from 'morgan';
import path from 'path';
import { dirname } from 'path';
import appError from './utils/appError.js';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import ExpressMongoSanitize from 'express-mongo-sanitize';
import { xss } from 'express-xss-sanitizer';
import hpp from 'hpp';
import globalErrorHandler from './controllers/errorController.js';
import { fileURLToPath } from 'url';
import { router as tourRouter } from './routes/tourRoutes.js';
import { router as userRouter } from './routes/userRoutes.js';
import { router as reviewRouter } from './routes/reviewRoutes.js';
import { router as viewRouter } from './routes/viewRoutes.js';
import { router as bookingRouter } from './routes/bookingRoutes.js';
import compression from 'compression';
import cors from 'cors';
import { webHookCheckout } from './controllers/bookingController.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARES

app.use(cors());

app.options('*', cors());

//Serving static file
app.use(express.static(path.join(__dirname, 'public')));

// SET SECURITY HTTP HEADERS

app.use(helmet());
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

app.use((req, res, next) => {
  res.set('Content-Security-Policy', 'connect-src *');
  next();
});

//DEVLOPMENT LOGGING
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//LIMIT REQUEST FROM SAME API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP,please try again in an hour!'
});
app.use('/api', limiter);

app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  webHookCheckout
);

// Body parser, reading data from body into req.body
app.use(
  express.json({
    limit: '10kb'
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: '10kb'
  })
);
app.use(cookieParser());

//DATA SANITIZATION AGAINST NOSQL QUERY INJECTION
app.use(ExpressMongoSanitize());

//DATA SANITIZATION AGAINST XMS
app.use(xss());

//Prevent paramter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

app.use(compression());

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 2)ROUTE HANDLERS
// 3) ROUTES

// 4) START SERVER
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  next(new appError(`Cant find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

export default app;
