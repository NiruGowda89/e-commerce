const Order = require('../models/Order');
const User = require('../models/User');

const placeOrder = async (req, res) => {
  try {
    const {
      userId,
      customerName,
      email,
      phone,
      shippingAddress,
      city,
      pincode,
      paymentMethod,
      items,
      totalAmount
    } = req.body;

    if (!customerName || !email || !phone || !shippingAddress || !city || !pincode || !paymentMethod || !items) {
      return res.status(400).json({ error: 'Missing required order fields' });
    }

    const itemsJson = typeof items === 'string' ? items : JSON.stringify(items);

    const order = await Order.create({
      userId: userId || null,
      customerName,
      email,
      phone,
      shippingAddress,
      city,
      pincode,
      paymentMethod,
      itemsJson,
      totalAmount,
      status: 'Confirmed' // Spring Boot seeds order status as "Confirmed" or "Pending"
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[MOCK EMAIL] Order Confirmation sent to ${email}. Order ID: ORD-${order.orderId}, OTP: ${otp}, Total: ₹${totalAmount}`);

    const responseObj = order.toJSON();
    responseObj.items = items;
    delete responseObj.itemsJson;

    return res.status(200).json(responseObj);
  } catch (error) {
    console.error('Place order error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.findAll({
      where: { userId },
      order: [['orderId', 'DESC']]
    });

    const parsedOrders = orders.map(order => {
      const orderObj = order.toJSON();
      try {
        orderObj.items = JSON.parse(orderObj.itemsJson);
      } catch (e) {
        orderObj.items = [];
      }
      delete orderObj.itemsJson;
      return orderObj;
    });

    return res.status(200).json(parsedOrders);
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getOrdersByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const orders = await Order.findAll({ where: { status } });
    const parsedOrders = orders.map(order => {
      const orderObj = order.toJSON();
      try {
        orderObj.items = JSON.parse(orderObj.itemsJson);
      } catch (e) {
        orderObj.items = [];
      }
      delete orderObj.itemsJson;
      return orderObj;
    });
    return res.status(200).json(parsedOrders);
  } catch (error) {
    console.error('Get orders by status error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const status = req.query.status || req.body.status;

    if (!status) {
      return res.status(400).json({ error: 'Status query parameter or body field is required' });
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.status = status;
    await order.save();

    const orderObj = order.toJSON();
    try {
      orderObj.items = JSON.parse(orderObj.itemsJson);
    } catch (e) {
      orderObj.items = [];
    }
    delete orderObj.itemsJson;

    return res.status(200).json(orderObj);
  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({ order: [['orderId', 'DESC']] });
    const parsedOrders = orders.map(order => {
      const orderObj = order.toJSON();
      try {
        orderObj.items = JSON.parse(orderObj.itemsJson);
      } catch (e) {
        orderObj.items = [];
      }
      delete orderObj.itemsJson;
      return orderObj;
    });
    return res.status(200).json(parsedOrders);
  } catch (error) {
    console.error('Get all orders error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  placeOrder,
  getOrdersByUser,
  getOrdersByStatus,
  updateOrderStatus,
  getAllOrders
};
