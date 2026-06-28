const globalLimitMap = new Map();
const authLimitMap = new Map();

const ONE_MINUTE_MS = 60000;
const GLOBAL_LIMIT = 100;
const AUTH_LIMIT = 5;

function getClientIp(req) {
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (ip && ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }
  return ip;
}

function checkLimit(ip, limitMap, limit, now) {
  if (!limitMap.has(ip)) {
    limitMap.set(ip, []);
  }
  
  const timestamps = limitMap.get(ip);
  // Filter out expired timestamps older than 1 minute
  const validTimestamps = timestamps.filter(time => (now - time) <= ONE_MINUTE_MS);
  
  if (validTimestamps.length >= limit) {
    limitMap.set(ip, validTimestamps);
    return true; // limit exceeded
  }
  
  validTimestamps.push(now);
  limitMap.set(ip, validTimestamps);
  return false;
}

const rateLimiter = (req, res, next) => {
  const path = req.path;
  const ip = getClientIp(req);
  const now = Date.now();

  // Rate limit only API endpoints
  if (path.startsWith('/api/')) {
    // 1. Auth Rate Limiting
    if (path.startsWith('/api/auth/login') || path.startsWith('/api/auth/register') || path.startsWith('/api/auth/forgot-password')) {
      if (checkLimit(ip, authLimitMap, AUTH_LIMIT, now)) {
        return res.status(429).json({ error: 'Too many authentication attempts. Please try again after a minute.' });
      }
    }

    // 2. Global API Throttling
    if (checkLimit(ip, globalLimitMap, GLOBAL_LIMIT, now)) {
      return res.status(429).json({ error: 'Too many requests. Throttling active. Please try again later.' });
    }
  }

  next();
};

module.exports = rateLimiter;
