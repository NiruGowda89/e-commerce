import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiGetProduct, apiGetReviews, apiAddReview } from '../api';

const DEMO_PRODUCTS = [
  { productId: 'd1', productName: 'Classic Black Tee', category: 'T-Shirts', brand: 'Urban Man', price: 499, size: 'M,L,XL', color: 'Black,Blue', imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&q=80', description: 'Premium cotton classic black tee.' },
  { productId: 'd2', productName: 'Slim Fit Chinos', category: 'Trousers', brand: 'Urban Man', price: 1199, size: 'S,M,L', color: 'Blue,White', imageUrl: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=400&q=80', description: 'Comfortable cotton stretch chinos.' },
  { productId: 'd3', productName: 'Cargo Shorts', category: 'Shorts', brand: 'Urban Man', price: 799, size: 'L,XL', color: 'White,Black', imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=400&q=80', description: 'Heavy duty cargo shorts for outdoor use.' },
  { productId: 'd4', productName: 'Striped Polo', category: 'Polo', brand: 'Urban Man', price: 699, size: 'M,L', color: 'Blue,White', imageUrl: 'https://images.unsplash.com/photo-1625910513473-4726a2d9dcd9?w=400&q=80', description: 'Smart casual striped polo shirt.' },
  { productId: 'd5', productName: 'Denim Jacket', category: 'Jackets', brand: 'Urban Man', price: 2199, size: 'L,XL', color: 'Blue', imageUrl: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400&q=80', description: 'Vintage washed indigo denim jacket.' },
  { productId: 'd6', productName: 'White Linen Shirt', category: 'Shirts', brand: 'Urban Man', price: 899, size: 'M,L', color: 'White', imageUrl: 'https://images.unsplash.com/photo-1602810316498-ab67cf68c8e1?w=400&q=80', description: 'Luxury breathable linen shirt.' },
];

export default function ProductDetail({ addToCart, showToast, user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [reviewsData, setReviewsData] = useState({ reviews: [], averageRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);
  
  // Selections
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [isFav, setIsFav] = useState(false);

  // Review Form
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewMsg, setReviewMsg] = useState('');

  // Countdown timer
  const [timeLeft, setTimeLeft] = useState({ hrs: '02', mins: '45', secs: '00' });

  // Load product and reviews
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        let p = null;
        if (id.startsWith('d')) {
          p = DEMO_PRODUCTS.find(item => item.productId === id);
        } else {
          p = await apiGetProduct(id);
        }
        
        if (!p) {
          showToast('Product not found!', 'error');
          navigate('/shop');
          return;
        }

        setProduct(p);
        setSelectedSize((p.size || '').split(',')[0]);
        setSelectedColor((p.color || '').split(',')[0]);

        // Check if wishlist contains product
        const favs = JSON.parse(localStorage.getItem('karunadaFavourites') || '[]');
        setIsFav(favs.some(f => f.id === (p.productId || p.id)));

        // Fetch reviews
        if (!id.startsWith('d')) {
          const rev = await apiGetReviews(p.productId || p.id);
          setReviewsData(rev);
        }
      } catch (err) {
        console.error(err);
        // Fallback for demos
        const demo = DEMO_PRODUCTS.find(item => item.productId === id);
        if (demo) {
          setProduct(demo);
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  // Tick down timer
  useEffect(() => {
    const timer = setInterval(() => {
      let h = parseInt(timeLeft.hrs, 10);
      let m = parseInt(timeLeft.mins, 10);
      let s = parseInt(timeLeft.secs, 10);

      if (s > 0) {
        s--;
      } else {
        s = 59;
        if (m > 0) {
          m--;
        } else {
          m = 59;
          if (h > 0) {
            h--;
          } else {
            h = 24; // Loop back
          }
        }
      }

      setTimeLeft({
        hrs: h.toString().padStart(2, '0'),
        mins: m.toString().padStart(2, '0'),
        secs: s.toString().padStart(2, '0')
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleToggleFavourite = () => {
    if (!product) return;
    const pid = product.productId || product.id;
    let favs = [];
    try {
      favs = JSON.parse(localStorage.getItem('karunadaFavourites') || '[]');
    } catch (e) {}

    const index = favs.findIndex(f => f.id === pid);
    if (index !== -1) {
      favs.splice(index, 1);
      setIsFav(false);
      showToast('Removed from Wishlist!', 'info');
    } else {
      favs.push({
        id: pid,
        name: product.productName || product.name,
        price: product.price,
        image: product.imageUrl || product.image || 'images/shirt.jpg'
      });
      setIsFav(true);
      showToast('Saved to Wishlist!', 'success');
    }
    localStorage.setItem('karunadaFavourites', JSON.stringify(favs));
    window.dispatchEvent(new Event('favouritesUpdated'));
  };

  const handleAddToCartClick = () => {
    if (!product) return;
    addToCart({
      id: product.productId || product.id,
      name: product.productName || product.name,
      price: product.price,
      image: product.imageUrl || product.image || 'images/shirt.jpg',
      size: selectedSize,
      color: selectedColor,
    }, 1);
    showToast('Added to cart!', 'success');
  };

  const handleBuyNowClick = () => {
    if (!product) return;
    handleAddToCartClick();
    navigate('/checkout');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setReviewMsg('⚠️ Please login to submit a review.');
      return;
    }
    if (id.startsWith('d')) {
      setReviewMsg('⚠️ Cannot submit reviews for demo products.');
      return;
    }

    try {
      await apiAddReview(product.productId || product.id, user.id, rating, comment);
      setReviewMsg('✅ Review submitted successfully!');
      setComment('');
      
      // Reload reviews
      const rev = await apiGetReviews(product.productId || product.id);
      setReviewsData(rev);
    } catch (err) {
      setReviewMsg(`❌ ${err.message || 'Failed to submit review'}`);
    }
  };

  if (loading) {
    return (
      <div id="pageLoader">
        <div className="pd-loader__spinner"></div>
        <p className="pd-loader__text">Loading product details…</p>
      </div>
    );
  }

  if (!product) return null;

  const sizes = (product.size || 'S,M,L,XL').split(',');
  const colors = (product.color || 'Blue,Black,White').split(',');

  return (
    <div className="container-fluid px-3 px-md-4 mt-3 mb-5">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb pd-breadcrumb">
          <li className="breadcrumb-item"><Link to="/">Home</Link></li>
          <li className="breadcrumb-item"><Link to="/shop">Shop</Link></li>
          <li className="breadcrumb-item active">{product.productName || product.name}</li>
        </ol>
      </nav>

      <div className="row no-gutters pd-layout">
        {/* LEFT: Image Gallery */}
        <div className="col-md-5 col-lg-4 pd-gallery-col">
          <div className="pd-gallery-sticky">
            {/* Action buttons (Wishlist & share) */}
            <div className="pd-gallery-actions">
              <button onClick={handleToggleFavourite} className="pd-action-btn" title="Wishlist">
                <span>{isFav ? '❤️' : '🤍'}</span>
              </button>
            </div>

            {/* Main Image */}
            <div className="pd-main-img-wrap">
              <img 
                src={product.imageUrl || product.image || 'images/shirt.jpg'} 
                alt={product.productName || product.name} 
                className="pd-main-img"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/600x600?text=No+Image';
                }}
              />
            </div>
          </div>
        </div>

        {/* RIGHT: Product Details */}
        <div className="col-md-7 col-lg-8 pd-details-col">
          <div className="pd-details-inner">
            <div className="pd-brand">{product.brand || 'Karunada Collection'}</div>
            <h1 className="pd-title">{product.productName || product.name}</h1>

            {/* Rating row */}
            <div className="pd-rating-row">
              {reviewsData.totalReviews > 0 ? (
                <>
                  <span className="text-warning">
                    {'⭐'.repeat(Math.round(reviewsData.averageRating)) + '☆'.repeat(5 - Math.round(reviewsData.averageRating))}
                  </span>
                  <span className="text-muted ml-2">({reviewsData.totalReviews} reviews) · Average: {reviewsData.averageRating}/5</span>
                </>
              ) : (
                <span className="text-muted">No reviews yet</span>
              )}
            </div>

            {/* Sale Countdown */}
            <div className="pd-countdown-bar">
              <span className="pd-countdown-label">⚡ Sale ends in</span>
              <span className="pd-countdown-block">{timeLeft.hrs}</span>
              <span className="pd-countdown-sep">Hr</span>
              <span className="pd-countdown-block">{timeLeft.mins}</span>
              <span className="pd-countdown-sep">Min</span>
              <span className="pd-countdown-block">{timeLeft.secs}</span>
              <span className="pd-countdown-sep">Sec</span>
            </div>

            {/* Price section */}
            <div className="pd-price-row">
              <span className="pd-price">₹{product.price}</span>
              <span className="pd-mrp">₹{Math.round(product.price * 1.4)}</span>
              <span className="pd-discount">29% OFF</span>
              <span className="pd-hotdeal-badge">Hot Deal</span>
            </div>

            <hr className="pd-divider" />

            {/* Color section */}
            <div className="pd-section">
              <div className="pd-section-label">
                Selected Color: <strong>{selectedColor || '—'}</strong>
              </div>
              <div className="pd-color-strip">
                {colors.map(col => (
                  <button 
                    key={col}
                    onClick={() => setSelectedColor(col)}
                    className={`pd-color-swatch ${selectedColor === col ? 'active' : ''}`}
                    style={{
                      background: col.toLowerCase() === 'white' ? '#fff' : col.toLowerCase() === 'blue' ? '#3b82f6' : col.toLowerCase() === 'black' ? '#000' : 'gray',
                      border: '2px solid var(--border)'
                    }}
                    title={col}
                  />
                ))}
              </div>
            </div>

            {/* Size section */}
            <div className="pd-section">
              <div className="pd-section-label">
                Select Size
              </div>
              <div className="pd-size-chips">
                {sizes.map(sz => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`pd-size-chip ${selectedSize === sz ? 'active' : ''}`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="pd-section">
              <p className="pd-desc">{product.description || 'Premium comfort wear from Karunada.'}</p>
            </div>

            {/* CTA Buttons */}
            <div className="pd-cta-row">
              <button onClick={handleAddToCartClick} className="pd-btn-cart">
                🛒 Add to Cart
              </button>
              <button onClick={handleBuyNowClick} className="pd-btn-buy">
                ⚡ Buy Now
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pd-delivery-strip">
              <div className="pd-delivery-item">
                <span className="pd-delivery-icon">🚚</span>
                <span>Free delivery on orders above ₹499</span>
              </div>
              <div className="pd-delivery-item">
                <span className="pd-delivery-icon">🔄</span>
                <span>7-day easy return policy</span>
              </div>
              <div className="pd-delivery-item">
                <span className="pd-delivery-icon">✅</span>
                <span>100% original product guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="pd-reviews-section mt-5">
        <h4 className="pd-reviews-heading">Customer Reviews</h4>
        <div className="row">
          {/* Review list */}
          <div className="col-md-7 mb-4">
            <div id="reviewsList">
              {reviewsData.reviews.length === 0 ? (
                <p className="text-muted small">No reviews for this product yet. Be the first to share your thoughts!</p>
              ) : (
                reviewsData.reviews.map(r => (
                  <div key={r.reviewId} className="card mb-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <div className="card-body p-3">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <strong className="text-light">{r.userName || 'Anonymous'}</strong>
                        <span className="text-warning">{'⭐'.repeat(r.rating) + '☆'.repeat(5 - r.rating)}</span>
                      </div>
                      <p className="mb-0 text-secondary" style={{ fontSize: '0.85rem' }}>{r.comment}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Write review form */}
          <div className="col-md-5">
            <div className="pd-review-form card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="card-body">
                <h5 className="card-title mb-3">✍️ Write a Review</h5>
                <form onSubmit={handleReviewSubmit}>
                  {/* Rating picker */}
                  <div className="form-group">
                    <label className="pd-form-label">Your Rating</label>
                    <div className="pd-star-picker">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span 
                          key={star}
                          onClick={() => setRating(star)}
                          style={{ cursor: 'pointer', fontSize: '1.5rem', color: star <= rating ? 'var(--gold)' : 'gray' }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="pd-form-label">Comment</label>
                    <textarea 
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="form-control" 
                      rows="3"
                      placeholder="Share your experience…"
                      style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-block pd-submit-btn">Submit Review</button>
                  {reviewMsg && <div className="mt-2 font-weight-bold text-center small">{reviewMsg}</div>}
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
