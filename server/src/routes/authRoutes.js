import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Business } from '../models/Business.js';

export const authRouter = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'vnd_tech_jwt_secret_production_key_2026';

// Register a new business account
authRouter.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, gstin, address } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: 'Name, email, password and phone are required.' });
    }

    const existing = await Business.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Business account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const businessId = `biz_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const business = new Business({
      businessId,
      name,
      email: email.toLowerCase(),
      passwordHash,
      phone,
      gstin: gstin || '',
      address: address || '',
    });

    await business.save();

    const token = jwt.sign({ businessId, email: business.email }, JWT_SECRET, { expiresIn: '90d' });

    res.status(201).json({
      message: 'Business account created successfully.',
      token,
      business: {
        businessId: business.businessId,
        name: business.name,
        email: business.email,
        phone: business.phone,
        gstin: business.gstin,
      },
    });
  } catch (err) {
    console.error('[Auth] Registration error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// Login business account
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const business = await Business.findOne({ email: email.toLowerCase() });
    if (!business) {
      return res.status(401).json({ error: 'Invalid business email or password.' });
    }

    const isMatch = await bcrypt.compare(password, business.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid business email or password.' });
    }

    const token = jwt.sign({ businessId: business.businessId, email: business.email }, JWT_SECRET, {
      expiresIn: '90d',
    });

    res.json({
      message: 'Login successful.',
      token,
      business: {
        businessId: business.businessId,
        name: business.name,
        email: business.email,
        phone: business.phone,
        gstin: business.gstin,
        address: business.address,
      },
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Server error during authentication.' });
  }
});
