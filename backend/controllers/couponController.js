const Coupon = require('../models/Coupon');

const validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code || orderAmount === undefined) {
      return res.status(400).json({ error: 'code and orderAmount are required' });
    }

    const coupon = await Coupon.findOne({
      where: {
        code: code.toUpperCase(),
        active: true
      }
    });

    if (!coupon) {
      return res.status(400).json({ error: 'Invalid or expired coupon' });
    }

    if (coupon.minOrderAmount && Number(orderAmount) < coupon.minOrderAmount) {
      return res.status(400).json({ error: `Minimum order amount is ₹${coupon.minOrderAmount}` });
    }

    let discount = 0;
    if (coupon.discountPercent) {
      discount = Number(orderAmount) * coupon.discountPercent / 100;
    } else if (coupon.discountAmount) {
      discount = coupon.discountAmount;
    }

    discount = Math.min(discount, Number(orderAmount)); // Can't exceed order total
    const roundedDiscount = Math.round(discount * 100) / 100;

    return res.status(200).json({
      valid: true,
      discount: roundedDiscount,
      coupon
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const createCoupon = async (req, res) => {
  try {
    const { code, discountPercent, discountAmount, minOrderAmount, active } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountPercent: discountPercent !== undefined ? Number(discountPercent) : null,
      discountAmount: discountAmount !== undefined ? Number(discountAmount) : null,
      minOrderAmount: minOrderAmount !== undefined ? Number(minOrderAmount) : null,
      active: active !== undefined ? active : true
    });

    return res.status(200).json(coupon);
  } catch (error) {
    console.error('Create coupon error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.findAll();
    return res.status(200).json(coupons);
  } catch (error) {
    console.error('Get all coupons error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByPk(id);
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    await coupon.destroy();
    return res.status(200).send('Coupon deleted');
  } catch (error) {
    console.error('Delete coupon error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  validateCoupon,
  createCoupon,
  getAllCoupons,
  deleteCoupon
};
