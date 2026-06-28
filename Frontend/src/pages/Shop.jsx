import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiGetProducts, apiGetReviews } from '../api';

const DEMO_PRODUCTS = [
  { productId: 'd1', productName: 'Classic Black Tee', category: 'T-Shirts', price: 499, size: 'L', color: 'Black', imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&q=80' },
  { productId: 'd2', productName: 'Slim Fit Chinos', category: 'Trousers', price: 1199, size: 'M', color: 'Blue', imageUrl: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=400&q=80' },
  { productId: 'd3', productName: 'Cargo Shorts', category: 'Shorts', price: 799, size: 'XL', color: 'White', imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=400&q=80' },
  { productId: 'd4', productName: 'Striped Polo', category: 'Polo', price: 699, size: 'M', color: 'Blue', imageUrl: 'https://images.unsplash.com/photo-1625910513473-4726a2d9dcd9?w=400&q=80' },
  { productId: 'd5', productName: 'Denim Jacket', category: 'Jackets', price: 2199, size: 'L', color: 'Blue', imageUrl: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400&q=80' },
  { productId: 'd6', productName: 'White Linen Shirt', category: 'Shirts', price: 899, size: 'M', color: 'White', imageUrl: 'https://images.unsplash.com/photo-1602810316498-ab67cf68c8e1?w=400&q=80' },
];

export default function Shop({ addToCart, showToast }) {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState({});
  
  // Filter States
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [favourites, setFavourites] = useState([]);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    try {
      const favs = JSON.parse(localStorage.getItem('karunadaFavourites') || '[]');
      setFavourites(favs.map(f => f.id));
    } catch (e) {
      setFavourites([]);
    }
  }, []);

  // Fetch products
  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await apiGetProducts();
        if (data && data.length > 0) {
          setProducts(data);
        } else {
          setProducts(DEMO_PRODUCTS);
        }
      } catch (err) {
        console.warn('Backend offline - using demo products');
        setProducts(DEMO_PRODUCTS);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  // Filter products based on search queries and selection options
  useEffect(() => {
    let result = [...products];

    // 1. Search Query
    const q = searchParams.get('q');
    if (q) {
      result = result.filter(p => 
        (p.productName || p.name || '').toLowerCase().includes(q.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(q.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(q.toLowerCase())
      );
    }

    // 2. Category filters (New Arrivals / Offers)
    const cat = searchParams.get('cat');
    if (location.pathname === '/new-arrivals' || cat === 'new') {
      result = [...result].reverse(); // reversed list mimics fresh arrivals
    } else if (location.pathname === '/offers' || cat === 'offers') {
      result = result.filter(p => p.price < 1000); // simulation of offers
    }

    // 3. Selected dropdown attributes
    if (size) {
      result = result.filter(p => p.size === size);
    }
    if (color) {
      result = result.filter(p => p.color === color);
    }

    setFilteredProducts(result);
  }, [products, searchParams, size, color]);

  // Fetch reviews ratings for visible products
  useEffect(() => {
    if (filteredProducts.length === 0) return;
    
    filteredProducts.forEach(async (p) => {
      const id = p.productId || p.id;
      if (ratings[id]) return; // already loaded
      try {
        const data = await apiGetReviews(id);
        if (data && data.totalReviews > 0) {
          setRatings(prev => ({
            ...prev,
            [id]: { avg: data.averageRating, total: data.totalReviews }
          }));
        }
      } catch (e) {
        // silent error
      }
    });
  }, [filteredProducts]);

  const toggleWishlist = (p) => {
    const id = p.productId || p.id;
    let favs = [];
    try {
      favs = JSON.parse(localStorage.getItem('karunadaFavourites') || '[]');
    } catch (e) {}

    const index = favs.findIndex(f => f.id === id);
    let added = false;
    if (index !== -1) {
      favs.splice(index, 1);
      setFavourites(prev => prev.filter(item => item !== id));
      showToast('Removed from Wishlist!', 'info');
    } else {
      favs.push({
        id,
        name: p.productName || p.name,
        price: p.price,
        image: p.imageUrl || p.image || 'images/shirt.jpg'
      });
      setFavourites(prev => [...prev, id]);
      showToast('Saved to Wishlist!', 'success');
      added = true;
    }
    localStorage.setItem('karunadaFavourites', JSON.stringify(favs));
    
    // Trigger header dispatch event if needed
    window.dispatchEvent(new Event('favouritesUpdated'));
  };

  const handleClear = () => {
    setSize('');
    setColor('');
  };

  const renderRating = (id) => {
    const r = ratings[id];
    if (!r) return <span className="text-muted small">No reviews yet</span>;
    const full = Math.round(r.avg);
    const stars = '⭐'.repeat(full) + '☆'.repeat(5 - full);
    return `${stars} (${r.total})`;
  };

  const handleAddToCart = (p) => {
    const id = p.productId || p.id;
    addToCart({
      id,
      name: p.productName || p.name,
      price: p.price,
      image: p.imageUrl || p.image || 'images/shirt.jpg',
      size: p.size || '',
      color: p.color || '',
    }, 1);
    showToast('Added to cart!', 'success');
  };

  return (
    <div className="container mt-4 mb-5">
      <h2>
        {searchParams.get('q') 
          ? `Search results for: "${searchParams.get('q')}"` 
          : location.pathname === '/new-arrivals' 
            ? '✨ New Arrivals' 
            : location.pathname === '/offers' 
              ? '🔥 Exclusive Offers' 
              : "Shop Men's Fashion"
        }
      </h2>

      {/* Filters Bar */}
      <div className="row mb-3 mt-3">
        <div className="col-md-3 mb-2">
          <select 
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="form-control"
          >
            <option value="">All Sizes</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
          </select>
        </div>
        <div className="col-md-3 mb-2">
          <select 
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="form-control"
          >
            <option value="">All Colors</option>
            <option value="Black">Black</option>
            <option value="Blue">Blue</option>
            <option value="White">White</option>
          </select>
        </div>
        <div className="col-md-3">
          <button onClick={handleClear} className="btn btn-secondary btn-block">
            Clear Filters
          </button>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="row mt-4">
          {[1, 2, 3, 4].map(idx => (
            <div key={idx} className="col-md-3 mb-4">
              <div className="skeleton-card" style={{ width: '100%' }}>
                <div className="skeleton skeleton-img"></div>
                <div className="skeleton-body">
                  <div className="skeleton skeleton-line"></div>
                  <div className="skeleton skeleton-line short"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="row mt-4">
          {filteredProducts.length === 0 ? (
            <div className="col-12 text-center py-5">
              <span style={{ fontSize: '3rem' }}>🔍</span>
              <h4 className="mt-3 text-muted">No products found.</h4>
            </div>
          ) : (
            filteredProducts.map(p => {
              const id = p.productId || p.id;
              const isFav = favourites.includes(id);
              return (
                <div key={id} className="col-md-3 mb-4">
                  <div className="card h-100" style={{ position: 'relative', border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                    {/* Favourite button */}
                    <button 
                      onClick={() => toggleWishlist(p)}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        zIndex: 2,
                        background: 'rgba(255,255,255,0.9)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        fontSize: '1.1rem',
                        cursor: 'pointer',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                      }}
                      title="Save to favourites"
                    >
                      {isFav ? '❤️' : '🤍'}
                    </button>

                    <Link to={`/product/${id}`}>
                      <img 
                        src={p.imageUrl || p.image || 'images/shirt.jpg'} 
                        className="card-img-top" 
                        alt={p.productName || p.name}
                        style={{ height: '200px', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                        }}
                      />
                    </Link>
                    <div className="card-body d-flex flex-column">
                      <h6 className="card-title mb-1">{p.productName || p.name}</h6>
                      <small className="text-muted">{p.category || ''}</small>
                      <div className="my-1 small text-warning">
                        {renderRating(id)}
                      </div>
                      <p className="font-weight-bold text-primary mb-2">₹{p.price}</p>
                      <div className="mt-auto d-flex">
                        <Link to={`/product/${id}`} className="btn btn-primary btn-sm flex-grow-1 mr-1">
                          View
                        </Link>
                        <button 
                          onClick={() => handleAddToCart(p)}
                          className="btn btn-secondary btn-sm flex-grow-1"
                        >
                          🛒 Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
