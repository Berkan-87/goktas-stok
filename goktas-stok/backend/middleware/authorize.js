// backend/middleware/authorize.js
const User = require('../models/User');

/**
 * ✅ Kullanıcının belirli bir role sahip olup olmadığını kontrol eder
 * @param {string|string[]} roles - İzin verilen roller
 * @returns {Function} Middleware fonksiyonu
 */
const authorize = (roles) => {
  return async (req, res, next) => {
    try {
      // Kullanıcı bilgilerini al (auth middleware'den gelir)
      if (!req.user) {
        return res.status(401).json({ message: 'Oturum açmamışsınız' });
      }

      // Admin her zaman yetkilidir
      if (req.user.role === 'admin') {
        return next();
      }

      // Roller kontrolü
      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      if (allowedRoles.includes(req.user.role)) {
        return next();
      }

      return res.status(403).json({ 
        message: 'Bu işlem için yetkiniz yok. Gerekli roller: ' + allowedRoles.join(', ')
      });
    } catch (error) {
      console.error('❌ Yetki kontrol hatası:', error);
      return res.status(500).json({ message: 'Yetki kontrolü sırasında bir hata oluştu' });
    }
  };
};

/**
 * ✅ Kullanıcının belirli bir şubeye erişim yetkisi olduğunu kontrol eder
 * @param {string} branch - Kontrol edilecek şube
 * @returns {Function} Middleware fonksiyonu
 */
const authorizeBranch = (branch) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Oturum açmamışsınız' });
      }

      // Admin her şubeye erişebilir
      if (req.user.role === 'admin') {
        return next();
      }

      // Kullanıcının şube yetkisi
      if (req.user.branch === branch) {
        return next();
      }

      return res.status(403).json({ 
        message: `Bu şubeye (${branch}) erişim yetkiniz yok` 
      });
    } catch (error) {
      console.error('❌ Şube yetki kontrol hatası:', error);
      return res.status(500).json({ message: 'Yetki kontrolü sırasında bir hata oluştu' });
    }
  };
};

/**
 * ✅ Kullanıcının üretim yetkisi olduğunu kontrol eder
 * @param {string|string[]} productionRoles - İzin verilen üretim rolleri
 * @returns {Function} Middleware fonksiyonu
 */
const authorizeProduction = (productionRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Oturum açmamışsınız' });
      }

      // Admin her zaman yetkilidir
      if (req.user.role === 'admin') {
        return next();
      }

      // Production manager değilse yetkisiz
      if (req.user.role !== 'production_manager') {
        return res.status(403).json({ 
          message: 'Bu işlem için üretim yetkisi gereklidir' 
        });
      }

      // Production role kontrolü
      const allowedRoles = Array.isArray(productionRoles) ? productionRoles : [productionRoles];
      if (allowedRoles.includes(req.user.productionRole)) {
        return next();
      }

      return res.status(403).json({ 
        message: `Bu işlem için gerekli üretim yetkisi: ${allowedRoles.join(', ')}` 
      });
    } catch (error) {
      console.error('❌ Üretim yetki kontrol hatası:', error);
      return res.status(500).json({ message: 'Yetki kontrolü sırasında bir hata oluştu' });
    }
  };
};

/**
 * ✅ Kullanıcının malzeme deposuna erişim yetkisi olduğunu kontrol eder
 * @returns {Function} Middleware fonksiyonu
 */
const authorizeMaterialDepo = () => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Oturum açmamışsınız' });
      }

      // Admin her zaman yetkilidir
      if (req.user.role === 'admin') {
        return next();
      }

      // Malzeme depo yetkisi kontrolü
      if (req.user.materialDepoAccess === true) {
        return next();
      }

      return res.status(403).json({ 
        message: 'Malzeme deposuna erişim yetkiniz yok' 
      });
    } catch (error) {
      console.error('❌ Malzeme depo yetki kontrol hatası:', error);
      return res.status(500).json({ message: 'Yetki kontrolü sırasında bir hata oluştu' });
    }
  };
};

/**
 * ✅ Kullanıcının branch_manager veya admin olduğunu kontrol eder
 * @param {string} branch - Kontrol edilecek şube
 * @returns {Function} Middleware fonksiyonu
 */
const canModifyBranch = (branch) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Oturum açmamışsınız' });
      }

      // Admin her zaman yetkilidir
      if (req.user.role === 'admin') {
        return next();
      }

      // Branch manager kontrolü
      if (req.user.role === 'branch_manager' && req.user.branch === branch) {
        return next();
      }

      return res.status(403).json({ 
        message: 'Bu şubede değişiklik yapma yetkiniz yok' 
      });
    } catch (error) {
      console.error('❌ Şube değişiklik yetki kontrol hatası:', error);
      return res.status(500).json({ message: 'Yetki kontrolü sırasında bir hata oluştu' });
    }
  };
};

module.exports = {
  authorize,
  authorizeBranch,
  authorizeProduction,
  authorizeMaterialDepo,
  canModifyBranch
};