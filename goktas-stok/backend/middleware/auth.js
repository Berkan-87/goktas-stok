const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Ana auth middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user || !user.isActive) {
      throw new Error();
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Lütfen giriş yapın' });
  }
};

// Admin kontrolü (auth'tan sonra çağrılır)
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin yetkisi gerekli' });
  }
};

// ✅ SADECE auth fonksiyonunu default export et
module.exports = auth;
// admin'i ayrıca export et (isteğe bağlı)
module.exports.admin = admin;