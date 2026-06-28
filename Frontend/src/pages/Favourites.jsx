import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Favourites({ showToast }) {
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    try {
      const favs = JSON.parse(localStorage.getItem('karunadaFavourites') || '[]');
      setWishlist(favs);
    } catch (e) {
      setWishlist([]);
    }
  }, []);

  const handleRemove = (id) => {
    const updated = wishlist.filter(item => item.id !== id);
    setWishlist(updated);
    localStorage.setItem('karunadaFavourites', JSON.stringify(updated));
    showToast('Removed from Wishlist!', 'info');
    
    // Dispatch global event to sync badges if needed
    window.dispatchEvent(new Event('favouritesUpdated'));
  };

  return (
    <div className="container mt-4 mb-5" style={{ minHeight: '60vh' }}>
      <h2>❤️ My Wishlist</h2>
      
      {wishlist.length === 0 ? (
        <div className="text-center py-5 mt-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <span style={{ fontSize: '3rem' }}>❤️</span>
          <h4 className="mt-3 text-muted">Your wishlist is empty</h4>
          <p className="small text-secondary">Save items you love while shopping to view them here.</p>
          <Link to="/shop" className="btn btn-primary mt-2">Browse Catalog</Link>
        </div>
      ) : (
        <div className="row mt-4">
          {wishlist.map(p => (
            <div key={p.id} className="col-6 col-md-3 mb-4">
              <div className="card h-100" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ position: 'relative' }}>
                  <img 
                    src={p.image || 'images/shirt.jpg'} 
                    className="card-img-top" 
                    style={{ height: '180px', objectFit: 'cover' }}
                    alt={p.name}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/200x180?text=?'; }}
                  />
                  <button 
                    onClick={() => handleRemove(p.id)}
                    style={{ 
                      position: 'absolute', 
                      top: '8px', 
                      right: '8px', 
                      background: 'rgba(255,255,255,0.9)', 
                      border: 'none', 
                      borderRadius: '50%', 
                      width: '32px', 
                      height: '32px', 
                      fontSize: '1rem', 
                      cursor: 'pointer',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                    }}
                    title="Remove"
                  >
                    ❤️
                  </button>
                </div>
                <div className="card-body p-2 d-flex flex-column">
                  <h6 className="card-title mb-1 text-light small text-truncate">{p.name}</h6>
                  <p className="text-primary mb-2 font-weight-bold" style={{ fontSize: '0.9rem' }}>₹{p.price}</p>
                  <Link to={`/product/${p.id}`} className="btn btn-primary btn-sm btn-block mt-auto">View Product</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
