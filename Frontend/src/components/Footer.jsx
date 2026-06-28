import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="kc-footer">
      <p>
        © {new Date().getFullYear()} Karunada Collection &nbsp;|&nbsp;
        <Link to="/shop">Shop</Link> &nbsp;|&nbsp;
        <Link to="/cart">Cart</Link> &nbsp;|&nbsp;
        <Link to="/account">Account</Link> &nbsp;|&nbsp;
        <Link to="/login">Admin</Link>
      </p>
    </footer>
  );
}
