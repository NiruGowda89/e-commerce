const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');

const addToCart = async (req, res) => {
  try {
    const userId = req.body.userId || req.query.userId;
    const productId = req.body.productId || req.query.productId;
    const qty = parseInt(req.body.qty || req.query.qty || 1, 10);

    if (!userId || !productId) {
      return res.status(400).json({ error: 'userId and productId are required' });
    }

    const user = await User.findByPk(userId);
    const product = await Product.findByPk(productId);

    if (!user || !product) {
      return res.status(404).json({ error: 'User or Product not found' });
    }

    // Check if item already exists in cart for this user
    let cartItem = await Cart.findOne({ where: { userId, productId } });
    if (cartItem) {
      cartItem.quantity += qty;
      await cartItem.save();
    } else {
      cartItem = await Cart.create({
        userId,
        productId,
        quantity: qty
      });
    }

    // Fetch the updated cart item with associated product
    const updatedItem = await Cart.findByPk(cartItem.cartId, {
      include: [{ model: Product, as: 'product' }]
    });

    return res.status(200).json(updatedItem);
  } catch (error) {
    console.error('Add to cart error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const cartItems = await Cart.findAll({
      where: { userId },
      include: [{ model: Product, as: 'product' }]
    });
    return res.status(200).json(cartItems);
  } catch (error) {
    console.error('Get cart error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { cartId } = req.params;
    const cartItem = await Cart.findByPk(cartId);
    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }
    await cartItem.destroy();
    return res.status(200).send('Item removed');
  } catch (error) {
    console.error('Remove from cart error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  addToCart,
  getCart,
  removeFromCart
};
