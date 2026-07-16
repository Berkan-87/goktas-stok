import axios from 'axios';

const instance = axios.create({
  // ✅ DOĞRU VE GÜNCEL BACKEND ADRESİ
  baseURL: 'https://goktas-stok-2.onrender.com/api',
  
  // ❌ ESKİ VE YANLIŞ ADRES (KALDIRILDI)
  // baseURL: 'https://goktas-stok-backend.vercel.app/api',
  
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Token ekleme
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Hata yönetimi
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 Unauthorized hatası alınırsa token'ı temizle ve login'e yönlendir
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default instance;