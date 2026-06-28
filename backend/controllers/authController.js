const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET || 'karunada-ecommerce-secret-key-2026-secure-jwt-token-signing-key-minimum-512-bits';
const EXPIRATION = Number(process.env.JWT_EXPIRATION || 86400000);

const register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: role || 'USER'
    });

    return res.status(200).json({
      message: 'User registered successfully',
      user: {
        id: user.userId,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    const token = jwt.sign(
      { id: user.userId, email: user.email, role: user.role },
      SECRET,
      { expiresIn: EXPIRATION / 1000 }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.userId,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'No account found with this email' });
    }

    const tempPass = 'Reset@' + Math.floor(1000 + Math.random() * 9000);
    const hashedTempPassword = await bcrypt.hash(tempPass, 10);
    
    user.password = hashedTempPassword;
    await user.save();

    // Mocking email log as done in Spring Boot
    console.log(`[MOCK EMAIL] Sending password reset code to ${email} (${user.name}): Temp password is ${tempPass}`);

    return res.status(200).json({ message: 'Password reset email sent (Mocked)' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  register,
  login,
  forgotPassword
};
