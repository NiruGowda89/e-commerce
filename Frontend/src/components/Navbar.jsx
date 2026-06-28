import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar({ cartCount, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const drawerRef = useRef(null);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  // Close drawer on outside click
  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setDrawerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [drawerOpen]);

  // Sync theme on load
  useEffect(() => {
    const savedTheme = localStorage.getItem('karunada_app_theme') || 'turquoise';
    document.body.classList.remove('theme-turquoise', 'theme-indigo', 'theme-dark', 'theme-purple');
    document.body.classList.add('theme-' + savedTheme);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const accountLink = user
    ? (user.role === 'SUPER_ADMIN' ? '/super-admin' : user.role === 'ADMIN' ? '/admin' : '/account')
    : '/login';
  const accountLabel = user
    ? (user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.role === 'ADMIN' ? 'Admin' : (user.name ? user.name.split(' ')[0] : 'Account'))
    : 'Login';

  return (
    <>
      <nav className="kc-nav">
        <div className="kc-nav-inner">
          {/* Hamburger — mobile only */}
          <button
            className="kc-hamburger"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <span /><span /><span />
          </button>

          <Link className="kc-logo" to="/">
            Karunada collection
            <span className="kc-logo-badge">NEW</span>
          </Link>

          {/* Desktop nav links */}
          <ul className="kc-nav-links">
            <li><Link to="/"            className={isActive('/')}><span className="nav-icon">🏠</span><span className="nav-label">Home</span></Link></li>
            <li><Link to="/shop"        className={isActive('/shop')}><span className="nav-icon">🛍️</span><span className="nav-label">Shop</span></Link></li>
            <li><Link to="/new-arrivals" className={isActive('/new-arrivals')}><span className="nav-icon">✨</span><span className="nav-label">New Arrivals</span></Link></li>
            <li><Link to="/offers"      className={isActive('/offers')}><span className="nav-icon">🏷️</span><span className="nav-label">Offers</span></Link></li>
          </ul>

          <div className="kc-nav-actions">
            {/* Search */}
            <button
              className="kc-icon-btn"
              onClick={() => setSearchOpen(!searchOpen)}
              title="Search"
            >
              <span className="btn-icon">🔍</span>
              <span className="btn-label">Search</span>
            </button>

            {/* Account — desktop */}
            <Link className="kc-icon-btn kc-account-btn" to={accountLink} title="Account">
              <span className="btn-icon">👤</span>
              <span className="btn-label">{accountLabel}</span>
            </Link>

            {/* Favourites */}
            <Link className="kc-icon-btn" to="/favourites" title="Favourites">
              <span className="btn-icon">❤️</span>
            </Link>

            {/* Cart */}
            <Link className="kc-icon-btn cart-icon-link" to="/cart" title="Cart">
              <span className="btn-icon">🛒</span>
              <span className="btn-label">Cart</span>
              {cartCount > 0 && <span className="kc-badge">{cartCount}</span>}
            </Link>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <form
            onSubmit={handleSearch}
            className="kc-search-bar"
          >
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              type="search"
              placeholder="Search products…"
              autoFocus
            />
            <button type="submit">Go</button>
          </form>
        )}
      </nav>

      {/* Mobile Drawer overlay */}
      {drawerOpen && <div className="kc-drawer-overlay" onClick={() => setDrawerOpen(false)} />}

      {/* Mobile Drawer */}
      <aside className={`kc-drawer ${drawerOpen ? 'open' : ''}`} ref={drawerRef}>
        <div className="kc-drawer-header">
          <span className="kc-drawer-brand">Karunada Collection</span>
          <button className="kc-drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close">✕</button>
        </div>

        {/* User info */}
        {user && (
          <div className="kc-drawer-user">
            <div className="kc-drawer-avatar">👤</div>
            <div>
              <div className="kc-drawer-username">{user.name || user.email}</div>
              <div className="kc-drawer-role">{user.role}</div>
            </div>
          </div>
        )}

        <nav className="kc-drawer-nav">
          <Link to="/"             className={`kc-drawer-link ${isActive('/')}`}>🏠 Home</Link>
          <Link to="/shop"         className={`kc-drawer-link ${isActive('/shop')}`}>🛍️ Shop</Link>
          <Link to="/new-arrivals" className={`kc-drawer-link ${isActive('/new-arrivals')}`}>✨ New Arrivals</Link>
          <Link to="/offers"       className={`kc-drawer-link ${isActive('/offers')}`}>🏷️ Offers</Link>
          <div className="kc-drawer-divider" />
          <Link to="/cart"         className={`kc-drawer-link ${isActive('/cart')}`}>
            🛒 Cart {cartCount > 0 && <span className="kc-drawer-badge">{cartCount}</span>}
          </Link>
          <Link to="/favourites"   className={`kc-drawer-link ${isActive('/favourites')}`}>❤️ Favourites</Link>
          <Link to={accountLink}   className={`kc-drawer-link ${isActive(accountLink)}`}>👤 {accountLabel}</Link>
        </nav>

        <div className="kc-drawer-footer">
          <p>© 2025 Karunada Collection</p>
        </div>
      </aside>
    </>
  );
}
