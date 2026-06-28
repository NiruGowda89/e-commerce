import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiLogin, apiRegister, apiForgotPassword } from '../api';

export default function Login({ setUser, showToast }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [activeForm, setActiveForm] = useState('login'); // 'login', 'register', 'forgot'

  // Input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [confPassword, setConfPassword] = useState('');

  // Status message
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Clear forms on swap
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setConfPassword('');
    setErrorMsg('');
  }, [activeForm]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Please fill in all credentials.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      // Save details to storage
      localStorage.setItem('urbanManUser', JSON.stringify({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
        role: data.user.role
      }));
      localStorage.setItem('authToken', data.token);

      setUser(data.user);
      showToast('Logged in successfully!', 'success');

      // Redirect
      const redirect = searchParams.get('redirect') || '/';
      navigate(redirect);
    } catch (err) {
      setErrorMsg(err.message || 'Invalid credentials or connection issue.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name || !email || !password || !confPassword) {
      setErrorMsg('Please fill all mandatory fields.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (password !== confPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await apiRegister({ name, email, phone, password });
      showToast('Registered successfully! Please login.', 'success');
      setActiveForm('login');
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email) {
      setErrorMsg('Email address is required.');
      return;
    }

    setLoading(true);
    try {
      await apiForgotPassword(email);
      showToast('Mock password reset code printed to console logs!', 'info');
      setActiveForm('login');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send password reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <div className="card p-4" style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '16px' }}>
        
        {/* Toggle Headings */}
        {activeForm !== 'forgot' && (
          <div className="d-flex border-bottom pb-2 mb-4" style={{ borderColor: 'var(--border)' }}>
            <button 
              onClick={() => setActiveForm('login')}
              className="btn flex-grow-1 font-weight-bold" 
              style={{ color: activeForm === 'login' ? 'var(--accent)' : 'gray', border: 'none', background: 'none' }}
            >
              Sign In
            </button>
            <button 
              onClick={() => setActiveForm('register')}
              className="btn flex-grow-1 font-weight-bold" 
              style={{ color: activeForm === 'register' ? 'var(--accent)' : 'gray', border: 'none', background: 'none' }}
            >
              Register
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="alert alert-danger p-2 small text-center mb-3">
            {errorMsg}
          </div>
        )}

        {/* 1. SIGN IN FORM */}
        {activeForm === 'login' && (
          <form onSubmit={handleLogin}>
            <h4 className="text-light mb-3 text-center">Welcome Back</h4>
            <div className="form-group">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address" 
                className="form-control"
                style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                required
              />
            </div>
            <div className="form-group">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password" 
                className="form-control"
                style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block py-2 font-weight-bold" disabled={loading}>
              {loading ? 'Signing In…' : 'Sign In'}
            </button>
            <div className="text-center mt-3">
              <button 
                type="button"
                onClick={() => setActiveForm('forgot')}
                className="btn btn-link btn-sm text-secondary p-0"
              >
                Forgot Password?
              </button>
            </div>
          </form>
        )}

        {/* 2. REGISTER FORM */}
        {activeForm === 'register' && (
          <form onSubmit={handleRegister}>
            <h4 className="text-light mb-3 text-center">Create Account</h4>
            <div className="form-group">
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name *" 
                className="form-control"
                style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                required
              />
            </div>
            <div className="form-group">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address *" 
                className="form-control"
                style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                required
              />
            </div>
            <div className="form-group">
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone Number" 
                className="form-control"
                style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
              />
            </div>
            <div className="form-group">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (Min 6 chars) *" 
                className="form-control"
                style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                required
              />
            </div>
            <div className="form-group">
              <input 
                type="password" 
                value={confPassword}
                onChange={(e) => setConfPassword(e.target.value)}
                placeholder="Confirm Password *" 
                className="form-control"
                style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                required
              />
            </div>
            <button type="submit" className="btn btn-success btn-block py-2 font-weight-bold" disabled={loading}>
              {loading ? 'Creating Account…' : 'Register'}
            </button>
          </form>
        )}

        {/* 3. FORGOT PASSWORD FORM */}
        {activeForm === 'forgot' && (
          <form onSubmit={handleForgotPassword}>
            <h4 className="text-light mb-3 text-center">Reset Password</h4>
            <p className="small text-secondary text-center mb-4">Enter your email and we'll send you a temporary password reset code.</p>
            <div className="form-group">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address" 
                className="form-control"
                style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block py-2 font-weight-bold" disabled={loading}>
              {loading ? 'Requesting code…' : 'Reset Password'}
            </button>
            <div className="text-center mt-3">
              <button 
                type="button"
                onClick={() => setActiveForm('login')}
                className="btn btn-link btn-sm text-secondary p-0"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
