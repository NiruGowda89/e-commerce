const Review = require('../models/Review');
const Product = require('../models/Product');
const User = require('../models/User');

const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.findAll({
      where: { productId },
      order: [['createdAt', 'DESC']]
    });

    let sum = 0;
    reviews.forEach(r => {
      sum += r.rating;
    });

    const avg = reviews.length ? sum / reviews.length : 0;
    const averageRating = Math.round(avg * 10) / 10;

    return res.status(200).json({
      reviews,
      averageRating,
      totalReviews: reviews.length
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const addReview = async (req, res) => {
  try {
    const { productId, userId, rating, comment } = req.body;

    if (!productId || !userId || rating === undefined) {
      return res.status(400).json({ error: 'productId, userId, and rating are required' });
    }

    const ratingVal = parseInt(rating, 10);
    if (ratingVal < 1 || ratingVal > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const product = await Product.findByPk(productId);
    const user = await User.findByPk(userId);

    if (!product || !user) {
      return res.status(404).json({ error: 'Product or User not found' });
    }

    // One review per user per product
    const existingReview = await Review.findOne({ where: { productId, userId } });
    if (existingReview) {
      return res.status(409).json({ error: 'You have already reviewed this product' });
    }

    const review = await Review.create({
      productId,
      userId,
      userName: user.name,
      rating: ratingVal,
      comment: comment || ''
    });

    return res.status(200).json(review);
  } catch (error) {
    console.error('Add review error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    await review.destroy();
    return res.status(200).send('Review deleted');
  } catch (error) {
    console.error('Delete review error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getProductReviews,
  addReview,
  deleteReview
};
