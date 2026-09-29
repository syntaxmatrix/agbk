import geoip from 'geoip-lite';
import { APIError } from "../utils/APIError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const restrictToIndia = asyncHandler(async (req, res, next) => {
  // Only apply to the console subdomain or admin routes
  if (req.hostname === 'console.syntx.in' || req.originalUrl.startsWith('/api/console')) {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket.remoteAddress) || '';
    
    const geo = geoip.lookup(ip.trim());
    
    // Allow local development IPs (127.0.0.1, ::1)
    if (ip.includes('127.0.0.1') || ip === '::1') {
      return next();
    }

    if (!geo || geo.country !== 'IN') {
      return res.status(403).json({ error: 'Access denied: Region restricted.' });
    }
  }
  next();
});