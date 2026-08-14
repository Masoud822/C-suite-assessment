require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');

const authRoutes = require('./routes/auth');
const assessmentRoutes = require('./routes/assessment');
const adminRoutes = require('./routes/admin');
const questionRoutes = require('./routes/questions');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// --- Performance: gzip/brotli compression for all responses ---
app.use(compression());

// --- Security Middleware ---

// Helmet: Sets secure HTTP headers (XSS, HSTS, noSniff, clickjack, etc.)
app.use(helmet({
  contentSecurityPolicy: isProduction ? undefined : false,
}));

// Rate Limiting: Prevent brute-force and DDoS
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use(generalLimiter);

// Stricter rate limit on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please wait 15 minutes.' }
});

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: isProduction
    ? (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    : true,
  credentials: true,
}));

// Body parser with size limit
app.use(express.json({ limit: '10kb' }));

// --- API Routes ---
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/questions', questionRoutes);

// --- Serve Frontend in Production ---
if (isProduction) {
  const clientDistPath = path.join(__dirname, '..', 'dist');
  
  // Cache static assets aggressively (JS/CSS have content hashes)
  app.use(express.static(clientDistPath, {
    maxAge: '1y',
    immutable: true,
  }));

  // SPA fallback: serve index.html for any non-API route (no cache)
  app.get('*', (req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// --- Error Handling ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  const message = isProduction ? 'Internal server error' : err.message;
  res.status(500).json({ error: message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
});
