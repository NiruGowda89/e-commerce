import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiGetProducts } from '../api';

const DEMO_PRODUCTS = [
  { productId: 'd1', productName: 'Classic Black Tee', category: 'T-Shirts', price: 499, imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&q=80' },
  { productId: 'd2', productName: 'Slim Fit Chinos', category: 'Trousers', price: 1199, imageUrl: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=400&q=80' },
  { productId: 'd3', productName: 'Cargo Shorts', category: 'Shorts', price: 799, imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=400&q=80' },
  { productId: 'd4', productName: 'Striped Polo', category: 'Polo', price: 699, imageUrl: 'https://images.unsplash.com/photo-1625910513473-4726a2d9dcd9?w=400&q=80' },
  { productId: 'd5', productName: 'Denim Jacket', category: 'Jackets', price: 2199, imageUrl: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400&q=80' },
  { productId: 'd6', productName: 'White Linen Shirt', category: 'Shirts', price: 899, imageUrl: 'https://images.unsplash.com/photo-1602810316498-ab67cf68c8e1?w=400&q=80' },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  
  const featRailRef = useRef(null);
  const newRailRef = useRef(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await apiGetProducts();
        if (data && data.length > 0) {
          setProducts(data);
          setIsDemo(false);
        } else {
          setProducts(DEMO_PRODUCTS);
          setIsDemo(true);
        }
      } catch (err) {
        console.warn('Backend offline - using demo products', err);
        setProducts(DEMO_PRODUCTS);
        setIsDemo(true);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const handleScroll = (ref, dir) => {
    if (ref.current) {
      ref.current.scrollBy({ left: dir === 'right' ? 230 : -230, behavior: 'smooth' });
    }
  };

  const renderCard = (p) => {
    const img = p.imageUrl || p.image || '';
    const id = p.productId || p.id || '';
    
    return (
      <Link key={id} className="pk-card" to={`/product/${id}`} title={p.productName || p.name}>
        {isDemo && (
          <span style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            background: 'rgba(99,102,241,0.85)',
            color: '#fff',
            fontSize: '0.6rem',
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: '20px',
            letterSpacing: '.5px',
            backdropFilter: 'blur(4px)',
            zIndex: 1
          }}>DEMO</span>
        )}
        {img ? (
          <img 
            className="pk-card-img" 
            src={img} 
            alt={p.productName || p.name} 
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className="pk-card-img-placeholder" style={{ display: img ? 'none' : 'flex' }}>
          👕
        </div>
        <div className="pk-card-body">
          <div className="pk-card-cat">{p.category}</div>
          <div className="pk-card-name">{p.productName || p.name}</div>
          <div className="pk-card-price">₹{Number(p.price || 0).toLocaleString('en-IN')}</div>
        </div>
      </Link>
    );
  };

  const renderSkeletons = () => (
    [1, 2, 3, 4].map(idx => (
      <div key={idx} className="skeleton-card">
        <div className="skeleton skeleton-img"></div>
        <div className="skeleton-body">
          <div className="skeleton skeleton-line"></div>
          <div className="skeleton skeleton-line short"></div>
        </div>
      </div>
    ))
  );

  return (
    <div>
      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stats-bar-inner">
          <div className="stat-item">
            <div className="stat-icon">🛍️</div>
            <div>
              <div className="stat-label">Products</div>
              <div className="stat-value">{products.length || '—'}</div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">📦</div>
            <div>
              <div className="stat-label">Orders</div>
              <div className="stat-value">Fast Track</div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">💎</div>
            <div>
              <div className="stat-label">New Arrivals</div>
              <div className="stat-value">Weekly</div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">🔥</div>
            <div>
              <div className="stat-label">Offers</div>
              <div className="stat-value">Up to 29% <span className="stat-change">OFF</span></div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">⚡</div>
            <div>
              <div className="stat-label">Delivery</div>
              <div className="stat-value">Instant</div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="hero-banner-wrap" style={{ padding: '20px 20px 0' }}>
        <div className="hero-banner">
          <div className="hero-glow"></div>
          <div className="hero-slash-2"></div>
          <div className="hero-slash"></div>

          <div className="hero-content">
            <div className="hero-left">
              <div className="hero-badge">✨ Ultra-Modern Collection</div>
              <div className="hero-title">
                The Ultimate<br />Men's Fashion<br />Experience.
              </div>
              <Link to="/shop" className="hero-cta">
                Shop Now →
              </Link>
              <div className="hero-dots">
                <div className="hero-dot active"></div>
                <div className="hero-dot"></div>
                <div className="hero-dot"></div>
              </div>
            </div>
            <div className="hero-right">
              <div className="hero-obj">🪄</div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="page-section">
        <div className="section-hdr">
          <div className="section-hdr-left">
            <h2>Featured Products</h2>
            <p>Handpicked styles just for you</p>
          </div>
          <div className="section-nav">
            <button className="section-nav-btn" onClick={() => handleScroll(featRailRef, 'left')} title="Previous">‹</button>
            <button className="section-nav-btn" onClick={() => handleScroll(featRailRef, 'right')} title="Next">›</button>
          </div>
        </div>

        <div className="product-rail-wrap">
          <div className="product-rail" ref={featRailRef}>
            {loading ? renderSkeletons() : products.slice(0, 10).map(renderCard)}
          </div>
        </div>
      </div>

      {/* New Arrivals */}
      <div className="page-section" style={{ paddingTop: 0 }}>
        <div className="section-hdr">
          <div className="section-hdr-left">
            <h2>New Arrivals</h2>
            <p>Fresh styles just landed this week</p>
          </div>
          <div className="section-nav">
            <button className="section-nav-btn" onClick={() => handleScroll(newRailRef, 'left')} title="Previous">‹</button>
            <button className="section-nav-btn" onClick={() => handleScroll(newRailRef, 'right')} title="Next">›</button>
          </div>
        </div>

        <div className="product-rail-wrap">
          <div className="product-rail" ref={newRailRef}>
            {loading ? renderSkeletons() : [...products].reverse().slice(0, 10).map(renderCard)}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="page-section" style={{ paddingTop: 0 }}>
        <div className="row">
          <div className="col-md-6 mb-3">
            <Link className="ql-card" to="/new-arrivals">
              <div className="ql-icon">✨</div>
              <div>
                <div className="ql-title">New Arrivals</div>
                <div className="ql-sub">Fresh styles every week</div>
              </div>
              <div className="ql-arrow">›</div>
            </Link>
          </div>
          <div className="col-md-6 mb-3">
            <Link className="ql-card" to="/offers">
              <div className="ql-icon danger-bg">🔥</div>
              <div>
                <div className="ql-title">Exclusive Offers</div>
                <div className="ql-sub">Up to 29% off on select items</div>
              </div>
              <div className="ql-arrow">›</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
