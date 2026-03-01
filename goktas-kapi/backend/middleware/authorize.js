module.exports = {
  isAdmin: (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Bu işlem için admin yetkisi gerekli' });
    }
    next();
  },

  canModifyStation: (stationName) => {
    return (req, res, next) => {
      if (req.user.role === 'admin' || 
          (req.user.role === 'station_user' && req.user.station === stationName)) {
        next();
      } else {
        res.status(403).json({ error: 'Bu istasyonda işlem yapma yetkiniz yok' });
      }
    };
  },

  canModifyBranch: (branchName) => {
    return (req, res, next) => {
      if (req.user.role === 'admin' || 
          (req.user.role === 'inventory_user' && req.user.branch === branchName)) {
        next();
      } else {
        res.status(403).json({ error: 'Bu şubede işlem yapma yetkiniz yok' });
      }
    };
  },

  isViewerOrAbove: (req, res, next) => {
    if (req.user.role === 'viewer' || req.user.role === 'station_user' || 
        req.user.role === 'inventory_user' || req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Görüntüleme yetkiniz yok' });
    }
  }
};