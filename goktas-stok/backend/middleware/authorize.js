module.exports = {
  // Admin kontrolü
  admin: (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Lütfen giriş yapın' });
    }
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu işlem için admin yetkisi gerekli' });
    }
    next();
  },

  // Şube yöneticisi veya admin kontrolü
  branchManager: (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Lütfen giriş yapın' });
    }
    if (req.user.role !== 'admin' && req.user.role !== 'branch_manager') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }
    next();
  },

  // Üretim rolü kontrolü
  productionRole: (requiredRole) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ message: 'Lütfen giriş yapın' });
      }
      // Admin her şeyi yapabilir
      if (req.user.role === 'admin') {
        return next();
      }
      // Production manager kontrolü
      if (req.user.role === 'production_manager' && req.user.productionRole === requiredRole) {
        return next();
      }
      return res.status(403).json({ 
        message: `Bu işlem için ${requiredRole} yetkisi gerekli` 
      });
    };
  },

  // Şube bazlı değişiklik yetkisi
  canModifyBranch: (branch) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ message: 'Lütfen giriş yapın' });
      }
      if (req.user.role === 'admin') {
        return next();
      }
      if (req.user.role === 'branch_manager' && req.user.branch === branch) {
        return next();
      }
      return res.status(403).json({ message: 'Bu şubede değişiklik yapma yetkiniz yok' });
    };
  }
};