import Stripe from 'stripe';
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
import Tour from '../models/tourModels.js';
import Booking from '../models/bookingModel.js';
import catchAsync from '../utils/catchAsync.js';
import appError from '../utils/appError.js';
import {
  createOne,
  getOne,
  getAll,
  updateOne,
  deleteOne
} from './handlerFactory.js';

const getCheckoutSession = catchAsync(async (req, res, next) => {
  //get Currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  //Create checkout session

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'INR',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`]
          }
        }
      }
    ],
    mode: 'payment'
  });

  //Create session as response
  res.status(200).json({
    status: 'success',
    session
  });
});

const createBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;

  if (!user && !tour && !price) return next();

  await Booking.create({ tour, user, price });

  res.redirect(req.originalUrl.split('?')[0]);
});

const createBooking = createOne(Booking);
const getBooking = getOne(Booking);
const getAllBooking = getAll(Booking);
const updateBooking = updateOne(Booking);
const deleteBooking = deleteOne(Booking);

export {
  getCheckoutSession,
  createBookingCheckout,
  createBooking,
  getBooking,
  getAllBooking,
  updateBooking,
  deleteBooking
};
