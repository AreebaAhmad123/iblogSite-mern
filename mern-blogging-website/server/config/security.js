// Security configuration for Islamic Stories Blog
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';

export const securityConfig = {
    // JWT Configuration
    jwt: {
        audience: 'islamic-stories-users',
        issuer: 'islamic-stories-server',
        accessTokenExpiry: process.env.JWT_EXPIRES_IN || '1h',
        refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        secret: process.env.SECRET_ACCESS_KEY
    },

    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 5,
        message: {
            error: 'Too many requests from this IP, please try again later.',
            retryAfter: Math.ceil(15 * 60 / 60)
        }
    },

    // Password Policy
    password: {
        minLength: 8,
        maxLength: 128,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        allowedSpecialChars: '!@#$%^&*',
        regex: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/
    },

    // File Upload Security
    fileUpload: {
        maxSize: parseInt(process.env.MAX_FILE_SIZE) || 2 * 1024 * 1024, // 2MB
        allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/jpg').split(','),
        allowedExtensions: ['.jpg', '.jpeg', '.png'],
        maxFiles: 1,
        scanForMalware: true
    },

    // CORS Configuration
    cors: {
        allowedOrigins: [
            'https://prismatic-starship-137fe3.netlify.app',
            'http://localhost:5173',
            'http://localhost:3000'
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        exposedHeaders: ['X-Total-Count']
    },

    // Session Security
    session: {
        secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }
    },

    // Database Security
    database: {
        connectionTimeout: parseInt(process.env.MONGODB_CONNECTION_TIMEOUT) || 5000,
        socketTimeout: parseInt(process.env.MONGODB_SOCKET_TIMEOUT) || 45000,
        maxPoolSize: 10,
        minPoolSize: 1
    },

    // Input Validation
    validation: {
        maxStringLength: 1000,
        maxArrayLength: 100,
        sanitizeHtml: true,
        preventXSS: true,
        preventSQLInjection: true
    },

    // Security Headers
    headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self'; frame-src 'none'; object-src 'none';"
    }
};

// Security utility functions
export const securityUtils = {
    // Generate secure random string
    generateSecureToken: (length = 32) => {
        return crypto.randomBytes(length).toString('hex');
    },

    // Hash password with salt
    hashPassword: async (password, saltRounds = 12) => {
        const bcrypt = await import('bcrypt');
        return bcrypt.hash(password, saltRounds);
    },

    // Compare password with hash
    comparePassword: async (password, hash) => {
        const bcrypt = await import('bcrypt');
        return bcrypt.compare(password, hash);
    },

    // Sanitize input to prevent XSS
    sanitizeInput: (input) => {
        if (typeof input !== 'string') return input;
        return input
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, '') // Remove event handlers
            .replace(/data:/gi, '') // Remove data: protocol
            .replace(/vbscript:/gi, ''); // Remove vbscript: protocol
    },

    // Validate email format
    validateEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.toLowerCase().trim());
    },

    // Validate password strength
    validatePassword: (password) => {
        return securityConfig.password.regex.test(password);
    },

    // Validate file type
    validateFileType: (mimeType, filename) => {
        const allowedTypes = securityConfig.fileUpload.allowedTypes;
        const allowedExtensions = securityConfig.fileUpload.allowedExtensions;
        
        const hasValidMimeType = allowedTypes.includes(mimeType);
        const hasValidExtension = allowedExtensions.some(ext => 
            filename.toLowerCase().endsWith(ext)
        );
        
        return hasValidMimeType && hasValidExtension;
    },

    // Validate file size
    validateFileSize: (size) => {
        return size <= securityConfig.fileUpload.maxSize;
    },

    // Escape regex special characters
    escapeRegex: (string) => {
        return string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    },

    // Generate CSRF token
    generateCSRFToken: () => {
        return crypto.randomBytes(32).toString('hex');
    },

    // Validate CSRF token
    validateCSRFToken: (token, storedToken) => {
        return token && storedToken && token === storedToken;
    },

    // Log security events
    logSecurityEvent: (event, details) => {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            event,
            details,
            ip: details.ip || 'unknown',
            userAgent: details.userAgent || 'unknown'
        };
        
        console.log(`[SECURITY] ${JSON.stringify(logEntry)}`);
        
        // In production, you might want to send this to a security monitoring service
        if (process.env.NODE_ENV === 'production') {
            // Send to security monitoring service
        }
    }
};

// Security middleware factory
export const createSecurityMiddleware = () => {
    return {
        // Rate limiting middleware
        rateLimit: (options = {}) => {
            return rateLimit({
                windowMs: options.windowMs || securityConfig.rateLimit.windowMs,
                max: options.max || securityConfig.rateLimit.max,
                message: options.message || securityConfig.rateLimit.message,
                standardHeaders: true,
                legacyHeaders: false
            });
        },

        // Input validation middleware
        validateInput: (schema) => {
            return [
                ...schema,
                (req, res, next) => {
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
                }
            ];
        },

        // Sanitization middleware
        sanitizeInput: (req, res, next) => {
            if (req.body) {
                Object.keys(req.body).forEach(key => {
                    if (typeof req.body[key] === 'string') {
                        req.body[key] = securityUtils.sanitizeInput(req.body[key]);
                    }
                });
            }
            next();
        }
    };
};

// Export default configuration
export default securityConfig; 