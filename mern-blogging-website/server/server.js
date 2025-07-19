import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt'
import 'dotenv/config'
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs from 'fs';
import { google } from 'googleapis';
import { v2 as cloudinary } from 'cloudinary';
import { OAuth2Client } from 'google-auth-library';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';
import axios from 'axios';
import { sendNewsletterToSubscribers, sendNewsletterToSubscriber, sendContactNotification } from './utils/email.js';
// Security middleware imports
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';

//schema
import User from './Schema/User.js'
import Blog from './Schema/Blog.js'
import Notification from './Schema/Notification.js'
import Newsletter from './Schema/Newsletter.js'
import Comment from './Schema/Comment.js'
import Contact from './Schema/Contact.js'
import AdminStatusChangeRequest from './Schema/AdminStatusChangeRequest.js'
import MaintenanceLog from './Schema/MaintenanceLog.js';
import SystemHealthLog from './Schema/SystemHealthLog.js';
import AdBanner from './Schema/AdBanner.js';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = express();

// Trust proxy for production deployment (Railway, Vercel, etc.)
server.set('trust proxy', 1);

let PORT = process.env.PORT || 3000;
let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/; // Enhanced password regex

// List all allowed frontend origins (production, preview, local dev)
const allowedOrigins = [
  'https://iblog-site-mern-b5u8.vercel.app', // production
  'https://iblog-site-mern-lovat.vercel.app', // preview
  'http://localhost:5173', // local dev (Vite)
  'http://localhost:5174', // local dev (Vite)
  'http://localhost:3000'  // local dev (React)
];

function isAllowedOrigin(origin) {
    if (!origin) return true; // Allow non-browser requests (Postman, curl)
    if (allowedOrigins.includes(origin)) return true;
    // Allow all Vercel preview domains for main and admin panel
    if (/^https:\/\/iblog-site-mern(-admin)?-[a-z0-9]+-areebaahmad123s-projects\.vercel\.app$/.test(origin)) return true;
    return false;
  }

// CORS middleware (must be before any routes)
server.use(cors({
  origin: function (origin, callback) {
    console.log('CORS request from:', origin);
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'X-Content-Type-Options', 'X-Frame-Options'],
  exposedHeaders: ['X-Total-Count'],
  optionsSuccessStatus: 200
}));
// Handle preflight requests for all routes
server.options('*', cors({
  origin: function (origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'X-Content-Type-Options', 'X-Frame-Options'],
  exposedHeaders: ['X-Total-Count']
}));

// ===== SECURITY MIDDLEWARE =====

// Cookie parser for CSRF tokens
server.use(cookieParser(process.env.SESSION_SECRET || 'default-secret'));

// ====== CSRF PROTECTION (using csurf) ======
// Remove global csurf middleware
// server.use(csurf({ cookie: { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' } }));
// server.use((err, req, res, next) => {
//   if (err.code === 'EBADCSRFTOKEN') {
//     return res.status(403).json({ error: 'Invalid CSRF token' });
//   }
//   next(err);
// });

// Helper: CSRF error handler
const csrfErrorHandler = (err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  next(err);
};

// Apply CSRF protection ONLY to sensitive/auth routes

const csrfProtection = csurf({
  cookie: getCSRFCookieOptions()
});

// Generate CSRF token
function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Security headers
server.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"], // No 'unsafe-inline' or 'unsafe-eval'
      connectSrc: ["'self'"],
      frameSrc: ["'self'", "https://accounts.google.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 5000, // much higher limit for development
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(15 * 60 / 60) // 15 minutes in minutes
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
server.use(limiter);

// Specific rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: Math.ceil(15 * 60 / 60)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Speed limiting
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: (used, req) => {
    const delayAfter = req.slowDown.limit;
    return (used - delayAfter) * 500;
  }
});

server.use(speedLimiter);

// Prevent NoSQL injection
server.use(mongoSanitize());

// Prevent HTTP Parameter Pollution
server.use(hpp());

// Body parsing with size limits
server.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ error: 'Invalid JSON' });
      throw new Error('Invalid JSON');
    }
  }
}));
server.use(express.urlencoded({ 
  limit: '10mb', 
  extended: true,
  parameterLimit: 1000
}));

// Static files with security headers
server.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('X-XSS-Protection', '1; mode=block');
  }
}));

// ===== DATABASE CONNECTION =====

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
});

mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected from MongoDB');
});

// ===== JWT CONFIGURATION =====

const JWT_AUDIENCE = 'islamic-stories-users';
const JWT_ISSUER = 'islamic-stories-server';
const JWT_EXPIRES_IN = '1h'; // Reduced from 1 day to 1 hour for better security

// ===== SECURITY UTILITIES =====

// Input sanitization function
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

// Validate and sanitize email
const validateEmail = (email) => {
  const sanitizedEmail = sanitizeInput(email).toLowerCase();
  return emailRegex.test(sanitizedEmail) ? sanitizedEmail : null;
};

// Enhanced password validation
const validatePassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  return passwordRegex.test(password);
};

// ===== MIDDLEWARE FUNCTIONS =====

const formatDatatoSend = (user) => {
    const access_token = jwt.sign(
        { 
          id: user._id, 
          admin: user.admin,
          iat: Math.floor(Date.now() / 1000),
          type: 'access'
        },
        process.env.SECRET_ACCESS_KEY,
        {
            expiresIn: JWT_EXPIRES_IN,
            audience: JWT_AUDIENCE,
            issuer: JWT_ISSUER
        }
    );
    
    // Generate refresh token
    const refresh_token = jwt.sign(
        { 
          id: user._id,
          type: 'refresh'
        },
        process.env.SECRET_ACCESS_KEY,
        {
            expiresIn: '7d',
            audience: JWT_AUDIENCE,
            issuer: JWT_ISSUER
        }
    );
    
    return {
        profile_img: user.personal_info.profile_img,
        username: user.personal_info.username,
        fullname: user.personal_info.fullname,
        isAdmin: user.admin,
        bookmarked_blogs: user.bookmarked_blogs || [],
        liked_blogs: user.liked_blogs || []
    };
};

const verifyJWT = async (req, res, next) => {
    // Only read token from cookie for security
    const token = req.cookies['access_token'];
    console.log('[verifyJWT] Access token from cookie:', token ? 'Present' : 'Missing');
    
    if (!token) {
        console.warn('[verifyJWT] No access token provided in cookies.');
        return res.status(401).json({ error: "No access token provided" });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.SECRET_ACCESS_KEY, {
            audience: JWT_AUDIENCE,
            issuer: JWT_ISSUER
        });
        console.log('[verifyJWT] Decoded JWT:', decoded);
        // Check if token is an access token
        if (decoded.type !== 'access') {
            console.warn('[verifyJWT] Invalid token type:', decoded.type);
            return res.status(401).json({ error: "Invalid token type" });
        }
        // Always fetch user from DB to get current admin status
        const user = await User.findById(decoded.id).select('_id admin super_admin verified active');
        if (!user) {
            console.warn('[verifyJWT] User does not exist:', decoded.id);
            return res.status(401).json({ error: "User does not exist" });
        }
        if (!user.verified) {
            console.warn('[verifyJWT] User account not verified:', decoded.id);
            return res.status(401).json({ error: "User account not verified" });
        }
        if (!user.active) {
            return res.status(403).json({ error: "Your account is deactivated. Please contact support or an admin." });
        }
        req.user = decoded.id;
        req.admin = user.admin || user.super_admin; // Allow super_admin as admin
        req.super_admin = user.super_admin;
        req.userData = decoded;
        next();
    } catch (err) {
        console.error('[verifyJWT] JWT verification error:', err);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: "Access token expired" });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(403).json({ error: "Invalid access token" });
        }
        return res.status(403).json({ error: "Access token verification failed" });
    }
};

// Admin-only middleware
const requireAdmin = (req, res, next) => {
    if (!req.admin && !req.super_admin) {
        return res.status(403).json({ error: "Admin access required" });
    }
    next();
};

// Input validation middleware
const validateSignupInput = [
    body('firstname')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('First name must be between 1 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('First name can only contain letters and spaces'),
    body('lastname')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Last name must be between 1 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Last name can only contain letters and spaces'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('password')
        .isLength({ min: 8, max: 128 })
        .withMessage('Password must be between 8 and 128 characters')
        .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

const validateLoginInput = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

const validateChangePasswordInput = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 8, max: 128 })
        .withMessage('New password must be between 8 and 128 characters')
        .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
        .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

// Error handling middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Validation failed',
            details: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

const generateUsername = async (email) => {
    let username = email.split("@")[0];
    let isUsernameNotUnique = await User.exists({ "personal_info.username": username });
    isUsernameNotUnique ? username += nanoid(5) : "";
    return username;
};

// ===== ROUTES =====
// Admin: Search users by name, username, or email
server.post("/api/admin/search-users", verifyJWT, requireAdmin, async (req, res) => {
    try {
        const { query } = req.body;
        if (!query || typeof query !== 'string' || !query.trim()) {
            return res.status(200).json({ users: [] });
        }
        const regex = new RegExp(query.trim(), 'i');
        const users = await User.find({
            $or: [
                { 'personal_info.fullname': regex },
                { 'personal_info.username': regex },
                { 'personal_info.email': regex }
            ]
        }).select('-personal_info.password');
        return res.status(200).json({ users });
    } catch (err) {
        console.error('Admin search-users error:', err);
        return res.status(500).json({ error: 'Failed to search users.' });
    }
});

// Apply auth rate limiting to authentication endpoints

server.post("/api/signup", csrfProtection, csrfErrorHandler, validateSignupInput, handleValidationErrors, async (req, res) => {
    try {
        const { firstname, lastname, email, password, recaptchaToken } = req.body;
        // Verify reCAPTCHA
        if (!recaptchaToken) {
            return res.status(400).json({ error: 'CAPTCHA is required.' });
        }
        const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
        const recaptchaResponse = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
            params: {
                secret: recaptchaSecret,
                response: recaptchaToken
            }
        });
        if (!recaptchaResponse.data.success) {
            return res.status(400).json({ error: 'CAPTCHA verification failed. Please try again.' });
        }
        const fullname = (firstname + ' ' + lastname).trim();

        // Additional validation
        if (fullname.length < 3) {
            return res.status(400).json({ "error": "Full name must be at least 3 characters long" });
        }

        // Check if user already exists
        let user = await User.findOne({ "personal_info.email": email });
        if (user && user.verified) {
            return res.status(409).json({ error: "Email already exists and is verified" });
        }

        // Hash password with higher salt rounds
        const hashedPassword = await bcrypt.hash(password, 12);
        const username = await generateUsername(email);
        const verificationToken = nanoid(32);

        if (!user) {
            // Create new user as unverified
            user = new User({
                personal_info: {
                    firstname: sanitizeInput(firstname),
                    lastname: sanitizeInput(lastname),
                    fullname: sanitizeInput(fullname),
                    email: email.toLowerCase(),
                    password: hashedPassword,
                    username: sanitizeInput(username)
                },
                verificationToken
            });
            await user.save();
        } else {
            // Update existing unverified user
            user.personal_info.firstname = sanitizeInput(firstname);
            user.personal_info.lastname = sanitizeInput(lastname);
            user.personal_info.fullname = sanitizeInput(fullname);
            user.personal_info.password = hashedPassword;
            user.personal_info.username = sanitizeInput(username);
            user.verificationToken = verificationToken;
            await user.save();
        }

        // Create transporter for sending email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.ADMIN_EMAIL,
                pass: process.env.ADMIN_EMAIL_PASSWORD
            }
        });
        
        const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-user?token=${verificationToken}`;
        
        // Send verification email
        try {
            await transporter.sendMail({
                from: `Islamic Stories <${process.env.ADMIN_EMAIL}>`,
                to: email,
                subject: 'Verify your email address',
                text: `Thank you for signing up! Please verify your email by clicking this link: ${verifyUrl}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Welcome to Islamic Stories!</h2>
                        <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
                        <a href="${verifyUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a>
                        <p>If the button doesn't work, copy and paste this link into your browser:</p>
                        <p>${verifyUrl}</p>
                        <p>This link will expire in 24 hours.</p>
                    </div>
                `
            });
        } catch (emailErr) {
            console.error('Error sending verification email:', emailErr);
            return res.status(500).json({ error: 'Failed to send verification email. Please try resending.' });
        }

        // Generate tokens
        const access_token = jwt.sign(
            { id: user._id, admin: user.admin || user.super_admin, super_admin: user.super_admin, iat: Math.floor(Date.now() / 1000), type: 'access' },
            process.env.SECRET_ACCESS_KEY,
            { expiresIn: JWT_EXPIRES_IN, audience: JWT_AUDIENCE, issuer: JWT_ISSUER }
        );
        const refresh_token = jwt.sign(
            { id: user._id, type: 'refresh' },
            process.env.SECRET_ACCESS_KEY,
            { expiresIn: '7d', audience: JWT_AUDIENCE, issuer: JWT_ISSUER }
        );
        // Set httpOnly cookies
        res.cookie('access_token', access_token, getCookieOptions({ crossSite: true, maxAge: 60 * 60 * 1000 }));
        res.cookie('refresh_token', refresh_token, getCookieOptions({ crossSite: true, maxAge: 7 * 24 * 60 * 60 * 1000 }));
        res.cookie('user_data', JSON.stringify(user), getCookieOptions({ crossSite: true, maxAge: 7 * 24 * 60 * 60 * 1000 }));

        // Set CSRF token
        const csrfToken = generateCSRFToken();
        res.cookie('csrf-token', csrfToken, getCSRFCookieOptions());

        return res.status(201).json({
            message: "Signup successful. Please verify your email.",
            user: {
                profile_img: user.personal_info.profile_img,
                username: user.personal_info.username,
                fullname: user.personal_info.fullname,
                admin: user.admin, // Use 'admin' field
                super_admin: user.super_admin, // Add this line
                bookmarked_blogs: user.bookmarked_blogs || [],
                liked_blogs: user.liked_blogs || []
            }
        });
    } catch (err) {
        console.error('Signup error:', err);
        return res.status(500).json({ error: 'Internal server error. Please try again.' });
    }
});

server.post("/api/login", csrfProtection, csrfErrorHandler, validateLoginInput, handleValidationErrors, async (req, res) => {
    try {
        let { email, password } = req.body;

        const user = await User.findOne({ "personal_info.email": email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }
        if (!user.active) {
            return res.status(403).json({ error: "Your account is deactivated. Please contact support or an admin." });
        }

        // Prevent Google-auth users from logging in with password
        if (user.google_auth) {
            return res.status(403).json({ error: "This account was created with Google. Please use the 'Continue with Google' button to sign in." });
        }

        // Only allow login if verified
        if (!user.verified) {
            return res.status(403).json({ error: "Please verify your email before logging in. Check your inbox for the verification link." });
        }

        const passwordMatch = await bcrypt.compare(password, user.personal_info.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Generate tokens
        const access_token = jwt.sign(
            { id: user._id, admin: user.admin || user.super_admin, super_admin: user.super_admin, iat: Math.floor(Date.now() / 1000), type: 'access' },
            process.env.SECRET_ACCESS_KEY,
            { expiresIn: JWT_EXPIRES_IN, audience: JWT_AUDIENCE, issuer: JWT_ISSUER }
        );
        const refresh_token = jwt.sign(
            { id: user._id, type: 'refresh' },
            process.env.SECRET_ACCESS_KEY,
            { expiresIn: '7d', audience: JWT_AUDIENCE, issuer: JWT_ISSUER }
        );
        // Set httpOnly cookies
        res.cookie('access_token', access_token, getCookieOptions({ crossSite: true, maxAge: 60 * 60 * 1000 }));
        res.cookie('refresh_token', refresh_token, getCookieOptions({ crossSite: true, maxAge: 7 * 24 * 60 * 60 * 1000 }));
        res.cookie('user_data', JSON.stringify(user), getCookieOptions({ crossSite: true, maxAge: 7 * 24 * 60 * 60 * 1000 }));

        // Set CSRF token
        const csrfToken = generateCSRFToken();
        res.cookie('csrf-token', csrfToken, getCSRFCookieOptions());

        console.log("[LOGIN] User admin status from DB:", {
            admin: user.admin,
            super_admin: user.super_admin,
            adminType: typeof user.admin,
            superAdminType: typeof user.super_admin
        });
        
        return res.status(200).json({
            message: "Login successful. You are now logged in.",
            user: {
                profile_img: user.personal_info.profile_img,
                username: user.personal_info.username,
                fullname: user.personal_info.fullname,
                admin: user.admin, // Use 'admin' field
                super_admin: user.super_admin, // Add this line
                bookmarked_blogs: user.bookmarked_blogs || [],
                liked_blogs: user.liked_blogs || [],
                access_token: access_token
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: "Internal server error. Please try again." });
    }
});

// Token validation endpoint
server.post("/api/validate-token", verifyJWT, (req, res) => {
    try {
        return res.status(200).json({ 
            valid: true, 
            message: "Token is valid",
            user: req.user 
        });
    } catch (err) {
        return res.status(401).json({ 
            valid: false, 
            error: "Token validation failed" 
        });
    }
});

// Token refresh endpoint
server.post("/api/refresh-token", async (req, res) => {
    try {
        // Get refresh token from cookie instead of request body
        const refreshToken = req.cookies['refresh_token'];
        
        if (!refreshToken) {
            return res.status(400).json({ error: "Refresh token is required" });
        }

        const decoded = jwt.verify(refreshToken, process.env.SECRET_ACCESS_KEY, {
            audience: JWT_AUDIENCE,
            issuer: JWT_ISSUER
        });

        if (decoded.type !== 'refresh') {
            return res.status(401).json({ error: "Invalid refresh token" });
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }

        if (!user.verified) {
            return res.status(401).json({ error: "User account not verified" });
        }

        if (!user.active) {
            return res.status(403).json({ error: "Your account is deactivated. Please contact support or an admin." });
        }

        // Generate new access token
        const newAccessToken = jwt.sign(
            { 
                id: user._id, 
                admin: user.admin || user.super_admin,
                super_admin: user.super_admin,
                iat: Math.floor(Date.now() / 1000),
                type: 'access'
            },
            process.env.SECRET_ACCESS_KEY,
            {
                expiresIn: JWT_EXPIRES_IN,
                audience: JWT_AUDIENCE,
                issuer: JWT_ISSUER
            }
        );
        
        // Set new access token cookie
        res.cookie('access_token', newAccessToken, getCookieOptions({ crossSite: true, maxAge: 60 * 60 * 1000 }));
        
        return res.status(200).json({ 
            message: "Token refreshed successfully",
            access_token: newAccessToken // Return access token for client-side storage
        });
    } catch (err) {
        console.error('Token refresh error:', err);
        return res.status(401).json({ error: "Invalid refresh token" });
    }
});

server.post("/api/get-profile", (req, res) => {
    let { username } = req.body;

    User.findOne({ "personal_info.username": username })
        .select("-personal_info.password -google_auth -updateAt -blogs")
        .then(user => {
            if (!user) return res.status(404).json({ error: "User not found" });
            // Add total_posts to the response
            const userObj = user.toObject();
            userObj.total_posts = user.account_info?.total_posts || 0;
            return res.status(200).json(userObj);
        })
        .catch(err => {
            console.log(err);
            return res.status(500).json({ error: err.message });
        });
});

server.post("/api/update-profile-img", verifyJWT, (req, res) => {
    let { url } = req.body;

    User.findOneAndUpdate({ _id: req.user }, { "personal_info.profile_img": url })
        .then(() => {
            return res.status(200).json({ profile_img: url });
        })
        .catch(err => {
            return res.status(500).json({ error: err.message });
        });
});

server.post("/api/update-profile", csrfProtection, csrfErrorHandler, verifyJWT, (req, res) => {
    let { firstname, lastname, email, username, bio, social_links } = req.body;
    let fullname = (firstname + ' ' + lastname).trim();
    let biolimit = 150;

    if (!firstname || firstname.length < 1) {
        return res.status(403).json({ error: "First name must be at least 1 letter long" });
    }
    if (!lastname || lastname.length < 1) {
        return res.status(403).json({ error: "Last name must be at least 1 letter long" });
    }
    if (!username || username.length < 3) {
        return res.status(403).json({ error: "Username should be at least 3 letters long" });
    }
    if ((bio || '').length > biolimit) {
        return res.status(403).json({ error: `Bio should not be more than ${biolimit} characters` });
    }

    let socialLinksArr = Object.keys(social_links);

    try {
        for (let i = 0; i < socialLinksArr.length; i++) {
            if (social_links[socialLinksArr[i]].length) {
                let hostname = new URL(social_links[socialLinksArr[i]]).hostname;
                if (!hostname.includes(`${socialLinksArr[i]}.com`) && socialLinksArr[i] !== "website") {
                    return res.status(403).json({ error: `${socialLinksArr[i]} link is invalid. You must enter a full ${socialLinksArr[i]} link` });
                }
            }
        }
    } catch (e) {
        return res.status(500).json({ error: "Social links are invalid" });
    }
    let updateObj = {
        "personal_info.firstname": firstname,
        "personal_info.lastname": lastname,
        "personal_info.fullname": fullname,
        "personal_info.email": email,
        "personal_info.username": username,
        "personal_info.bio": bio,
        social_links
    }

    User.findOneAndUpdate({ _id: req.user }, updateObj, {
        runValidators: true
    })
        .then(() => {
            return res.status(200).json({ username, fullname, email, firstname, lastname })
        })
        .catch(err => {
            if (err.code == 11000) {
                if (err.keyPattern.email) {
                    return res.status(500).json({ error: "Email is taken by another user" });
                } else {
                    return res.status(500).json({ error: "Username is taken by another user" });
                }
            }
            return res.status(500).json({ error: err.message });
        });
});

server.post("/api/change-password", csrfProtection, csrfErrorHandler, verifyJWT, validateChangePasswordInput, handleValidationErrors, async (req, res) => {
    try {
        let { currentPassword, newPassword } = req.body;

        // Check if new password is same as current password
        if (currentPassword === newPassword) {
            return res.status(400).json({ error: "New password must be different from current password" });
        }

        // Validate password strength
        if (!validatePassword(newPassword)) {
            return res.status(400).json({ 
                error: "New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*)" 
            });
        }

        const user = await User.findById(req.user);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.google_auth) {
            return res.status(403).json({ error: "You can't change account's password because you logged in through Google" });
        }

        const passwordMatch = await bcrypt.compare(currentPassword, user.personal_info.password);
        if (!passwordMatch) {
            return res.status(403).json({ error: "Incorrect current password" });
        }

        // Hash new password with higher salt rounds
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        
        await User.findByIdAndUpdate(req.user, { "personal_info.password": hashedPassword });
        
        return res.status(200).json({ 
            status: "password changed", 
            message: "Password updated successfully" 
        });
    } catch (err) {
        console.error('Change password error:', err);
        return res.status(500).json({ error: "Internal server error. Please try again." });
    }
});

function escapeRegex(string) {
    return string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

server.post("/api/search-blogs-count", (req, res) => {
    let { tag, author } = req.body;

    // Match the query from search-blogs endpoint
    let findQuery = { draft: false };
    
    if (tag && tag.trim()) {
        findQuery.tags = { $regex: new RegExp(tag.trim(), 'i') };
    }

    if (author) {
        findQuery.author = author;
    }

    Blog.countDocuments(findQuery)
        .then(count => {
            console.log(`Total blogs count for tag: ${tag}, author: ${author} = ${count}`);
            return res.status(200).json({ totalDocs: count });
        })
        .catch(err => {
            console.error("Error in search-blogs-count:", err);
            return res.status(500).json({ error: err.message });
        });
});

server.post("/api/search-blogs", (req, res) => {
    let { tag, author, page = 1, eleminate_blog, query } = req.body;

    let findQuery = { draft: false };
    let orConditions = [];

    // General search by title or description
    if (query && query.trim()) {
        const regex = new RegExp(query.trim(), 'i');
        orConditions.push(
            { title: regex },
            { des: regex }
        );
    }

    // Tag filter
    if (tag && tag.trim()) {
        findQuery.tags = { $regex: new RegExp(tag.trim(), 'i') };
    }

    // Author filter
    if (author) {
        findQuery.author = author;
    }

    // Exclude the current blog if eleminate_blog is provided
    if (eleminate_blog) {
        findQuery.blog_id = { ...(findQuery.blog_id || {}), $ne: eleminate_blog };
    }

    // If orConditions exist, add $or to the query
    if (orConditions.length > 0) {
        findQuery.$or = orConditions;
    }

    let maxLimit = 12;
    let skipDocs = (page - 1) * maxLimit;

    Blog.find(findQuery)
        .populate("author", "personal_info.fullname personal_info.username personal_info.profile_img")
        .sort({ "publishedAt": -1 })
        .select("title des banner activity publishedAt blog_id tags -_id")
        .skip(skipDocs)
        .limit(maxLimit)
        .then(blogs => {
            console.log(`Found ${blogs.length} blogs for query: ${query}, tag: ${tag}, author: ${author}, page: ${page}`);
            return res.status(200).json({ blogs });
        })
        .catch(err => {
            console.error("Error in search-blogs:", err);
            return res.status(500).json({ error: err.message });
        });
});

server.post("/api/all-latest-blogs-count", (req, res) => {
    Blog.countDocuments({ draft: false })
        .then(count => {
            return res.status(200).json({ totalDocs: count });
        })
        .catch(err => {
            return res.status(500).json({ error: err.message });
        });
});

server.get("/api/latest-blogs", (req, res) => {
    let maxLimit = 5;

    Blog.find({ draft: false })
        .populate("author", "personal_info.fullname personal_info.username personal_info.profile_img")
        .sort({ "publishedAt": -1 })
        .select("title des banner activity publishedAt blog_id tags -_id")
        .limit(maxLimit)
        .then(blogs => {
            return res.status(200).json({ blogs });
        })
        .catch(err => {
            return res.status(500).json({ error: err.message });
        });
});

server.post("/api/latest-blogs", (req, res) => {
    let { page = 1 } = req.body;
    let maxLimit = 12;
    let skipDocs = (page - 1) * maxLimit;

    Blog.find({ draft: false })
        .populate("author", "personal_info.fullname personal_info.username personal_info.profile_img")
        .sort({ "publishedAt": -1 })
        .select("title des banner activity publishedAt blog_id tags -_id")
        .skip(skipDocs)
        .limit(maxLimit)
        .then(blogs => {
            return res.status(200).json({ blogs });
        })
        .catch(err => {
            return res.status(500).json({ error: err.message });
        });
});

server.post("/api/user-written-blogs-count", verifyJWT, (req, res) => {
    try {
        let user_id = req.user;
        let { draft, query } = req.body;

        console.log(`Counting ${draft ? 'drafts' : 'published blogs'} for user:`, user_id);
        console.log('Count params:', { draft, query });

        let findQuery = { author: user_id, draft };
        if (query && query.trim()) {
            findQuery.title = new RegExp(query.trim(), "i");
        }

        console.log('Count query:', JSON.stringify(findQuery, null, 2));

        Blog.countDocuments(findQuery)
            .then(count => {
                console.log(`Total ${draft ? 'drafts' : 'published blogs'} count:`, count);
                return res.status(200).json({ totalDocs: count });
            })
            .catch(err => {
                console.error("Error counting blogs:", err);
                return res.status(500).json({ error: "Failed to count blogs" });
            });
    } catch (err) {
        console.error("Error in count endpoint:", err);
        return res.status(500).json({ error: "Failed to count blogs" });
    }
});

server.post("/api/delete-blog", verifyJWT, requireAdmin, async (req, res) => {
    let user_id = req.user;
    let isAdmin = req.admin;
    let { blogId } = req.body;

    if (!isAdmin) {
        return res.status(403).json({ error: "You don't have permissions to delete this blog" });
    }

    try {
        // Find and delete the blog
        const blog = await Blog.findOneAndDelete({ blog_id: blogId });
        if (!blog) {
            return res.status(404).json({ error: "Blog not found" });
        }

        // Delete associated notifications
        await Notification.deleteMany({ blog: blog._id });

        // Delete associated comments
        await Comment.deleteMany({ blog_id: blog._id });

        // Remove blog reference from the author's blogs array and decrement their total_posts
        await User.findOneAndUpdate(
            { _id: blog.author },
            { $pull: { blogs: blog._id }, $inc: { "account_info.total_posts": -1 } }
        );

        // Delete the banner image from Cloudinary if it exists and is a Cloudinary URL
        if (blog.banner && blog.banner.includes("cloudinary.com")) {
            try {
                // Extract public_id from the URL
                const matches = blog.banner.match(/\/([^\/]+)\.(jpg|jpeg|png|gif|webp)$/i);
                if (matches && matches[1]) {
                    const publicId = `blog-profiles/${matches[1]}`;
                    await cloudinary.uploader.destroy(publicId);
                }
            } catch (imgErr) {
                // Log but don't fail the whole operation if image deletion fails
                console.error('Failed to delete banner image from Cloudinary:', imgErr);
            }
        }

        console.log(`[BLOG DELETE] Admin: ${user_id}, Blog ID: ${blogId}, Title: ${blog.title}`);
        return res.status(200).json({ status: 'done' });
    } catch (err) {
        console.error('Error deleting blog:', err);
        return res.status(500).json({ error: "Failed to delete blog. Please try again or contact support if the problem persists." });
    }
});

// Test endpoint to check server and Cloudinary status
server.get("/api/test-upload", async (req, res) => {
    try {
        console.log("Testing upload service...");
        
        // Check Cloudinary configuration
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            return res.status(500).json({ 
                error: "Cloudinary configuration missing",
                cloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
                apiKey: !!process.env.CLOUDINARY_API_KEY,
                apiSecret: !!process.env.CLOUDINARY_API_SECRET
            });
        }

        // Test Cloudinary connection with a simple API call
        const result = await cloudinary.api.ping();
        
        res.json({ 
            success: true, 
            message: "Upload service is working",
            cloudinary: result,
            config: {
                cloudName: process.env.CLOUDINARY_CLOUD_NAME,
                hasApiKey: !!process.env.CLOUDINARY_API_KEY,
                hasApiSecret: !!process.env.CLOUDINARY_API_SECRET
            }
        });
    } catch (error) {
        console.error("Test upload error:", error);
        res.status(500).json({ 
            error: "Upload service test failed",
            details: error.message
        });
    }
});

// Image upload endpoint using Cloudinary
server.post("/api/upload-image", verifyJWT, async (req, res) => {
    try {
        const { image } = req.body;

        if (!image || typeof image !== 'string') {
            return res.status(400).json({ error: "No image data provided" });
        }

        // Validate base64 header for allowed types
        const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
        const matches = image.match(/^data:(image\/jpeg|image\/png|image\/jpg);base64,/);
        if (!matches || !allowedTypes.includes(matches[1])) {
            return res.status(400).json({ error: "Only JPG, JPEG, and PNG files are allowed." });
        }

        // Validate size (max 2MB)
        const base64Length = image.split(",")[1]?.length || 0;
        const sizeInBytes = Math.ceil(base64Length * 3 / 4);
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (sizeInBytes > maxSize) {
            return res.status(413).json({ error: "Image size must be less than 2MB." });
        }

        // Additional security: Check for malicious content
        const base64Data = image.split(",")[1];
        if (!base64Data || base64Data.length < 100) {
            return res.status(400).json({ error: "Invalid image data" });
        }

        // Check Cloudinary configuration
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            return res.status(500).json({ error: "Image upload service not configured" });
        }

        // Upload to Cloudinary with enhanced security settings
        const uploadPromise = cloudinary.uploader.upload(image, {
            folder: 'blog-profiles',
            width: 500,
            height: 500,
            crop: 'pad',
            background: 'auto',
            quality: 'auto',
            timeout: 30000, // Reduced timeout to 30 seconds
            resource_type: 'image',
            allowed_formats: ['jpg', 'jpeg', 'png'],
            transformation: [
                { width: 500, height: 500, crop: 'pad' },
                { quality: 'auto' }
            ]
        });

        // Add timeout wrapper
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Upload timeout')), 30000);
        });

        const result = await Promise.race([uploadPromise, timeoutPromise]);

        res.json({
            success: true,
            url: result.secure_url
        });
    } catch (error) {
        console.error("Image upload error:", error);
        
        let errorMessage = "Failed to upload image";
        let statusCode = 500;

        if (error.message === 'Upload timeout') {
            errorMessage = "Upload timed out. Please try again.";
            statusCode = 408;
        } else if (error.http_code) {
            // Cloudinary specific error
            switch (error.http_code) {
                case 400:
                    errorMessage = "Invalid image format";
                    statusCode = 400;
                    break;
                case 401:
                    errorMessage = "Upload service authentication failed";
                    statusCode = 500;
                    break;
                case 413:
                    errorMessage = "Image file too large";
                    statusCode = 413;
                    break;
                default:
                    errorMessage = "Upload failed. Please try again.";
                    statusCode = 500;
            }
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
            errorMessage = "Network error. Please check your connection.";
            statusCode = 503;
        }

        res.status(statusCode).json({ error: errorMessage });
    }
});

// Endpoint to clean up unused banner images from Cloudinary
server.post('/api/cleanup-unused-banners', verifyJWT, async (req, res) => {
    // Only allow admins
    if (!req.admin) {
        return res.status(403).json({ error: 'Only admins can perform this action.' });
    }
    try {
        // 1. Get all banner URLs from blogs
        const blogs = await Blog.find({}, 'banner');
        const usedUrls = new Set(blogs.map(b => b.banner).filter(Boolean));

        // 2. List all images in the 'blog-profiles' folder on Cloudinary
        let nextCursor = undefined;
        let allCloudinaryImages = [];
        do {
            const result = await cloudinary.api.resources({
                type: 'upload',
                prefix: 'blog-profiles/',
                max_results: 100,
                next_cursor: nextCursor
            });
            allCloudinaryImages = allCloudinaryImages.concat(result.resources);
            nextCursor = result.next_cursor;
        } while (nextCursor);

        // 3. Find images not referenced in any blog
        const unusedImages = allCloudinaryImages.filter(img => {
            // Compare by secure_url
            return !usedUrls.has(img.secure_url);
        });

        // 4. Delete unused images
        let deleted = [];
        for (const img of unusedImages) {
            await cloudinary.uploader.destroy(img.public_id);
            deleted.push(img.secure_url);
        }

        res.json({ success: true, deletedCount: deleted.length, deleted });
    } catch (error) {
        console.error('Cleanup error:', error);
        res.status(500).json({ error: 'Failed to clean up unused images.' });
    }
});

// Get individual blog by blog_id
server.post("/api/get-blog", async (req, res) => {
    try {
        let { blog_id, draft = false, mode } = req.body;
        let user_id = null;
        let isAdmin = false;
        let isLikedByUser = false;

        // Check if user is authenticated
        const authHeader = req.headers['authorization'];
        if (authHeader) {
            try {
                const token = authHeader.split(" ")[1];
                const decoded = jwt.verify(token, process.env.SECRET_ACCESS_KEY, {
                    audience: JWT_AUDIENCE,
                    issuer: JWT_ISSUER
                });
                user_id = decoded.id;
                // Fetch user to check admin status
                const user = await User.findById(user_id).select('admin super_admin');
                isAdmin = user && (user.admin || user.super_admin);
            } catch (err) {
                // Token is invalid, but we can still fetch the blog
                console.log("Invalid token, fetching blog without user context");
            }
        }

        // Build query
        let query = { blog_id };
        if (mode === 'edit') {
            // For editing, allow drafts and published blogs
            // If not admin, only allow author to edit
            if (!isAdmin) {
                query = { blog_id, author: user_id };
            }
            // If admin, allow any blog
        } else {
            // For viewing, only show published blogs unless user is author
            query = { blog_id, draft: false };
        }

        const blog = await Blog.findOne(query)
            .populate("author", "personal_info.fullname personal_info.username personal_info.profile_img");

        if (!blog) {
            return res.status(404).json({ error: "Blog not found" });
        }

        // Check if user has liked this blog
        if (user_id) {
            const user = await User.findById(user_id);
            if (user && user.liked_blogs && user.liked_blogs.includes(blog.blog_id)) {
                isLikedByUser = true;
            }
        }

        // Increment read count for published blogs
        if (!blog.draft && mode !== 'edit') {
            await Blog.findOneAndUpdate(
                { blog_id },
                { $inc: { "activity.total_reads": 1 } }
            );
        }

        return res.status(200).json({ blog, likedByUser: isLikedByUser });
    } catch (err) {
        console.error("Error fetching blog:", err);
        return res.status(500).json({ error: err.message });
    }
});

// Get blog comments
server.post("/api/get-blog-comments", async (req, res) => {
    try {
        let { blog_id, skip = 0 } = req.body;

        if (!blog_id) {
            return res.status(400).json({ error: "Blog ID is required" });
        }

        // Find the blog first to get its _id
        const blog = await Blog.findOne({ blog_id });
        if (!blog) {
            return res.status(404).json({ error: "Blog not found" });
        }

        // Get comments for this blog
        const comments = await Comment.find({ blog_id: blog._id })
            .populate("commented_by", "personal_info.fullname personal_info.username personal_info.profile_img")
            .sort({ "commentedAt": -1 })
            .skip(skip)
            .limit(10);

        return res.status(200).json({ comments });
    } catch (err) {
        console.error("Error fetching comments:", err);
        return res.status(500).json({ error: err.message });
    }
});

// Create or update blog
server.post("/api/create-blog", verifyJWT, requireAdmin, async (req, res) => {
    try {
        let { title, des, banner, content, tags, draft, id } = req.body;
        let user_id = req.user;

        // Validate required fields for published blogs
        if (!draft) {
            if (!title || !title.trim()) {
                return res.status(400).json({ error: "Title is required for published blogs" });
            }
            if (!des || !des.trim()) {
                return res.status(400).json({ error: "Description is required for published blogs" });
            }
            if (!banner || !banner.trim()) {
                return res.status(400).json({ error: "Banner image is required for published blogs" });
            }
            if (!content) {
                return res.status(400).json({ error: "Content is required for published blogs" });
            }
            if (!tags || !Array.isArray(tags) || tags.length === 0) {
                return res.status(400).json({ error: "At least one tag is required for published blogs" });
            }
        } else {
            // For drafts, provide sensible defaults
            if (!title || !title.trim()) {
                title = "Untitled Draft";
            }
            if (!des || !des.trim()) {
                des = "";
            }
            if (!banner || !banner.trim()) {
                banner = "";
            }
            if (!content) {
                content = [{ time: Date.now(), blocks: [], version: '2.27.2' }];
            }
            if (!tags || !Array.isArray(tags)) {
                tags = [];
            }
        }

        // Ensure content is properly structured
        if (content) {
            // Handle case where content is sent as a single object instead of array
            if (!Array.isArray(content)) {
                content = [content];
            }
            // Always use only the first content block
            const first = content[0] && typeof content[0] === 'object' ? content[0] : { time: Date.now(), blocks: [], version: '2.27.2' };
            content = [{
                time: first.time || Date.now(),
                blocks: Array.isArray(first.blocks) ? first.blocks : [],
                version: first.version || '2.27.2'
            }];
        } else {
            content = [{ time: Date.now(), blocks: [], version: '2.27.2' }];
        }

        // Additional validation for published blogs
        if (!draft) {
            // Check if content has actual blocks
            const hasContent = content.some(item => 
                Array.isArray(item.blocks) && item.blocks.length > 0
            );
            if (!hasContent) {
                return res.status(400).json({ error: "Blog content cannot be empty" });
            }
        }

        // Filter out empty tags
        if (Array.isArray(tags)) {
            tags = tags
                .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
                .map(tag => tag.trim().toLowerCase());
        } else {
            tags = [];
        }

        let blog;
        if (id) {
            // Update existing blog
            blog = await Blog.findOne({ blog_id: id, author: user_id });
            if (!blog) {
                return res.status(404).json({ error: "Blog not found or you don't have permission to edit it" });
            }

            // Update blog fields
            blog.title = title || blog.title;
            blog.des = des || blog.des;
            blog.banner = banner || blog.banner;
            blog.content = content || blog.content;
            blog.tags = tags || blog.tags;
            blog.draft = draft !== undefined ? draft : blog.draft;

            await blog.save();
        } else {
            // Create new blog
            console.log('Creating new blog with data:', { title, des, banner, content: content.length, tags: tags.length, draft, author: user_id });
            
            blog = new Blog({
                title,
                des,
                banner,
                content,
                tags,
                draft: draft !== undefined ? draft : true,
                author: user_id
            });

            console.log('Blog object created, about to save...');
            await blog.save();
            console.log(`[BLOG CREATE] User: ${user_id}, Blog ID: ${blog.blog_id}, Title: ${blog.title}`);

            // Add blog to user's blogs array and increment total_posts
            await User.findOneAndUpdate(
                { _id: user_id },
                { $push: { blogs: blog._id }, $inc: { "account_info.total_posts": 1 } }
            );
        }

        return res.status(200).json({ blog_id: blog.blog_id });
    } catch (err) {
        console.error("Error creating/updating blog:", err);
        if (err.code === 11000) {
            return res.status(400).json({ error: "A blog with this ID already exists. Please use a different title or try again later." });
        }
        if (err.name === 'ValidationError') {
            const validationErrors = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ error: `Validation failed: ${validationErrors.join('; ')}` });
        }
        if (err.name === 'CastError') {
            return res.status(400).json({ error: "Some of the provided data is invalid. Please check your input and try again." });
        }
        return res.status(500).json({ error: "An unexpected error occurred while saving your blog. Please try again or contact support if the problem persists." });
    }
});

// Update existing blog
server.put("/api/update-blog/:blogId", verifyJWT, requireAdmin, async (req, res) => {
    try {
        let { title, des, banner, content, tags, draft } = req.body;
        let user_id = req.user;
        let { blogId } = req.params;

        // Find the blog and verify ownership
        let blog;
        if (req.admin || req.super_admin) {
            blog = await Blog.findOne({ blog_id: blogId });
        } else {
            blog = await Blog.findOne({ blog_id: blogId, author: user_id });
        }
        if (!blog) {
            return res.status(404).json({ error: "Blog not found or you don't have permission to edit it" });
        }

        // Validate required fields for published blogs
        if (!draft) {
            if (!title || !title.trim()) {
                return res.status(400).json({ error: "Title is required for published blogs" });
            }
            if (!des || !des.trim()) {
                return res.status(400).json({ error: "Description is required for published blogs" });
            }
            if (!banner || !banner.trim()) {
                return res.status(400).json({ error: "Banner image is required for published blogs" });
            }
            if (!content) {
                return res.status(400).json({ error: "Content is required for published blogs" });
            }
            if (!tags || !Array.isArray(tags) || tags.length === 0) {
                return res.status(400).json({ error: "At least one tag is required for published blogs" });
            }
        } else {
            // For drafts, provide sensible defaults
            if (!title || !title.trim()) {
                title = "Untitled Draft";
            }
            if (!des || !des.trim()) {
                des = "";
            }
            if (!banner || !banner.trim()) {
                banner = "";
            }
            if (!content) {
                content = [{ time: Date.now(), blocks: [], version: '2.27.2' }];
            }
            if (!tags || !Array.isArray(tags)) {
                tags = [];
            }
        }

        // Ensure content is properly structured
        if (content) {
            // Handle case where content is sent as a single object instead of array
            if (!Array.isArray(content)) {
                content = [content];
            }
            
            // Ensure each content item has the required structure
            content = content.map(item => {
                if (typeof item === 'object' && item !== null) {
                    return {
                        time: item.time || Date.now(),
                        blocks: Array.isArray(item.blocks) ? item.blocks : [],
                        version: item.version || '2.27.2'
                    };
                }
                return { time: Date.now(), blocks: [], version: '2.27.2' };
            });
        } else {
            content = [{ time: Date.now(), blocks: [], version: '2.27.2' }];
        }

        // Additional validation for published blogs
        if (!draft) {
            // Check if content has actual blocks
            const hasContent = content.some(item => 
                Array.isArray(item.blocks) && item.blocks.length > 0
            );
            if (!hasContent) {
                return res.status(400).json({ error: "Blog content cannot be empty" });
            }
        }

        // Filter out empty tags
        if (Array.isArray(tags)) {
            tags = tags
                .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
                .map(tag => tag.trim().toLowerCase());
        } else {
            tags = [];
        }

        // Update blog fields
        blog.title = title || blog.title;
        blog.des = des || blog.des;
        blog.banner = banner || blog.banner;
        blog.content = content || blog.content;
        blog.tags = tags || blog.tags;
        blog.draft = draft !== undefined ? draft : blog.draft;

        await blog.save();
        console.log(`[BLOG UPDATE] User: ${user_id}, Blog ID: ${blog.blog_id}, Title: ${blog.title}`);

        return res.status(200).json({ blog_id: blog.blog_id });
    } catch (err) {
        console.error("Error updating blog:", err);
        if (err.code === 11000) {
            return res.status(400).json({ error: "Blog ID already exists. Please try again." });
        }
        if (err.name === 'ValidationError') {
            const validationErrors = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ error: validationErrors.join(', ') });
        }
        if (err.name === 'CastError') {
            return res.status(400).json({ error: "Invalid data format provided" });
        }
        return res.status(500).json({ error: "Failed to update blog. Please try again." });
    }
});

// Get user's written blogs
server.post("/api/user-written-blogs", verifyJWT, async (req, res) => {
    try {
        let user_id = req.user;
        let { page = 1, draft = false, query = "", deleteDocCount = 0 } = req.body;

        console.log(`Fetching ${draft ? 'drafts' : 'published blogs'} for user:`, user_id);
        console.log('Request params:', { page, draft, query, deleteDocCount });

        let maxLimit = 5;
        let skipDocs = (page - 1) * maxLimit - deleteDocCount;

        let findQuery = { author: user_id, draft };
        if (query && query.trim()) {
            findQuery.title = new RegExp(query.trim(), "i");
        }

        console.log('MongoDB find query:', JSON.stringify(findQuery, null, 2));

        const blogs = await Blog.find(findQuery)
            .populate("author", "personal_info.fullname personal_info.username personal_info.profile_img")
            .sort({ "publishedAt": -1 })
            .select("title des banner activity publishedAt blog_id tags draft -_id")
            .skip(skipDocs)
            .limit(maxLimit);

        console.log(`Found ${blogs.length} ${draft ? 'drafts' : 'published blogs'}`);
        
        // Log first few blogs for debugging
        if (blogs.length > 0) {
            console.log('Sample blog data:', {
                blog_id: blogs[0].blog_id,
                title: blogs[0].title,
                draft: blogs[0].draft,
                author: blogs[0].author?.personal_info?.username
            });
        }

        return res.status(200).json({ blogs });
    } catch (err) {
        console.error("Error fetching user blogs:", err);
        console.error("Error details:", {
            name: err.name,
            message: err.message,
            stack: err.stack
        });
        
        let errorMessage = "Failed to fetch blogs";
        if (err.name === 'CastError') {
            errorMessage = "Invalid user ID format";
        } else if (err.name === 'ValidationError') {
            errorMessage = "Invalid query parameters";
        }
        
        return res.status(500).json({ error: errorMessage });
    }
});

// Get trending blogs
server.get("/api/trending-blogs", async (req, res) => {
    try {
        let { page = 1, limit = 30 } = req.query; // Increased limit for smooth slider
        let skipDocs = (page - 1) * limit;

        const blogs = await Blog.find({ draft: false })
            .populate("author", "personal_info.fullname personal_info.username personal_info.profile_img")
            .sort({ "activity.total_reads": -1, "activity.total_likes": -1 })
            .select("title des banner activity publishedAt blog_id tags -_id")
            .skip(skipDocs)
            .limit(parseInt(limit));

        return res.status(200).json({ blogs });
    } catch (err) {
        console.error("Error fetching trending blogs:", err);
        return res.status(500).json({ error: err.message });
    }
});

// Like/Unlike blog
server.post("/api/like-blog", verifyJWT, async (req, res) => {
    try {
        let user_id = req.user;
        let { blog_id } = req.body;

        const blog = await Blog.findOne({ blog_id });
        if (!blog) {
            return res.status(404).json({ error: "Blog not found" });
        }

        const user = await User.findById(user_id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const isLiked = user.liked_blogs && user.liked_blogs.includes(blog_id);

        if (isLiked) {
            // Unlike
            await User.findByIdAndUpdate(user_id, {
                $pull: { liked_blogs: blog_id }
            });
            await Blog.findOneAndUpdate(
                { blog_id },
                { $inc: { "activity.total_likes": -1 } }
            );
            
            // Delete like notification
            await Notification.findOneAndDelete({
                type: 'like',
                user: user_id,
                blog: blog._id,
                notification_for: blog.author
            });
        } else {
            // Like
            await User.findByIdAndUpdate(user_id, {
                $addToSet: { liked_blogs: blog_id }
            });
            await Blog.findOneAndUpdate(
                { blog_id },
                { $inc: { "activity.total_likes": 1 } }
            );
            
            // Create like notification (only if not liking own blog)
            if (user_id.toString() !== blog.author.toString()) {
                await new Notification({
                    type: 'like',
                    user: user_id,
                    blog: blog._id,
                    notification_for: blog.author
                }).save();
                // Notify all admins and super admins (except the blog author)
                const adminUsers = await User.find({ $or: [ { admin: true }, { super_admin: true } ] });
                for (const admin of adminUsers) {
                    if (admin._id.toString() !== blog.author.toString()) {
                        await new Notification({
                            type: 'like',
                            user: user_id,
                            blog: blog._id,
                            notification_for: admin._id,
                            for_role: 'admin'
                        }).save();
                    }
                }
            }
        }

        return res.status(200).json({ liked: !isLiked });
    } catch (err) {
        console.error("Error liking/unliking blog:", err);
        return res.status(500).json({ error: err.message });
    }
});

// Bookmark/Unbookmark blog
server.post("/api/bookmark-blog", verifyJWT, async (req, res) => {
    try {
        let user_id = req.user;
        let { blog_id } = req.body;

        // Validate input
        if (!blog_id) {
            return res.status(400).json({ error: "Blog ID is required" });
        }

        // Check if blog exists
        const blog = await Blog.findOne({ blog_id });
        if (!blog) {
            return res.status(404).json({ error: "Blog not found" });
        }

        // Check if already bookmarked
        const user = await User.findById(user_id);
        if (user.bookmarked_blogs && user.bookmarked_blogs.includes(blog_id)) {
            return res.status(200).json({ bookmarked: true, message: "Already bookmarked" });
        }

        await User.findByIdAndUpdate(user_id, {
            $addToSet: { bookmarked_blogs: blog_id }
        });

        return res.status(200).json({ bookmarked: true });
    } catch (err) {
        console.error("Error bookmarking blog:", err);
        return res.status(500).json({ error: err.message });
    }
});

server.post("/api/unbookmark-blog", verifyJWT, async (req, res) => {
    try {
        let user_id = req.user;
        let { blog_id } = req.body;

        // Validate input
        if (!blog_id) {
            return res.status(400).json({ error: "Blog ID is required" });
        }

        // Check if blog exists
        const blog = await Blog.findOne({ blog_id });
        if (!blog) {
            return res.status(404).json({ error: "Blog not found" });
        }

        // Check if not bookmarked
        const user = await User.findById(user_id);
        if (!user.bookmarked_blogs || !user.bookmarked_blogs.includes(blog_id)) {
            return res.status(200).json({ bookmarked: false, message: "Not bookmarked" });
        }

        await User.findByIdAndUpdate(user_id, {
            $pull: { bookmarked_blogs: blog_id }
        });

        return res.status(200).json({ bookmarked: false });
    } catch (err) {
        console.error("Error unbookmarking blog:", err);
        return res.status(500).json({ error: err.message });
    }
});

// Add comment to blog
server.post("/api/add-comment", verifyJWT, async (req, res) => {
    try {
        let user_id = req.user;
        let { blog_id, comment, blog_author, parent, replying_to } = req.body;

        // Support backward compatibility: if 'parent' is not provided, use 'replying_to'
        if (!parent && replying_to) {
            parent = replying_to;
        }

        // Handle both blog_id and _id parameters for backward compatibility
        if (!blog_id && req.body._id) {
            blog_id = req.body._id;
        }

        if (!blog_id) {
            return res.status(400).json({ error: "Blog ID is required" });
        }

        const blog = await Blog.findOne({ blog_id });
        if (!blog) {
            return res.status(404).json({ error: "Blog not found" });
        }

        // If blog_author is not provided, use the blog's author
        if (!blog_author) {
            blog_author = blog.author;
        }

        const newComment = new Comment({
            blog_id: blog._id,
            blog_author,
            commented_by: user_id,
            comment,
            parent: parent || undefined,
            isReply: !!parent
        });

        await newComment.save();

        // Increment comment count
        await Blog.findOneAndUpdate(
            { blog_id },
            { $inc: { "activity.total_comments": 1 } }
        );

        // Create notification for comment or reply
        if (parent) {
            // This is a reply to a comment
            const parentComment = await Comment.findById(parent);
            if (parentComment && user_id.toString() !== parentComment.commented_by.toString()) {
                await new Notification({
                    type: 'reply',
                    user: user_id,
                    blog: blog._id,
                    comment: newComment._id,
                    replied_on_comment: parent,
                    notification_for: parentComment.commented_by
                }).save();
            }
        } else {
            // This is a comment on the blog
            if (user_id.toString() !== blog.author.toString()) {
                await new Notification({
                    type: 'comment',
                    user: user_id,
                    blog: blog._id,
                    comment: newComment._id,
                    notification_for: blog.author
                }).save();
            }
            // Notify all admins and super admins (except the blog author)
            const adminUsers = await User.find({ $or: [ { admin: true }, { super_admin: true } ] });
            for (const admin of adminUsers) {
                if (admin._id.toString() !== blog.author.toString()) {
                    await new Notification({
                        type: 'comment',
                        user: user_id,
                        blog: blog._id,
                        comment: newComment._id,
                        notification_for: admin._id,
                        for_role: 'admin'
                    }).save();
                }
            }
        }

        // Populate user info for response
        await newComment.populate("commented_by", "personal_info.fullname personal_info.username personal_info.profile_img");

        return res.status(200).json({ success: true, comment: newComment });
    } catch (err) {
        console.error("Error adding comment:", err);
        return res.status(500).json({ error: err.message });
    }
});

// Delete comment
server.post("/api/delete-comment", verifyJWT, async (req, res) => {
    try {
        let user_id = req.user;
        let { comment_id, blog_id } = req.body;

        if (!comment_id) {
            return res.status(400).json({ error: "Comment ID is required" });
        }

        // Find the comment
        const comment = await Comment.findById(comment_id);
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        // Check if user can delete this comment (author or admin)
        const user = await User.findById(user_id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const canDelete = comment.commented_by.toString() === user_id || user.admin === true;
        if (!canDelete) {
            return res.status(403).json({ error: "You don't have permission to delete this comment" });
        }

        // Recursive function to delete a comment and all its children and notifications
        async function deleteCommentAndChildren(commentId) {
            // Find all direct children (replies)
            const children = await Comment.find({ parent: commentId });
            // Recursively delete children
            for (const child of children) {
                await deleteCommentAndChildren(child._id);
            }
            // Delete notifications related to this comment
            await Notification.deleteMany({
                $or: [
                    { comment: commentId },
                    { reply: commentId },
                    { replied_on_comment: commentId }
                ]
            });
            // Delete the comment itself
            await Comment.findByIdAndDelete(commentId);
        }

        // Start recursive deletion
        await deleteCommentAndChildren(comment_id);

        // Decrement comment count if blog_id is provided
        if (blog_id) {
            await Blog.findOneAndUpdate(
                { blog_id },
                { $inc: { "activity.total_comments": -1 } }
            );
        }

        return res.status(200).json({ success: true, message: "Comment and its replies deleted successfully" });
    } catch (err) {
        console.error("Error deleting comment:", err);
        return res.status(500).json({ error: err.message });
    }
});

// Debug endpoint to test draft loading
server.get("/debug/drafts", verifyJWT, async (req, res) => {
    try {
        let user_id = req.user;
        console.log('Debug: User ID from token:', user_id);

        // Check if user exists
        const user = await User.findById(user_id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        console.log('Debug: User found:', {
            id: user._id,
            username: user.personal_info?.username,
            email: user.personal_info?.email
        });

        // Get all blogs for this user
        const allBlogs = await Blog.find({ author: user_id });
        console.log('Debug: Total blogs found:', allBlogs.length);

        // Get drafts specifically
        const drafts = await Blog.find({ author: user_id, draft: true });
        console.log('Debug: Drafts found:', drafts.length);

        // Get published blogs
        const published = await Blog.find({ author: user_id, draft: false });
        console.log('Debug: Published blogs found:', published.length);

        return res.status(200).json({
            user: {
                id: user._id,
                username: user.personal_info?.username,
                email: user.personal_info?.email
            },
            stats: {
                totalBlogs: allBlogs.length,
                drafts: drafts.length,
                published: published.length
            },
            drafts: drafts.map(draft => ({
                blog_id: draft.blog_id,
                title: draft.title,
                draft: draft.draft,
                created_at: draft.created_at
            })),
            published: published.map(blog => ({
                blog_id: blog.blog_id,
                title: blog.title,
                draft: blog.draft,
                publishedAt: blog.publishedAt
            }))
        });
    } catch (err) {
        console.error("Debug endpoint error:", err);
        return res.status(500).json({ error: err.message });
    }
});

// Get new notification status
server.get("/api/new-notification", verifyJWT, async (req, res) => {
    try {
        let user_id = req.user;
        
        // Check if user is admin
        const user = await User.findById(user_id);
        const isAdmin = user?.admin || user?.super_admin || user?.role === 'admin';
        
        let query = { 
            notification_for: user_id, 
            seen: false 
        };
        
        // For non-admin users, only check reply notifications
        if (!isAdmin) {
            query.type = 'reply';
        }
        // Admin users check all notification types
        
        // Check if user has any unread notifications
        const unreadCount = await Notification.countDocuments(query);
        
        return res.status(200).json({ 
            new_notification_available: unreadCount > 0 
        });
    } catch (err) {
        console.error("Error checking notifications:", err);
        return res.status(500).json({ error: "Failed to check notifications" });
    }
});

// Get notifications
server.post("/api/notifications", verifyJWT, async (req, res) => {
    try {
        let user_id = req.user;
        let { page = 1, filter = 'reply', deletedDocCount = 0 } = req.body;
        
        console.log('Notifications API called with:', { user_id, page, filter, deletedDocCount });
        console.log('User ID type:', typeof user_id);
        console.log('User ID value:', user_id);
        
        // Check if user is admin
        const user = await User.findById(user_id);
        console.log('User found:', user ? {
            id: user._id,
            username: user.personal_info?.username,
            admin: user.admin,
            super_admin: user.super_admin
        } : 'User not found');
        
        const isAdmin = user?.admin || user?.super_admin || user?.role === 'admin';
        console.log('User is admin:', isAdmin);
        
        let query = { notification_for: user_id };
        console.log('Base query:', query);
        
        // Apply filter based on user type and requested filter
        if (isAdmin) {
            // Admin users can see all notifications or filter as requested
            if (filter !== 'all') {
                query.type = filter;
            }
        } else {
            // Non-admin users only see reply notifications
            query.type = 'reply';
        }
        
        console.log('Final query:', query);
        
        // Test the query directly
        const testCount = await Notification.countDocuments(query);
        console.log('Test count with query:', testCount);
        
        const notifications = await Notification.find(query)
            .populate("user", "personal_info.fullname personal_info.username personal_info.profile_img")
            .populate("blog", "blog_id title")
            .populate("comment", "comment commented_by")
            .populate("reply", "comment commented_by")
            .populate("replied_on_comment", "comment commented_by")
            .sort({ createdAt: -1 })
            .skip((page - 1) * 5)
            .limit(5);
        
        console.log('Found notifications:', notifications.length);
        if (notifications.length > 0) {
            console.log('Sample notification:', {
                id: notifications[0]._id,
                type: notifications[0].type,
                notification_for: notifications[0].notification_for,
                user: notifications[0].user?.personal_info?.fullname
            });
        }
        
        return res.status(200).json({ notifications });
    } catch (err) {
        console.error("Error fetching notifications:", err);
        return res.status(500).json({ error: err.message });
    }
});

// Mark notifications as seen
server.post("/api/seen-notifications", verifyJWT, async (req, res) => {
    try {
        let user_id = req.user;
        await Notification.updateMany(
            { notification_for: user_id, seen: false },
            { seen: true }
        );
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("Error marking notifications as seen:", err);
        return res.status(500).json({ error: err.message });
    }
});

// Get notifications count
server.post("/api/all-notifications-count", verifyJWT, async (req, res) => {
    try {
        let user_id = req.user;
        let { filter = 'reply' } = req.body;
        
        console.log('Notifications count API called with:', { user_id, filter });
        
        // Check if user is admin
        const user = await User.findById(user_id);
        const isAdmin = user?.admin || user?.super_admin || user?.role === 'admin';
        
        console.log('User is admin for count:', isAdmin);
        
        let query = { notification_for: user_id };
        
        // Apply filter based on user type and requested filter
        if (isAdmin) {
            // Admin users can count all notifications or filter as requested
            if (filter !== 'all') {
                query.type = filter;
            }
        } else {
            // Non-admin users only count reply notifications
            query.type = 'reply';
        }
        
        console.log('Count query:', query);
        
        const count = await Notification.countDocuments(query);
        console.log('Total count:', count);
        
        return res.status(200).json({ totalDocs: count });
    } catch (err) {
        console.error("Error counting notifications:", err);
        return res.status(500).json({ error: err.message });
    }
});

server.post('/api/google-auth', async (req, res) => {
    console.log("Attempting Google Auth...");
    try {
        const { id_token } = req.body;
        if (!id_token) {
            console.error("[GOOGLE AUTH] No id_token provided in request body", req.body);
            return res.status(400).json({ error: "No id_token provided." });
        }
        console.log("Received ID token:", id_token);
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

        // Decode token without verifying to inspect payload
        let decodedPayload;
        try {
            const base64Payload = id_token.split('.')[1];
            decodedPayload = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf-8'));
            console.log("Decoded token audience (aud):", decodedPayload.aud);
            console.log("Decoded token full payload:", decodedPayload);
        } catch (decodeErr) {
            console.error("[GOOGLE AUTH] Failed to decode id_token payload", decodeErr);
            return res.status(400).json({ error: "Invalid id_token format." });
        }

        let ticket;
        try {
            ticket = await client.verifyIdToken({
                idToken: id_token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
        } catch (verifyErr) {
            console.error("[GOOGLE AUTH] Failed to verify id_token with Google", verifyErr);
            return res.status(401).json({ error: "Failed to verify Google ID token." });
        }

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            console.error("[GOOGLE AUTH] No email in Google payload", payload);
            return res.status(400).json({ error: "Google account did not return an email address." });
        }
        const email = payload.email;
        const picture = payload.picture;
        // Fallbacks for missing fields
        const name = payload.name || email.split('@')[0];
        const given_name = payload.given_name || name.split(' ')[0] || name;
        const family_name = payload.family_name || name.split(' ')[1] || 'GoogleUser';

        let user;
        try {
            user = await User.findOne({ "personal_info.email": email });
        } catch (dbErr) {
            console.error("[GOOGLE AUTH] Database error during user lookup", dbErr);
            return res.status(500).json({ error: "Database error during user lookup." });
        }

        if (user && !user.active) {
            return res.status(403).json({ error: "Your account is deactivated. Please contact support or an admin." });
        }

        if (user) {
            if (!user.google_auth) {
                return res.status(403).json({ error: "This account was created with a password. Please use your email and password to log in." });
            }
            // Ensure Google-auth users are marked as verified
            if (!user.verified) {
                user.verified = true;
                await user.save();
            }
        } else {
            const username = await generateUsername(email);
            user = new User({
                personal_info: {
                    fullname: name,
                    firstname: given_name,
                    lastname: family_name,
                    email,
                    profile_img: picture,
                    username
                },
                google_auth: true,
                verified: true // Mark new Google-auth users as verified
            });
            try {
                await user.save();
            } catch (saveErr) {
                console.error("[GOOGLE AUTH] Error saving new Google user", saveErr);
                return res.status(500).json({ error: "Failed to save new Google user." });
            }
            // Notify all admins about new user registration
            try {
                const admins = await User.find({ $or: [ { admin: true }, { super_admin: true } ] });
                for (const admin of admins) {
                    await Notification.create({
                        type: 'new_user',
                        notification_for: admin._id,
                        for_role: 'admin',
                        user: user._id
                    });
                }
            } catch (notifyErr) {
                console.error("[GOOGLE AUTH] Error notifying admins of new user", notifyErr);
                // Don't block user creation on notification failure
            }
        }
        // Generate tokens
        let access_token, refresh_token;
        try {
            access_token = jwt.sign(
                { id: user._id, admin: user.admin || user.super_admin, super_admin: user.super_admin, iat: Math.floor(Date.now() / 1000), type: 'access' },
                process.env.SECRET_ACCESS_KEY,
                { expiresIn: JWT_EXPIRES_IN, audience: JWT_AUDIENCE, issuer: JWT_ISSUER }
            );
            refresh_token = jwt.sign(
                { id: user._id, type: 'refresh' },
                process.env.SECRET_ACCESS_KEY,
                { expiresIn: '7d', audience: JWT_AUDIENCE, issuer: JWT_ISSUER }
            );
        } catch (jwtErr) {
            console.error("[GOOGLE AUTH] Error generating JWT tokens", jwtErr);
            return res.status(500).json({ error: "Failed to generate authentication tokens." });
        }
        // Set httpOnly cookies
        res.cookie('access_token', access_token, getCookieOptions({ crossSite: true, maxAge: 60 * 60 * 1000 }));
        res.cookie('refresh_token', refresh_token, getCookieOptions({ crossSite: true, maxAge: 7 * 24 * 60 * 60 * 1000 }));
        res.cookie('user_data', JSON.stringify(user), getCookieOptions({ crossSite: true, maxAge: 7 * 24 * 60 * 60 * 1000 }));

        // Set CSRF token
        const csrfToken = generateCSRFToken();
        res.cookie('csrf-token', csrfToken, getCSRFCookieOptions());

        console.log("[GOOGLE AUTH] User admin status from DB:", {
            admin: user.admin,
            super_admin: user.super_admin,
            adminType: typeof user.admin,
            superAdminType: typeof user.super_admin
        });
        
        return res.status(200).json({
            message: "Google authentication successful!",
            user: {
                profile_img: user.personal_info.profile_img,
                username: user.personal_info.username,
                fullname: user.personal_info.fullname,
                admin: user.admin, // Use 'admin' field
                super_admin: user.super_admin, // Add this line
                bookmarked_blogs: user.bookmarked_blogs || [],
                liked_blogs: user.liked_blogs || [],
                access_token: access_token // <-- Add this line
            }
        });
    } catch (err) {
        console.error('[GOOGLE AUTH] Unhandled error:', err, '\nRequest body:', req.body, '\nStack:', err.stack);
        return res.status(500).json({ error: "Failed to authenticate with Google. Try again with another account.", details: err.message });
    }
});

// Trending tags endpoint
server.get("/api/trending-tags", async (req, res) => {
    try {
        const tags = await Blog.aggregate([
            { $unwind: "$tags" },
            { $group: { _id: "$tags", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 }
        ]);
        res.status(200).json({ tags });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fetch multiple blogs by their IDs (for bookmarks) with pagination
server.post("/api/get-blogs-by-ids", async (req, res) => {
    try {
        const { blog_ids, page = 1, limit = 5 } = req.body;
        
        // Validate input
        if (!Array.isArray(blog_ids)) {
            return res.status(400).json({ error: "blog_ids must be an array" });
        }
        
        if (!blog_ids.length) {
            return res.status(200).json({ blogs: [], totalDocs: 0 });
        }
        
        // Validate pagination parameters
        const validPage = Math.max(1, parseInt(page) || 1);
        const validLimit = Math.min(20, Math.max(1, parseInt(limit) || 5)); // Max 20, min 1
        
        const skip = (validPage - 1) * validLimit;
        
        // Filter out invalid blog_ids and find blogs
        const validBlogIds = blog_ids.filter(id => id && typeof id === 'string');
        const blogs = await Blog.find({ blog_id: { $in: validBlogIds } })
            .populate('author', 'personal_info.fullname personal_info.username personal_info.profile_img')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(validLimit);
            
        const totalDocs = validBlogIds.length;
        
        console.log("Received blog_ids:", blog_ids);
        console.log("Found blogs:", blogs);
        
        res.json({ blogs, totalDocs });
    } catch (err) {
        console.error("Error fetching blogs by IDs:", err);
        res.status(500).json({ error: err.message });
    }
});

// Delete a notification by ID
server.delete("/api/delete-notification/:id", verifyJWT, async (req, res) => {
    try {
        const notificationId = req.params.id;
        const user_id = req.user;
        const notification = await Notification.findById(notificationId);
        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }
        // Only the user the notification is for, or an admin, can delete
        if (notification.notification_for.toString() !== user_id && !req.userData?.admin) {
            return res.status(403).json({ error: "You do not have permission to delete this notification" });
        }
        await Notification.findByIdAndDelete(notificationId);
        return res.status(200).json({ success: true, message: "Notification deleted successfully" });
    } catch (err) {
        console.error("Error deleting notification:", err);
        return res.status(500).json({ error: "Failed to delete notification" });
    }
});

// Replace /contact endpoint to only handle form fields
// Add specific rate limiter for contact form
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many contact form submissions, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

server.post('/api/contact', contactLimiter, async (req, res) => {
  try {
    const { subject, name, email, explanation, recaptchaToken } = req.body;
    if (!subject || !name || !email || !explanation) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (!recaptchaToken) {
      return res.status(400).json({ error: 'CAPTCHA is required.' });
    }
    // Verify reCAPTCHA
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
    const recaptchaResponse = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
      params: {
        secret: recaptchaSecret,
        response: recaptchaToken
      }
    });
    if (!recaptchaResponse.data.success) {
      return res.status(400).json({ error: 'CAPTCHA verification failed. Please try again.' });
    }
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }
    // Sanitize input fields
    const sanitizedSubject = sanitizeInput(subject);
    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedExplanation = sanitizeInput(explanation);
    // Save to database
    const contact = new Contact({ subject: sanitizedSubject, name: sanitizedName, email: sanitizedEmail, explanation: sanitizedExplanation });
    await contact.save();

    // Send email notification to admin using utility
    const emailResult = await sendContactNotification({
      subject: sanitizedSubject,
      name: sanitizedName,
      email: sanitizedEmail,
      message: sanitizedExplanation
    });
    if (!emailResult.success) {
      return res.status(500).json({ error: 'Failed to send notification email.' });
    }

    res.json({ message: 'Message received! Thank you for contacting us.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process contact form.' });
  }
});

// Get recent comments for footer or other uses
server.get("/api/recent-comments", async (req, res) => {
    try {
        // Find the latest 10 comments
        const comments = await Comment.find({})
            .sort({ commentedAt: -1 })
            .limit(10)
            .populate("commented_by", "personal_info.fullname personal_info.username personal_info.profile_img");
        return res.status(200).json({ comments });
    } catch (err) {
        console.error("Error fetching recent comments:", err);
        return res.status(500).json({ error: "Failed to fetch recent comments" });
    }
});

// Add specific rate limiter for newsletter subscription
const newsletterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many newsletter subscription attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Newsletter subscription endpoint
server.post('/api/subscribe-newsletter', newsletterLimiter, async (req, res) => {
  try {
    const { email, recaptchaToken } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    if (!recaptchaToken) {
      return res.status(400).json({ error: 'CAPTCHA is required.' });
    }
    // Verify reCAPTCHA
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
    const recaptchaResponse = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
      params: {
        secret: recaptchaSecret,
        response: recaptchaToken
      }
    });
    if (!recaptchaResponse.data.success) {
      return res.status(400).json({ error: 'CAPTCHA verification failed. Please try again.' });
    }
    let subscriber;
    try {
      subscriber = await Newsletter.findOne({ email: email.toLowerCase() });
    } catch (dbErr) {
      return res.status(500).json({ error: 'Database error.' });
    }
    if (subscriber && subscriber.isActive) {
      return res.status(409).json({ error: 'Email already subscribed.' });
    }
    let verificationToken;
    if (!subscriber) {
      verificationToken = nanoid(32);
      const unsubscribeToken = nanoid(32);
      try {
        subscriber = new Newsletter({
          email: email.toLowerCase(),
          isActive: false,
          verificationToken,
          unsubscribeToken
        });
        await subscriber.save();
      } catch (saveErr) {
        return res.status(500).json({ error: 'Failed to save subscriber.' });
      }
    } else {
      verificationToken = nanoid(32);
      subscriber.verificationToken = verificationToken;
      subscriber.isActive = false;
      if (!subscriber.unsubscribeToken) subscriber.unsubscribeToken = nanoid(32);
      try {
        await subscriber.save();
      } catch (updateErr) {
        return res.status(500).json({ error: 'Failed to update subscriber.' });
      }
    }
    let emailResult;
    try {
      const { sendNewsletterVerificationEmail } = await import('./utils/email.js');
      emailResult = await sendNewsletterVerificationEmail(email, verificationToken);
    } catch (emailErr) {
      return res.status(500).json({ error: 'Failed to send verification email.' });
    }
    return res.status(200).json({ message: 'Subscription request received. Please check your email to verify.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to subscribe.' });
  }
});

// Email verification endpoint for users
server.get('/api/verify-user', async (req, res) => {
    const { token } = req.query;
    try {
        let user = await User.findOne({ verificationToken: token });
        if (!user) return res.status(400).json({ error: "Invalid or expired verification link." });
        if (user.verified) {
            // Generate JWT and return user info for auto-login
            const access_token = jwt.sign(
                { id: user._id, admin: user.admin || user.super_admin, super_admin: user.super_admin, iat: Math.floor(Date.now() / 1000), type: 'access' },
                process.env.SECRET_ACCESS_KEY,
                {
                    expiresIn: JWT_EXPIRES_IN,
                    audience: JWT_AUDIENCE,
                    issuer: JWT_ISSUER
                }
            );
            // Set httpOnly cookies
            res.cookie('access_token', access_token, getCookieOptions({ crossSite: true, maxAge: 60 * 60 * 1000 }));
            res.cookie('user_data', JSON.stringify(user), getCookieOptions({ crossSite: true, maxAge: 7 * 24 * 60 * 60 * 1000 }));

            // Set CSRF token
            const csrfToken = generateCSRFToken();
            res.cookie('csrf-token', csrfToken, getCSRFCookieOptions());

            return res.status(200).json({
                message: "User already verified. You are now logged in.",
                user: {
                    profile_img: user.personal_info.profile_img,
                    username: user.personal_info.username,
                    fullname: user.personal_info.fullname,
                    admin: user.admin, // Use 'admin' field
                    super_admin: user.super_admin, // Add this line
                    bookmarked_blogs: user.bookmarked_blogs || [],
                    liked_blogs: user.liked_blogs || []
                }
            });
        }
        user.verified = true;
        user.verificationToken = undefined;
        await user.save();
        // Notify all admins about new user registration
        const admins = await User.find({ $or: [ { admin: true }, { super_admin: true } ] });
        for (const admin of admins) {
            await Notification.create({
                type: 'new_user',
                notification_for: admin._id,
                for_role: 'admin',
                user: user._id
            });
        }
        // Generate JWT and return user info for auto-login
        const access_token = jwt.sign(
            { id: user._id, admin: user.admin || user.super_admin, super_admin: user.super_admin, iat: Math.floor(Date.now() / 1000), type: 'access' },
            process.env.SECRET_ACCESS_KEY,
            {
                expiresIn: JWT_EXPIRES_IN,
                audience: JWT_AUDIENCE,
                issuer: JWT_ISSUER
            }
        );
        // Set httpOnly cookies
        res.cookie('access_token', access_token, getCookieOptions({ crossSite: true, maxAge: 60 * 60 * 1000 }));
        res.cookie('user_data', JSON.stringify(user), getCookieOptions({ crossSite: true, maxAge: 7 * 24 * 60 * 60 * 1000 }));

        // Set CSRF token
        const csrfToken = generateCSRFToken();
        res.cookie('csrf-token', csrfToken, getCSRFCookieOptions());

        return res.status(200).json({ 
            message: "Email verified! You are now logged in.",
            user: {
                profile_img: user.personal_info.profile_img,
                username: user.personal_info.username,
                fullname: user.personal_info.fullname,
                admin: user.admin, // Use 'admin' field
                super_admin: user.super_admin, // Add this line
                bookmarked_blogs: user.bookmarked_blogs || [],
                liked_blogs: user.liked_blogs || []
            }
        });
    } catch (err) {
        return res.status(400).json({ error: "Invalid or expired verification link." });
    }
});

server.post('/api/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({ error: 'Valid email is required.' });
        }
        let user = await User.findOne({ "personal_info.email": email });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        if (user.verified) {
            return res.status(400).json({ error: 'User already verified.' });
        }
        // Generate new token
        const verificationToken = nanoid(32);
        user.verificationToken = verificationToken;
        await user.save();
        // Send verification email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.ADMIN_EMAIL,
                pass: process.env.ADMIN_EMAIL_PASSWORD
            }
        });
        const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-user?token=${verificationToken}`;
        await transporter.sendMail({
            from: `Islamic Stories <${process.env.ADMIN_EMAIL}>`,
            to: email,
            subject: 'Verify your email address',
            text: `Please verify your email by clicking this link: ${verifyUrl}`
        });
        return res.status(200).json({ message: 'Verification email resent. Please check your inbox.' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

server.get('/api/verify-newsletter', async (req, res) => {
    const { token } = req.query;
    try {
        let subscriber = await Newsletter.findOne({ verificationToken: token });
        if (!subscriber) return res.status(400).json({ error: "Invalid or expired verification link." });
        if (subscriber.isActive) return res.status(400).json({ error: "Subscription already verified." });
        subscriber.isActive = true;
        subscriber.verificationToken = undefined;
        await subscriber.save();
        return res.status(200).json({ message: "Subscription verified! Thank you for subscribing." });
    } catch (err) {
        return res.status(400).json({ error: "Invalid or expired verification link." });
    }
});

server.get("/api/trending-blogs-count", async (req, res) => {
  try {
    // Use the same filter as /api/trending-blogs
    // Example: trending = not draft
    const count = await Blog.countDocuments({ draft: false });
    res.status(200).json({ totalDocs: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get popular blogs (most viewed)
server.get("/api/popular-blogs", async (req, res) => {
    try {
        let { page = 1, limit = 30 } = req.query; // Increased limit for smooth slider
        let skipDocs = (page - 1) * limit;

        const blogs = await Blog.find({ draft: false })
            .populate("author", "personal_info.fullname personal_info.username personal_info.profile_img")
            .sort({ "activity.total_reads": -1 })
            .select("title des banner activity publishedAt blog_id tags -_id")
            .skip(skipDocs)
            .limit(parseInt(limit));

        return res.status(200).json({ blogs });
    } catch (err) {
        console.error("Error fetching popular blogs:", err);
        return res.status(500).json({ error: err.message });
    }
});

// Get top blogs (most liked + commented)
server.get("/api/top-blogs", async (req, res) => {
    try {
        let { page = 1, limit = 30 } = req.query; // Increased limit for smooth slider
        let skipDocs = (page - 1) * limit;

        const blogs = await Blog.find({ draft: false })
            .populate("author", "personal_info.fullname personal_info.username personal_info.profile_img")
            .sort({ "activity.total_likes": -1, "activity.total_comments": -1 })
            .select("title des banner activity publishedAt blog_id tags -_id")
            .skip(skipDocs)
            .limit(parseInt(limit));

        return res.status(200).json({ blogs });
    } catch (err) {
        console.error("Error fetching top blogs:", err);
        return res.status(500).json({ error: err.message });
    }
});

// Get count for popular blogs
server.get("/api/popular-blogs-count", async (req, res) => {
    try {
        const count = await Blog.countDocuments({ draft: false });
        res.status(200).json({ totalDocs: count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get count for top blogs
server.get("/api/top-blogs-count", async (req, res) => {
    try {
        const count = await Blog.countDocuments({ draft: false });
        res.status(200).json({ totalDocs: count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== GLOBAL ERROR HANDLING =====
// Admin: List all users (with pagination)
server.get("/api/admin/users", verifyJWT, requireAdmin, async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let skip = (page - 1) * limit;

    const showDeleted = req.query.showDeleted === 'true';
    const userQuery = showDeleted ? {} : { deleted: { $ne: true } };

    const totalUsers = await User.countDocuments(userQuery);
    const users = await User.find(userQuery, {
      _id: 1,
      admin: 1,
      super_admin: 1,
      active: 1,
      deleted: 1,
      "personal_info.fullname": 1,
      "personal_info.username": 1,
      "personal_info.email": 1
    })
      .skip(skip)
      .limit(limit);

    res.json({ users, totalUsers, page, limit });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// In-memory rate limit map for admin status change requests
const setAdminRateLimit = new Map(); // key: userId, value: timestamp of last request
const SET_ADMIN_RATE_LIMIT_WINDOW = 10 * 1000; // 10 seconds in ms (for testing)

// Admin: Promote/Demote user
server.post("/api/admin/set-admin", verifyJWT, async (req, res) => {
  const { userId, admin, reason } = req.body;
  const requestingUserId = req.user;
  // In-memory rate limiting logic
  const now = Date.now();
  const lastRequest = setAdminRateLimit.get(requestingUserId);
  if (lastRequest && now - lastRequest < SET_ADMIN_RATE_LIMIT_WINDOW) {
    const retryAfter = Math.ceil((SET_ADMIN_RATE_LIMIT_WINDOW - (now - lastRequest)) / 1000);
    return res.status(429).json({ error: `Too many requests. Please wait ${retryAfter} seconds before trying again.` });
  }
  setAdminRateLimit.set(requestingUserId, now);
  console.log("[set-admin] Request received:", { userId, admin });
  if (typeof admin !== "boolean" || !userId) {
    console.log("[set-admin] Invalid request body", req.body);
    return res.status(400).json({ error: "Invalid request" });
  }
  try {
    const requestingUser = await User.findById(req.user);
    const targetUser = await User.findById(userId);
    if (!requestingUser) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!requestingUser.admin && !requestingUser.super_admin) {
      return res.status(403).json({ error: "Only admins or super admins can promote/demote users." });
    }
    if (!targetUser) {
      return res.status(404).json({ error: "Target user not found" });
    }
    // Prevent demoting or promoting a super admin (except self-demotion is already blocked)
    if (targetUser.super_admin) {
      return res.status(403).json({ error: "Cannot promote or demote a super admin." });
    }
    // Only super admin can promote/demote directly
    if (requestingUser.super_admin) {
      if (req.userData && req.userData.id === userId && admin === false && requestingUser.super_admin) {
        return res.status(400).json({ error: "You cannot demote yourself." });
      }
      const user = await User.findByIdAndUpdate(userId, { admin }, { new: true });
      if (!user) return res.status(404).json({ error: "User not found" });
      return res.json({ success: true, user: { _id: user._id, admin: user.admin } });
    } else {
      // Non-super-admin: prevent duplicate pending requests
      const existingPending = await AdminStatusChangeRequest.findOne({
        requestingUser: requestingUser._id,
        targetUser: userId,
        action: admin ? 'promote' : 'demote',
        status: 'pending'
      });
      if (existingPending) {
        return res.status(400).json({ error: 'You have already submitted a pending request for this action on this user.' });
      }
      // Non-super-admin: create a pending request in the DB
      const statusChangeRequest = await AdminStatusChangeRequest.create({
        requestingUser: requestingUser._id,
        targetUser: userId,
        action: admin ? 'promote' : 'demote',
        reason: reason || ''
      });
      // Notify all super admins of the new request
      const superAdmins = await User.find({ super_admin: true });
      for (const superAdmin of superAdmins) {
        await Notification.create({
          type: 'admin_status_change_request',
          notification_for: superAdmin._id,
          user: requestingUser._id,
          for_role: 'super_admin',
          // Optionally, add more info
          targetUser: userId,
          action: admin ? 'promote' : 'demote',
          statusChangeRequest: statusChangeRequest._id
        });
      }
      return res.status(200).json({ success: true, message: 'Request submitted for super admin approval.' });
    }
  } catch (err) {
    console.error("[set-admin] Admin status update error:", err);
    res.status(500).json({ error: "Failed to update admin status" });
  }
});

// Admin: List all blogs
server.post("/api/admin/all-blogs", verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, draft } = req.body;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = typeof draft === 'boolean' ? { draft } : {};
    const projection = {
      _id: 1,
      blog_id: 1,
      title: 1,
      des: 1,
      banner: 1,
      tags: 1,
      draft: 1,
      author: 1,
      publishedAt: 1,
      activity: 1
    };
    const [blogs, total] = await Promise.all([
      Blog.find(filter, projection)
        .populate('author', 'personal_info.fullname personal_info.username')
        .skip(skip)
        .limit(parseInt(limit)),
      Blog.countDocuments(filter)
    ]);
    res.json({ blogs, total });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch blogs" });
  }
});


// Global error handling middleware
server.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    
    // Don't leak error details in production
    if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({ 
            error: 'Internal server error',
            message: 'Something went wrong. Please try again later.'
        });
    }
    
    // In development, provide more details
    return res.status(500).json({ 
        error: 'Internal server error',
        message: err.message,
        stack: err.stack
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});



// Secure cookie endpoints
server.post("/api/set-auth-cookie", async (req, res) => {
    try {
        const { access_token, refresh_token, user } = req.body;
        
        if (!access_token || !refresh_token || !user) {
            return res.status(400).json({ error: 'Missing required data' });
        }

        // Set httpOnly cookies
        res.cookie('access_token', access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000 // 1 hour
        });

        res.cookie('refresh_token', refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.cookie('user_data', JSON.stringify(user), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Set CSRF token
        const csrfToken = generateCSRFToken();
        res.cookie('csrf-token', csrfToken, {
            httpOnly: false, // Accessible by JavaScript for CSRF protection
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json({ 
            success: true, 
            message: 'Authentication cookies set successfully',
            csrfToken 
        });
    } catch (error) {
        console.error('Error setting auth cookies:', error);
        res.status(500).json({ error: 'Failed to set authentication cookies' });
    }
});

server.get("/api/get-auth-cookie", async (req, res) => {
    try {
        const accessToken = req.cookies['access_token'];
        const refreshToken = req.cookies['refresh_token'];
        const userData = req.cookies['user_data'];

        if (!accessToken || !refreshToken || !userData) {
            return res.status(401).json({ error: 'No authentication data found' });
        }

        // Verify token validity
        try {
            jwt.verify(accessToken, process.env.SECRET_ACCESS_KEY, {
                audience: JWT_AUDIENCE,
                issuer: JWT_ISSUER
            });
        } catch (error) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        res.json({
            userData: {
                access_token: accessToken,
                refresh_token: refreshToken,
                user: JSON.parse(userData)
            }
        });
    } catch (error) {
        console.error('Error getting auth cookies:', error);
        res.status(500).json({ error: 'Failed to retrieve authentication data' });
    }
});

server.post("/api/update-auth-cookie", async (req, res) => {
    try {
        const { access_token } = req.body;
        
        if (!access_token) {
            return res.status(400).json({ error: 'Access token required' });
        }

        // Verify token validity
        try {
            jwt.verify(access_token, process.env.SECRET_ACCESS_KEY, {
                audience: JWT_AUDIENCE,
                issuer: JWT_ISSUER
            });
        } catch (error) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        res.cookie('access_token', access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000 // 1 hour
        });

        res.json({ success: true, message: 'Access token updated successfully' });
    } catch (error) {
        console.error('Error updating auth cookie:', error);
        res.status(500).json({ error: 'Failed to update access token' });
    }
});

server.post("/api/clear-auth-cookie", async (req, res) => {
    try {
        // Clear all auth cookies
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
        res.clearCookie('user_data');
        res.clearCookie('csrf-token');

        res.json({ success: true, message: 'Authentication cookies cleared successfully' });
    } catch (error) {
        console.error('Error clearing auth cookies:', error);
        res.status(500).json({ error: 'Failed to clear authentication cookies' });
    }
});

// Middleware to require super admin
const requireSuperAdmin = async (req, res, next) => {
  const user = await User.findById(req.user);
  if (!user || !user.super_admin) {
    return res.status(403).json({ error: 'Super admin privileges required.' });
  }
  next();
};

// Get all pending admin status change requests
server.get('/api/admin/status-change-requests', verifyJWT, requireSuperAdmin, async (req, res) => {
  try {
    const requests = await AdminStatusChangeRequest.find({ status: 'pending' })
      .populate('requestingUser', 'personal_info.fullname personal_info.email')
      .populate('targetUser', 'personal_info.fullname personal_info.email');
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Approve a pending request
server.post('/api/admin/status-change-requests/:id/approve', verifyJWT, requireSuperAdmin, async (req, res) => {
  try {
    const request = await AdminStatusChangeRequest.findById(req.params.id);
    if (!request || request.status !== 'pending') {
      return res.status(404).json({ error: 'Request not found or already processed' });
    }
    // Update the target user's admin status
    await User.findByIdAndUpdate(request.targetUser, { admin: request.action === 'promote' });
    request.status = 'approved';
    request.reviewedBy = req.user;
    request.reviewedAt = new Date();
    await request.save();
    res.json({ success: true, message: 'Request approved and user status updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve request' });
  }
});

// Reject a pending request
server.post('/api/admin/status-change-requests/:id/reject', verifyJWT, requireSuperAdmin, async (req, res) => {
  try {
    const request = await AdminStatusChangeRequest.findById(req.params.id);
    if (!request || request.status !== 'pending') {
      return res.status(404).json({ error: 'Request not found or already processed' });
    }
    request.status = 'rejected';
    request.reviewedBy = req.user;
    request.reviewedAt = new Date();
    request.notes = req.body.notes || '';
    await request.save();
    res.json({ success: true, message: 'Request rejected.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject request' });
  }
});

// Admin: Bulk user actions (promote, demote, delete)
server.post("/api/admin/bulk-user-action", verifyJWT, requireAdmin, async (req, res) => {
  const { userIds, action } = req.body;
  const requestingUserId = req.user;
  if (!Array.isArray(userIds) || !action) {
    return res.status(400).json({ error: "userIds (array) and action are required." });
  }
  try {
    const requestingUser = await User.findById(requestingUserId);
    if (!requestingUser || !requestingUser.super_admin) {
      return res.status(403).json({ error: "Only super admins can perform bulk actions." });
    }
    let result = { success: [], failed: [] };
    for (const userId of userIds) {
      if (userId === requestingUserId && action === 'demote') {
        result.failed.push({ userId, reason: "Cannot demote yourself." });
        continue;
      }
      if (userId === requestingUserId && action === 'delete') {
        result.failed.push({ userId, reason: "Cannot delete yourself." });
        continue;
      }
      const targetUser = await User.findById(userId);
      if (targetUser && targetUser.super_admin) {
        result.failed.push({ userId, reason: "Cannot demote or delete a super admin." });
        continue;
      }
      try {
        if (action === 'promote') {
          await User.findByIdAndUpdate(userId, { admin: true });
          result.success.push({ userId, action: 'promoted' });
        } else if (action === 'demote') {
          await User.findByIdAndUpdate(userId, { admin: false });
          result.success.push({ userId, action: 'demoted' });
        } else if (action === 'delete') {
          await User.findByIdAndUpdate(userId, { deleted: true });
          // Audit log
          await MaintenanceLog.create({
            action: 'user_soft_delete',
            performedBy: requestingUserId,
            targetUser: userId,
            timestamp: new Date(),
            details: `User ${userId} soft deleted by ${requestingUserId}`
          });
          result.success.push({ userId, action: 'deleted' });
        } else {
          result.failed.push({ userId, reason: 'Unknown action' });
        }
      } catch (err) {
        result.failed.push({ userId, reason: err.message });
      }
    }
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: "Bulk action failed." });
  }
});

// Get all status change requests submitted by the current user
server.get('/api/admin/my-status-change-requests', verifyJWT, async (req, res) => {
  try {
    console.log('[my-status-change-requests] req.user:', req.user);
    const requests = await AdminStatusChangeRequest.find({ requestingUser: req.user })
      .populate('targetUser', 'personal_info.fullname personal_info.email')
      .populate('reviewedBy', 'personal_info.fullname personal_info.email');
    res.json({ requests });
  } catch (err) {
    console.error('[my-status-change-requests] Error:', err);
    res.status(500).json({ error: 'Failed to fetch your requests' });
  }
});



server.get('/api/csrf-token', csrfProtection, (req, res) => {
    console.log('CSRF token endpoint hit');
    res.cookie('csrf-token', req.csrfToken(), getCSRFCookieOptions());
    res.json({ csrfToken: req.csrfToken() });
});
// Delete an admin status change request by ID
server.delete("/api/admin/delete-status-change-request/:id", verifyJWT, async (req, res) => {
    try {
      const requestId = req.params.id;
      const userId = req.user;
      const request = await AdminStatusChangeRequest.findById(requestId);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }
      // Only the requesting user or a super admin can delete
      const user = await User.findById(userId);
      if (!user || (request.requestingUser.toString() !== userId && !user.super_admin)) {
        return res.status(403).json({ error: "You do not have permission to delete this request" });
      }
      await AdminStatusChangeRequest.findByIdAndDelete(requestId);
      return res.status(200).json({ success: true, message: "Request deleted successfully" });
    } catch (err) {
      console.error("Error deleting admin status change request:", err);
      return res.status(500).json({ error: "Failed to delete request" });
    }
  });

// Admin: Database Maintenance
server.post("/api/admin/database-maintenance", verifyJWT, requireAdmin, async (req, res) => {
    try {
        // 1. Reindex all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        let optimizedIndexes = 0;
        for (const col of collections) {
            try {
                if (mongoose.connection.db.collection(col.name).reIndex) {
                    await mongoose.connection.db.collection(col.name).reIndex();
                    optimizedIndexes++;
                }
            } catch (err) {
                // Log and skip reIndex errors (common on MongoDB Atlas)
                console.warn(`Could not reIndex collection ${col.name}:`, err.message);
            }
        }

        // 2. Clean up orphaned comments (comments whose blog no longer exists)
        const Comment = (await import('./Schema/Comment.js')).default;
        const Blog = (await import('./Schema/Blog.js')).default;
        const User = (await import('./Schema/User.js')).default;
        let cleanedComments = 0;
        let cleanedBlogs = 0;

        // Remove comments with missing blog
        const allComments = await Comment.find({});
        for (const comment of allComments) {
            const blogExists = await Blog.exists({ _id: comment.blog });
            if (!blogExists) {
                await Comment.deleteOne({ _id: comment._id });
                cleanedComments++;
            }
        }

        // Remove blogs with missing author
        const allBlogs = await Blog.find({});
        for (const blog of allBlogs) {
            const authorExists = await User.exists({ _id: blog.author });
            if (!authorExists) {
                await Blog.deleteOne({ _id: blog._id });
                cleanedBlogs++;
            }
        }

        // 3. Optionally, get database stats
        let sizeReduction = null;
        try {
            const stats = await mongoose.connection.db.stats();
            sizeReduction = (stats.dataSize / (1024 * 1024)).toFixed(2) + ' MB';
        } catch (err) {
            // ignore
        }

        // (after maintenance is performed, before return)
        const log = new MaintenanceLog({
            type: 'cleanup',
            message: `Optimized ${optimizedIndexes} indexes, cleaned ${cleanedComments} orphaned comments, cleaned ${cleanedBlogs} blogs with missing authors.`,
            status: 'success',
            timestamp: new Date(),
            optimizedIndexes,
            cleanedRecords: {
                orphanedComments: cleanedComments,
                blogsWithMissingAuthors: cleanedBlogs
            },
            sizeReduction
        });
        await log.save();

        return res.json({
            optimizedIndexes,
            cleanedRecords: {
                orphanedComments: cleanedComments,
                blogsWithMissingAuthors: cleanedBlogs
            },
            sizeReduction
        });
    } catch (err) {
        console.error('Database maintenance error:', err);
        return res.status(500).json({ error: 'Database maintenance failed: ' + (err && err.message ? err.message : err) });
    }
});

// Admin: System Health Check
server.get("/api/admin/system-health", verifyJWT, requireAdmin, async (req, res) => {
    try {
        const healthData = {
            serverStatus: 'Healthy',
            databaseStatus: 'Unknown',
            memoryUsage: 'Unknown',
            cpuUsage: 'Unknown',
            diskUsage: 'Unknown',
            networkUsage: 'Unknown',
            responseTime: 'Unknown',
            errorRate: 'Unknown',
            uptime: process.uptime(),
            issues: []
        };

        // --- CPU Usage ---
        try {
            const cpuUsage = process.cpuUsage();
            // Calculate CPU percent (approximate, per process)
            // This is a snapshot, not a time-delta, so it's not perfect
            const userCPU = cpuUsage.user / 1000; // microseconds to ms
            const systemCPU = cpuUsage.system / 1000;
            healthData.cpuUsage = (userCPU + systemCPU).toFixed(2) + ' ms';
            // Log CPU usage
            await new SystemHealthLog({
                metric: 'cpu',
                value: userCPU + systemCPU,
                status: (userCPU + systemCPU) > 1000 ? 'warning' : 'normal',
                details: cpuUsage
            }).save();
        } catch (err) {
            healthData.cpuUsage = 'Unknown';
            healthData.issues.push('Failed to get CPU usage');
        }

        // --- Memory Usage ---
        try {
            const memUsage = process.memoryUsage();
            const memUsageMB = {
                rss: Math.round(memUsage.rss / 1024 / 1024),
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                external: Math.round(memUsage.external / 1024 / 1024)
            };
            healthData.memoryUsage = `${memUsageMB.heapUsed}MB / ${memUsageMB.heapTotal}MB`;
            const memoryUsagePercent = (memUsageMB.heapUsed / memUsageMB.heapTotal) * 100;
            if (memoryUsagePercent > 80) {
                healthData.issues.push(`High memory usage: ${Math.round(memoryUsagePercent)}%`);
            }
            // Log memory usage
            await new SystemHealthLog({
                metric: 'memory',
                value: memoryUsagePercent,
                status: memoryUsagePercent > 80 ? 'warning' : 'normal',
                details: memUsageMB
            }).save();
        } catch (memErr) {
            healthData.memoryUsage = 'Unknown';
            healthData.issues.push('Failed to get memory usage');
        }

        // --- Disk Usage ---
        try {
            const { execSync } = await import('child_process');
            let diskInfo = null;
            if (process.platform === 'win32') {
                // Windows: use wmic
                diskInfo = execSync('wmic logicaldisk get size,freespace,caption').toString();
            } else {
                // Unix: use df
                diskInfo = execSync('df -h /').toString();
            }
            healthData.diskUsage = diskInfo;
            // Log disk usage (not easily as a number, so log as 'other')
            await new SystemHealthLog({
                metric: 'disk',
                value: 0,
                status: 'normal',
                details: diskInfo
            }).save();
        } catch (err) {
            healthData.diskUsage = 'Unknown';
            healthData.issues.push('Failed to get disk usage');
        }

        // --- Network Usage ---
        try {
            // Node.js does not provide built-in network stats; use os.networkInterfaces as a placeholder
            const os = await import('os');
            const netInfo = os.networkInterfaces();
            healthData.networkUsage = JSON.stringify(netInfo);
            await new SystemHealthLog({
                metric: 'network',
                value: 0,
                status: 'normal',
                details: netInfo
            }).save();
        } catch (err) {
            healthData.networkUsage = 'Unknown';
            healthData.issues.push('Failed to get network usage');
        }

        // --- Response Time (simulate, as example) ---
        try {
            // In real use, you would track response times over time
            const start = Date.now();
            await mongoose.connection.db.admin().ping();
            const end = Date.now();
            const responseTime = end - start;
            healthData.responseTime = responseTime + ' ms';
            await new SystemHealthLog({
                metric: 'response_time',
                value: responseTime,
                status: responseTime > 500 ? 'warning' : 'normal',
                details: null
            }).save();
        } catch (err) {
            healthData.responseTime = 'Unknown';
            healthData.issues.push('Failed to measure response time');
        }

        // --- Error Rate (simulate, as example) ---
        try {
            // In real use, you would track errors over time (e.g., in logs)
            // Here, we simulate as 0
            const errorRate = 0;
            healthData.errorRate = errorRate + ' %';
            await new SystemHealthLog({
                metric: 'error_rate',
                value: errorRate,
                status: errorRate > 5 ? 'warning' : 'normal',
                details: null
            }).save();
        } catch (err) {
            healthData.errorRate = 'Unknown';
            healthData.issues.push('Failed to get error rate');
        }

        // --- Database Status (existing logic) ---
        try {
            const dbState = mongoose.connection.readyState;
            switch (dbState) {
                case 0:
                    healthData.databaseStatus = 'Disconnected';
                    healthData.issues.push('Database is disconnected');
                    break;
                case 1:
                    healthData.databaseStatus = 'Connected';
                    break;
                case 2:
                    healthData.databaseStatus = 'Connecting';
                    healthData.issues.push('Database is still connecting');
                    break;
                case 3:
                    healthData.databaseStatus = 'Disconnecting';
                    healthData.issues.push('Database is disconnecting');
                    break;
                default:
                    healthData.databaseStatus = 'Unknown';
                    healthData.issues.push('Database state is unknown');
            }
            if (dbState === 1) {
                try {
                    await mongoose.connection.db.admin().ping();
                } catch (pingErr) {
                    healthData.databaseStatus = 'Error';
                    healthData.issues.push('Database ping failed');
                }
            }
        } catch (dbErr) {
            healthData.databaseStatus = 'Error';
            healthData.issues.push('Database connection error: ' + dbErr.message);
        }

        // --- Uptime ---
        const uptimeHours = Math.floor(healthData.uptime / 3600);
        const uptimeMinutes = Math.floor((healthData.uptime % 3600) / 60);
        healthData.uptime = `${uptimeHours}h ${uptimeMinutes}m`;

        // --- Env Vars ---
        const requiredEnvVars = [
            'MONGO_URI',
            'SECRET_ACCESS_KEY',
            'ADMIN_EMAIL',
            'ADMIN_EMAIL_PASSWORD'
        ];
        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                healthData.issues.push(`Missing environment variable: ${envVar}`);
            }
        }

        // --- Server Status ---
        if (healthData.issues.length > 0) {
            healthData.serverStatus = 'Warning';
        }

        return res.json(healthData);
    } catch (err) {
        console.error('System health check error:', err);
        return res.status(500).json({ 
            error: 'System health check failed.',
            serverStatus: 'Error',
            databaseStatus: 'Unknown',
            memoryUsage: 'Unknown',
            cpuUsage: 'Unknown',
            diskUsage: 'Unknown',
            networkUsage: 'Unknown',
            responseTime: 'Unknown',
            errorRate: 'Unknown',
            uptime: 'Unknown',
            issues: ['System health check failed: ' + err.message]
        });
    }
});

// === ADMIN ANALYTICS HISTORY ENDPOINTS ===
// Get database maintenance history (last 10)
server.get("/api/admin/database-maintenance-history", verifyJWT, requireAdmin, async (req, res) => {
    try {
        const history = await MaintenanceLog.find({ type: 'cleanup' }).sort({ timestamp: -1 }).limit(10);
        res.json({ history });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch maintenance history' });
    }
});
// Get latest database maintenance log
server.get("/api/admin/database-maintenance-latest", verifyJWT, requireAdmin, async (req, res) => {
    try {
        const latest = await MaintenanceLog.findOne({ type: 'cleanup' }).sort({ timestamp: -1 });
        res.json({ latest });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch latest maintenance log' });
    }
});
// Get system health history (last 10, all metrics or filter by metric)
server.get("/api/admin/system-health-history", verifyJWT, requireAdmin, async (req, res) => {
    try {
        const metric = req.query.metric; // e.g., 'memory', 'cpu', etc.
        let query = {};
        if (metric) query.metric = metric;
        const history = await SystemHealthLog.find(query).sort({ timestamp: -1 }).limit(10);
        res.json({ history });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch system health history' });
    }
});
// Get latest system health log (all metrics or filter by metric)
server.get("/api/admin/system-health-latest", verifyJWT, requireAdmin, async (req, res) => {
    try {
        const metric = req.query.metric;
        let query = {};
        if (metric) query.metric = metric;
        const latest = await SystemHealthLog.findOne(query).sort({ timestamp: -1 });
        res.json({ latest });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch latest system health log' });
    }
});



// === ADMIN SPAM COMMENT MANAGEMENT ===
// Get all spam comments
server.get("/api/admin/spam-comments", verifyJWT, requireAdmin, async (req, res) => {
    try {
        const spamComments = await Comment.find({ isSpam: true })
            .populate("commented_by", "personal_info.fullname personal_info.username personal_info.profile_img")
            .sort({ commentedAt: -1 });
        return res.status(200).json({ comments: spamComments });
    } catch (err) {
        console.error("Error fetching spam comments:", err);
        return res.status(500).json({ error: err.message });
    }
});

// Mark a comment as spam or not spam
server.post("/api/admin/mark-spam", verifyJWT, requireAdmin, async (req, res) => {
    try {
        const { comment_id, isSpam } = req.body;
        if (!comment_id || typeof isSpam !== "boolean") {
            return res.status(400).json({ error: "comment_id and isSpam (boolean) are required" });
        }
        // Recursive function to mark comment and all children as spam/not spam
        async function markSpamRecursive(id, spamStatus) {
            await Comment.findByIdAndUpdate(id, { isSpam: spamStatus });
            const children = await Comment.find({ parent: id });
            for (const child of children) {
                await markSpamRecursive(child._id, spamStatus);
            }
        }
        await markSpamRecursive(comment_id, isSpam);
        // Return the top-level comment
        const comment = await Comment.findById(comment_id);
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }
        return res.status(200).json({ success: true, comment });
    } catch (err) {
        console.error("Error updating spam status:", err);
        return res.status(500).json({ error: err.message });
    }
});

// Delete a spam comment
server.delete("/api/admin/delete-spam-comment/:comment_id", verifyJWT, requireAdmin, async (req, res) => {
    try {
        const { comment_id } = req.params;
        if (!comment_id) {
            return res.status(400).json({ error: "comment_id is required" });
        }
        const comment = await Comment.findById(comment_id);
        if (!comment || !comment.isSpam) {
            return res.status(404).json({ error: "Spam comment not found" });
        }
        // Recursive function to delete comment and all children
        async function deleteSpamCommentAndChildren(id) {
            const children = await Comment.find({ parent: id });
            for (const child of children) {
                await deleteSpamCommentAndChildren(child._id);
            }
            await Comment.findByIdAndDelete(id);
        }
        await deleteSpamCommentAndChildren(comment_id);
        return res.status(200).json({ success: true, message: "Spam comment and its replies deleted" });
    } catch (err) {
        console.error("Error deleting spam comment:", err);
        return res.status(500).json({ error: err.message });
    }
});

// === ADMIN COMMENT ANALYTICS ===
console.log('Registering /api/admin/comment-analytics endpoint');
server.get("/api/admin/comment-analytics", verifyJWT, requireAdmin, async (req, res) => {
    console.log("[API] /api/admin/comment-analytics called");
    try {
        console.log("Admin: Fetching comment analytics...");
        
        const totalComments = await Comment.countDocuments();
        console.log("Admin: Total comments:", totalComments);
        
        const totalBlogs = await Blog.countDocuments();
        console.log("Admin: Total blogs:", totalBlogs);
        
        // Count blogs that actually have comments
        // WARNING: This aggregation can be slow for very large datasets.
        // Consider adding an index on comments.blog_id or using a precomputed field if performance becomes an issue.
        const blogsWithComments = await Blog.aggregate([
            {
                $lookup: {
                    from: "comments",
                    localField: "_id",
                    foreignField: "blog_id",
                    as: "comments"
                }
            },
            {
                $match: {
                    "comments.0": { $exists: true }
                }
            },
            {
                $count: "count"
            }
        ]);
        
        // Debug: Let's also check a few sample comments to see their structure
        const sampleComments = await Comment.find({}).limit(3);
        console.log("Admin: Sample comments structure:", sampleComments.map(c => ({
            _id: c._id,
            blog_id: c.blog_id,
            comment: c.comment?.substring(0, 50) + '...'
        })));
        
        // Debug: Let's also check a few sample blogs to see their structure
        const sampleBlogs = await Blog.find({}).limit(3);
        console.log("Admin: Sample blogs structure:", sampleBlogs.map(b => ({
            _id: b._id,
            blog_id: b.blog_id,
            title: b.title
        })));
        
        const blogsWithCommentsCount = blogsWithComments.length > 0 ? blogsWithComments[0].count : 0;
        console.log("Admin: Blogs with comments:", blogsWithCommentsCount);
        
        const avgCommentsPerBlog = blogsWithCommentsCount > 0 ? (totalComments / blogsWithCommentsCount) : 0;
        console.log("Admin: Average comments per blog:", avgCommentsPerBlog);
        
        // Get recent comments with more details
        let recentActivity = await Comment.find({})
            .sort({ commentedAt: -1 })
            .limit(10)
            .populate("commented_by", "personal_info.fullname personal_info.username personal_info.profile_img")
            .populate("blog_id", "title blog_id");
        // Ensure every comment has a valid commentedAt
        recentActivity = recentActivity.map(c => ({
            ...c.toObject(),
            commentedAt: c.commentedAt || c.createdAt || c.updatedAt || new Date()
        }));
        
        console.log("Admin: Recent activity count:", recentActivity.length);
        
        const analyticsData = {
            totalComments,
            totalBlogs,
            blogsWithComments: blogsWithCommentsCount,
            avgCommentsPerBlog,
            recentActivity
        };
        
        console.log("Admin: Sending analytics data:", analyticsData);
        res.status(200).json(analyticsData);
    } catch (err) {
        console.error("Error fetching comment analytics:", err);
        res.status(500).json({ error: err.message });
    }
});

// === ADMIN NEWSLETTER MANAGEMENT ===

// Get all newsletter subscribers
server.get("/api/admin/newsletter-subscribers", verifyJWT, requireAdmin, async (req, res) => {
    try {
        const subscribers = await Newsletter.find({}).sort({ subscribedAt: -1 });
        const activeCount = await Newsletter.countDocuments({ isActive: true });
        const inactiveCount = await Newsletter.countDocuments({ isActive: false });
        
        res.json({
            subscribers,
            stats: {
                total: subscribers.length,
                active: activeCount,
                inactive: inactiveCount
            }
        });
    } catch (err) {
        console.error("Error fetching newsletter subscribers:", err);
        res.status(500).json({ error: "Failed to fetch subscribers." });
    }
});

// Send newsletter to all active subscribers
server.post("/api/admin/send-newsletter", verifyJWT, requireAdmin, async (req, res) => {
    try {
        const { subject, content } = req.body;
        if (!subject || !content) {
            return res.status(400).json({ error: "Subject and content are required." });
        }
        const result = await sendNewsletterToSubscribers(subject, content);
        await MaintenanceLog.create({
            type: 'newsletter',
            action: 'send',
            performedBy: req.user,
            message: `Newsletter sent to all active subscribers`,
            status: result.success ? 'success' : 'failure',
            details: `Subject: ${subject}, Success: ${result.successCount}, Failed: ${result.failureCount}`
        });
        if (result.success) {
            res.json({
                success: true,
                message: `Newsletter sent to ${result.successCount} subscribers`,
                stats: result
            });
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (err) {
        await MaintenanceLog.create({
            type: 'newsletter',
            action: 'send',
            performedBy: req.user,
            message: 'Newsletter send failed',
            status: 'failure',
            details: err.message
        });
        res.status(500).json({ error: "Failed to send newsletter." });
    }
});

// Send test newsletter to a specific email
server.post("/api/admin/send-test-newsletter", verifyJWT, requireAdmin, async (req, res) => {
    try {
        const { email, subject, content } = req.body;
        
        if (!email || !subject || !content) {
            return res.status(400).json({ error: "Email, subject, and content are required." });
        }

        console.log('📧 [Admin] Sending test newsletter to:', email);

        const result = await sendNewsletterToSubscriber(email, subject, content);
        
        if (result.success) {
            console.log('📧 [Admin] Test newsletter sent successfully');
            res.json({ success: true, message: "Test newsletter sent successfully." });
        } else {
            console.error('📧 [Admin] Test newsletter failed:', result.error);
            res.status(500).json({ error: result.error });
        }
    } catch (err) {
        console.error("Error sending test newsletter:", err);
        res.status(500).json({ error: "Failed to send test newsletter." });
    }
});

// Delete a newsletter subscriber
server.delete("/api/admin/newsletter-subscriber/:id", verifyJWT, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const subscriber = await Newsletter.findByIdAndDelete(id);
        if (!subscriber) {
            return res.status(404).json({ error: "Subscriber not found." });
        }
        await MaintenanceLog.create({
            type: 'newsletter',
            action: 'delete',
            performedBy: req.user,
            target: subscriber.email,
            message: 'Newsletter subscriber deleted',
            status: 'success',
            details: `Subscriber ID: ${id}`
        });
        res.json({ success: true, message: "Subscriber deleted successfully." });
    } catch (err) {
        await MaintenanceLog.create({
            type: 'newsletter',
            action: 'delete',
            performedBy: req.user,
            message: 'Newsletter subscriber delete failed',
            status: 'failure',
            details: err.message
        });
        res.status(500).json({ error: "Failed to delete subscriber." });
    }
});

// Update subscriber status (activate/deactivate)
server.patch("/api/admin/newsletter-subscriber/:id", verifyJWT, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ error: "isActive must be a boolean." });
        }
        const subscriber = await Newsletter.findByIdAndUpdate(
            id, 
            { isActive }, 
            { new: true }
        );
        if (!subscriber) {
            return res.status(404).json({ error: "Subscriber not found." });
        }
        await MaintenanceLog.create({
            type: 'newsletter',
            action: isActive ? 'activate' : 'deactivate',
            performedBy: req.user,
            target: subscriber.email,
            message: `Subscriber ${isActive ? 'activated' : 'deactivated'}`,
            status: 'success',
            details: `Subscriber ID: ${id}`
        });
        res.json({ 
            success: true, 
            message: `Subscriber ${isActive ? 'activated' : 'deactivated'} successfully.`,
            subscriber 
        });
    } catch (err) {
        await MaintenanceLog.create({
            type: 'newsletter',
            action: 'status-change',
            performedBy: req.user,
            message: 'Newsletter subscriber status change failed',
            status: 'failure',
            details: err.message
        });
        res.status(500).json({ error: "Failed to update subscriber." });
    }
});

// === USER ACTIVATION/DEACTIVATION ENDPOINT ===
server.patch("/api/admin/user-status", verifyJWT, requireAdmin, async (req, res) => {
  const { userId, active } = req.body;
  if (typeof active !== "boolean" || !userId) {
    return res.status(400).json({ error: "userId and active (boolean) are required." });
  }
  try {
    const requestingUser = await User.findById(req.user);
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: "Target user not found." });
    }
    // Prevent self-activation/deactivation
    if (req.user === userId) {
      return res.status(403).json({ error: "You cannot change your own active status." });
    }
    // Prevent non-super-admins from activating/deactivating super admins
    if (targetUser.super_admin && !requestingUser.super_admin) {
      return res.status(403).json({ error: "Only super admins can change the status of a super admin." });
    }
    // Prevent deactivating another super admin (even by super admin)
    if (targetUser.super_admin && !active) {
      return res.status(403).json({ error: "Super admins cannot be deactivated." });
    }
    targetUser.active = active;
    await targetUser.save();
    return res.json({ success: true, user: { _id: targetUser._id, active: targetUser.active } });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update user status." });
  }
});

// === SINGLE USER SOFT DELETE ENDPOINT ===
server.delete("/api/admin/user/:id", verifyJWT, requireAdmin, async (req, res) => {
  const userId = req.params.id;
  const requestingUserId = req.user;
  try {
    const requestingUser = await User.findById(requestingUserId);
    if (!requestingUser || !requestingUser.super_admin) {
      return res.status(403).json({ error: "Only super admins can delete users." });
    }
    if (userId === requestingUserId) {
      return res.status(403).json({ error: "Cannot delete yourself." });
    }
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found." });
    }
    if (targetUser.super_admin) {
      return res.status(403).json({ error: "Cannot delete a super admin." });
    }
    if (targetUser.deleted) {
      return res.status(400).json({ error: "User is already deleted." });
    }
    targetUser.deleted = true;
    await targetUser.save();
    await MaintenanceLog.create({
      action: 'user_soft_delete',
      performedBy: requestingUserId,
      targetUser: userId,
      timestamp: new Date(),
      details: `User ${userId} soft deleted by ${requestingUserId}`
    });
    return res.json({ success: true, userId });
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete user." });
    }
});

// Unsubscribe from newsletter
server.post('/api/unsubscribe', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Unsubscribe token is required.' });
    }
    // Find the subscriber by unsubscribeToken
    const subscriber = await Newsletter.findOne({ unsubscribeToken: token, isActive: true });
    if (!subscriber) {
      return res.status(404).json({ error: 'Invalid or expired unsubscribe link.' });
    }
    subscriber.isActive = false;
    // Optionally, clear the token so it can't be reused
    subscriber.unsubscribeToken = undefined;
    await subscriber.save();
    return res.json({ message: 'You have been unsubscribed from the newsletter.' });
  } catch (err) {
    console.error('Unsubscribe error:', err);
    res.status(500).json({ error: 'Failed to unsubscribe.' });
  }
});

// Add specific rate limiter for resending newsletter verification
const resendNewsletterVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 requests per windowMs
  message: {
    error: 'Too many verification email requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Resend newsletter verification email
server.post('/api/resend-newsletter-verification', resendNewsletterVerificationLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ error: 'Valid email is required.' });
    }
    let subscriber = await Newsletter.findOne({ email });
    if (!subscriber) {
      return res.status(404).json({ error: 'Subscriber not found.' });
    }
    if (subscriber.isActive) {
      return res.status(400).json({ error: 'Subscription already verified.' });
    }
    // Generate new token
    const verificationToken = nanoid(32);
    subscriber.verificationToken = verificationToken;
    await subscriber.save();
    // Send verification email
    // Use utility if available, else inline
    try {
      // Try to use utility
      let sendNewsletterVerificationEmail;
      try {
        sendNewsletterVerificationEmail = (await import('./utils/email.js')).sendNewsletterVerificationEmail;
      } catch {}
      if (sendNewsletterVerificationEmail) {
        await sendNewsletterVerificationEmail(email, verificationToken);
      } else {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.ADMIN_EMAIL,
            pass: process.env.ADMIN_EMAIL_PASSWORD
          }
        });
        const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-newsletter?token=${verificationToken}`;
        await transporter.sendMail({
          from: `Islamic Stories <${process.env.ADMIN_EMAIL}>`,
          to: email,
          subject: 'Confirm your newsletter subscription',
          text: `Thank you for subscribing! Please confirm your subscription by clicking this link: ${verifyUrl}`
        });
      }
      return res.status(200).json({ message: 'Verification email resent. Please check your inbox.' });
    } catch (emailErr) {
      console.error('Error sending verification email:', emailErr);
      return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// === ADMIN NEWSLETTER MANAGEMENT ===

// ... existing code ...

// Bulk update (activate/deactivate) newsletter subscribers
server.post("/api/admin/newsletter-subscribers/bulk-update", verifyJWT, requireAdmin, async (req, res) => {
    const { ids, isActive } = req.body;
    if (!Array.isArray(ids) || typeof isActive !== 'boolean') {
        return res.status(400).json({ error: "ids (array) and isActive (boolean) are required." });
    }
    let result = { success: [], failed: [] };
    for (const id of ids) {
        try {
            const subscriber = await Newsletter.findByIdAndUpdate(id, { isActive }, { new: true });
            if (subscriber) {
                result.success.push(id);
                await MaintenanceLog.create({
                    type: 'newsletter',
                    action: isActive ? 'activate' : 'deactivate',
                    performedBy: req.user,
                    target: subscriber.email,
                    message: `Subscriber ${isActive ? 'activated' : 'deactivated'} (bulk)`,
                    status: 'success',
                    details: `Subscriber ID: ${id}`
                });
            } else {
                result.failed.push({ id, reason: 'Not found' });
            }
        } catch (err) {
            result.failed.push({ id, reason: err.message });
        }
    }
    res.json(result);
});

// Bulk delete newsletter subscribers
server.post("/api/admin/newsletter-subscribers/bulk-delete", verifyJWT, requireAdmin, async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
        return res.status(400).json({ error: "ids (array) is required." });
    }
    let result = { success: [], failed: [] };
    for (const id of ids) {
        try {
            const subscriber = await Newsletter.findByIdAndDelete(id);
            if (subscriber) {
                result.success.push(id);
                await MaintenanceLog.create({
                    type: 'newsletter',
                    action: 'delete',
                    performedBy: req.user,
                    target: subscriber.email,
                    message: 'Newsletter subscriber deleted (bulk)',
                    status: 'success',
                    details: `Subscriber ID: ${id}`
                });
            } else {
                result.failed.push({ id, reason: 'Not found' });
            }
        } catch (err) {
            result.failed.push({ id, reason: err.message });
        }
    }
    res.json(result);
});
// ... existing code ...

// Helper for cookie options
function getCookieOptions({ crossSite = false, maxAge } = {}) {
  const isProd = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT_NAME;
  return {
    httpOnly: true,
    secure: isProd, // false in local dev, true in production
    sameSite: isProd ? (crossSite ? 'none' : 'lax') : 'lax', // 'lax' for local dev, 'none' for crossSite in prod
    maxAge
  };
}

// Helper for CSRF cookie (not httpOnly)
function getCSRFCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT_NAME;
  return {
    httpOnly: false, // Must be false so frontend JS can read it
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  };
}

// --- Ad Banner API ---

// Get current ad banner (public)
server.get('/api/ad-banner', async (req, res) => {
  try {
    const banner = await AdBanner.findOne({ visible: true }).sort({ updatedAt: -1 });
    if (!banner) return res.status(404).json({ success: false, error: 'No ad banner found.' });
    res.json({ success: true, banner });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

// Middleware: check admin (reuse existing or simple check)
const isAdmin = (req, res, next) => {
  if (req.admin || req.super_admin) return next();
  return res.status(403).json({ success: false, error: 'Admin access required.' });
};

// List all ad banners (admin only)
server.get('/api/admin/ad-banners', verifyJWT, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    const [banners, total] = await Promise.all([
      AdBanner.find({}).sort({ updatedAt: -1 }).skip(skip).limit(limit),
      AdBanner.countDocuments({})
    ]);
    res.json({ success: true, banners, total, page, limit });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

// Set/create ad banner (admin only)
server.post('/api/admin/ad-banner', verifyJWT, isAdmin, async (req, res) => {
  try {
    const { imageUrl, link, visible } = req.body;
    if (!imageUrl) return res.status(400).json({ success: false, error: 'Image URL required.' });
    if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(imageUrl)) return res.status(400).json({ success: false, error: 'Invalid image file type. Only jpg, jpeg, png, gif, webp allowed.' });
    if (link && !/^https?:\/\/.+/.test(link)) return res.status(400).json({ success: false, error: 'Invalid link URL.' });
    // Duplicate image check
    const existingBanner = await AdBanner.findOne({ imageUrl });
    if (existingBanner) {
      return res.status(400).json({ success: false, error: 'A banner with this image already exists.' });
    }
    // If visible is true, set all others to visible: false
    if (visible !== false) {
      await AdBanner.updateMany({ visible: true }, { visible: false });
    }
    const banner = new AdBanner({ imageUrl, link: link || '', visible: visible !== false });
    await banner.save();
    res.json({ success: true, banner });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

// Update ad banner (admin only)
server.put('/api/admin/ad-banner/:id', verifyJWT, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl, link, visible } = req.body;
    const update = {};
    if (imageUrl) update.imageUrl = imageUrl;
    if (link !== undefined) {
      if (link && !/^https?:\/\/.+/.test(link)) return res.status(400).json({ success: false, error: 'Invalid link URL.' });
      update.link = link;
    }
    if (visible !== undefined) {
      if (visible) {
        // Hide all other banners
        await AdBanner.updateMany({ visible: true }, { visible: false });
      }
      update.visible = visible;
    }
    update.updatedAt = Date.now();
    const banner = await AdBanner.findByIdAndUpdate(id, update, { new: true });
    if (!banner) return res.status(404).json({ success: false, error: 'Banner not found.' });
    res.json({ success: true, banner });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

// Hide ad banner (admin only)
server.patch('/api/admin/ad-banner/:id/hide', verifyJWT, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await AdBanner.findById(id);
    if (!banner) return res.status(404).json({ success: false, error: 'Banner not found.' });
    // Delete image from Cloudinary with error handling
    try {
      await deleteCloudinaryImage(banner.imageUrl, true);
    } catch (imgErr) {
      return res.status(500).json({ success: false, error: 'Failed to delete image from Cloudinary. Banner not hidden.' });
    }
    banner.visible = false;
    banner.updatedAt = Date.now();
    await banner.save();
    res.json({ success: true, banner });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

// Delete ad banner (admin only)
server.delete('/api/admin/ad-banner/:id', verifyJWT, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await AdBanner.findById(id);
    if (!banner) return res.status(404).json({ success: false, error: 'Banner not found.' });
    // Delete image from Cloudinary with error handling
    try {
      await deleteCloudinaryImage(banner.imageUrl, true);
    } catch (imgErr) {
      return res.status(500).json({ success: false, error: 'Failed to delete image from Cloudinary. Banner not deleted.' });
    }
    await AdBanner.findByIdAndDelete(id);
    res.json({ success: true, banner });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

// Helper to delete Cloudinary image by URL
async function deleteCloudinaryImage(imageUrl, throwOnError = false) {
  if (imageUrl && imageUrl.includes('cloudinary.com')) {
    try {
      // Extract public_id from the URL
      const matches = imageUrl.match(/\/([^\/]+)\.(jpg|jpeg|png|gif|webp)$/i);
      if (matches && matches[1]) {
        const publicId = matches[1];
        await cloudinary.uploader.destroy(publicId);
      }
    } catch (imgErr) {
      console.error('Failed to delete ad banner image from Cloudinary:', imgErr);
      if (throwOnError) throw imgErr;
    }
  }
}

// Rate limiters for ad banner analytics
const adBannerViewLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per minute
  message: { error: 'Too many ad banner view requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
const adBannerClickLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per minute
  message: { error: 'Too many ad banner click requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Increment ad banner views
server.patch('/api/ad-banner/view', adBannerViewLimiter, async (req, res) => {
  try {
    const banner = await AdBanner.findOneAndUpdate(
      { visible: true },
      { $inc: { views: 1 } },
      { new: true, sort: { updatedAt: -1 } }
    );
    if (!banner) return res.status(404).json({ success: false, error: 'No ad banner found.' });
    res.json({ success: true, views: banner.views });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});
// Increment ad banner clicks
server.patch('/api/ad-banner/click', adBannerClickLimiter, async (req, res) => {
  try {
    const banner = await AdBanner.findOneAndUpdate(
      { visible: true },
      { $inc: { clicks: 1 } },
      { new: true, sort: { updatedAt: -1 } }
    );
    if (!banner) return res.status(404).json({ success: false, error: 'No ad banner found.' });
    res.json({ success: true, clicks: banner.clicks });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

// Log ad banner image load errors (for analytics)
server.post('/api/ad-banner/image-error', async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) return res.status(400).json({ success: false, error: 'imageUrl required' });
  // For now, just log to console. In production, store in DB or analytics system.
  console.warn(`[AdBanner] Image load error reported: ${imageUrl} at ${new Date().toISOString()}`);
  res.json({ success: true });
});