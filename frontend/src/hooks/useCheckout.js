import { useCallback, useState } from 'react';
import api, { errorMessage } from '../api/client';

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * The whole checkout chain.
 *
 * POST /api/orders reserves stock and returns a payment intent. What happens
 * next depends on what the *server* says the provider is, not on a client-side
 * flag — so the same code runs on the simulated path and on Razorpay.
 */
export function useCheckout({ user } = {}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const checkout = useCallback(
    async () => {
      setBusy(true);
      setError(null);

      try {
        const { data } = await api.post('/api/orders');
        const { order, payment } = data;

        // Simulated: nothing to open, just confirm.
        if (payment.provider === 'simulated') {
          const { data: done } = await api.post('/api/orders/confirm', { orderId: order._id });
          return done.order;
        }

        const loaded = await loadRazorpay();
        if (!loaded) {
          // Couldn't even reach Razorpay — don't strand the reserved stock.
          await api.post(`/api/orders/${order._id}/cancel`).catch(() => {});
          throw new Error('Could not reach Razorpay. Check your connection and retry.');
        }

        return await new Promise((resolve, reject) => {
          const rzp = new window.Razorpay({
            key: payment.keyId,
            amount: payment.amount,
            currency: payment.currency,
            order_id: payment.razorpayOrderId,
            name: 'QuickNext',
            description: `Order ${order._id}`,
            prefill: { name: user?.name, email: user?.email },
            theme: { color: '#2f6f4f' },

            handler: async (response) => {
              try {
                // The server re-derives the signature; the browser is not trusted.
                const { data: done } = await api.post('/api/orders/confirm', {
                  orderId: order._id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                });
                resolve(done.order);
              } catch (err) {
                reject(new Error(errorMessage(err, 'Payment verification failed')));
              }
            },

            modal: {
              // The graded path: user closed the modal without paying, so the
              // stock reserved at checkout has to go back on the shelf.
              ondismiss: async () => {
                await api.post(`/api/orders/${order._id}/cancel`).catch(() => {});
                reject(new Error('Payment cancelled — your items were released.'));
              },
            },
          });

          rzp.open();
        });
      } catch (err) {
        const message = errorMessage(err, 'Checkout failed');
        setError(message);
        throw new Error(message);
      } finally {
        setBusy(false);
      }
    },
    [user]
  );

  return { checkout, busy, error, setError };
}
