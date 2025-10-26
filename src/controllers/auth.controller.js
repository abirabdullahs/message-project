import { validationResult } from 'express-validator';
import User from '../models/User.model.js';
import { generateToken } from '../middlewares/auth.middleware.js';

export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, avatar } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (userExists) {
      return res.status(400).json({
        error: 'User already exists',
        field: userExists.email === email ? 'email' : 'username'
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
        token: generateToken(user._id)
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      details: error.message
    });
  }
};

export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Update lastSeen and online status
    user.lastSeen = new Date();
    user.online = true;
    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      status: user.status,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      details: error.message
    });
  }
};

export const logout = async (req, res) => {
  try {
    // Update user's online status and lastSeen
    await User.findByIdAndUpdate(req.user._id, {
      online: false,
      lastSeen: new Date()
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      details: error.message
    });
  }
};

export const googleAuth = async (req, res) => {
  try {
    const { email, username, avatar } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      // create with random password
      const randomPass = Math.random().toString(36).slice(-12) + Date.now();
      user = await User.create({
        username: username || email.split('@')[0],
        email,
        password: randomPass,
        avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username || email}`
      });
    }

    // Update online status
    user.lastSeen = new Date();
    user.online = true;
    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      status: user.status,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};