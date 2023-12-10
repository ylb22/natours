/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';
import { loadStripe } from '@stripe/stripe-js';

export const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session from API
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );

    const stripe = await loadStripe(
      'pk_test_51OLRz1SHjs6MF5N1oZy13zyNMb91Zj5A7yi5lJrd7IK3cdSRbWTeEcXhF2cSJI0gcAajzXxKFIRAOnxF1DupahQU004FUk6WHu'
    );

    // 2) Create checkout form + chanre credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    showAlert('error', err);
  }
};
