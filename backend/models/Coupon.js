const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Coupon = sequelize.define('Coupon', {
  couponId: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    field: 'coupon_id'
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  discountPercent: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    field: 'discount_percent'
  },
  discountAmount: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    field: 'discount_amount'
  },
  minOrderAmount: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    field: 'min_order_amount'
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'coupons',
  timestamps: false
});

module.exports = Coupon;
