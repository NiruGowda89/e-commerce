const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

const createOrder = async (req, res) => {
  if (!keyId || !keySecret) {
    return res.status(400).json({ error: 'Razorpay not configured' });
  }

  try {
    const amount = parseFloat(req.body.amount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });

    const options = {
      amount: Math.round(amount * 100), // Paise
      currency: 'INR',
      receipt: 'order_' + Date.now()
    };

    const rzpOrder = await instance.orders.create(options);

    return res.status(200).json({
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: keyId
    });
  } catch (error) {
    console.error('Create payment order error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

const verifyPayment = async (req, res) => {
  if (!keySecret) {
    return res.status(400).json({ error: 'Razorpay not configured' });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing signature parameters' });
    }

    const data = razorpay_order_id + '|' + razorpay_payment_id;
    const generated_signature = crypto
      .createHmac('sha256', keySecret)
      .update(data)
      .digest('hex');

    const valid = generated_signature === razorpay_signature;
    return res.status(200).json({ verified: valid });
  } catch (error) {
    console.error('Verify payment error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

module.exports = {
  createOrder,
  verifyPayment
};
