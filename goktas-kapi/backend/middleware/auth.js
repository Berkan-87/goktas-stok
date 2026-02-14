const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'goktas-kapi-secret');
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new Error();
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Lütfen giriş yapın' });
  }
};

const checkPermission = (allowedRoles, allowedStations = []) => {
  return (req, res, next) => {
    if (req.user.role === 'admin') {
      return next();
    }

    if (allowedRoles.includes(req.user.role)) {
      if (req.user.role === 'istasyon' && allowedStations.length > 0) {
        if (allowedStations.includes(req.user.station)) {
          return next();
        }
      } else {
        return next();
      }
    }

    res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
  };
};

module.exports = { authMiddleware, checkPermission };