# Göktaş Kapı Üretim Takip ve Stok Yönetim Sistemi

Göktaş Kapı fabrikası için geliştirilmiş, üretim sürecini takip eden ve çoklu
şube stok yönetimini sağlayan kapsamlı bir web uygulaması.

## 🚀 Özellikler

### Üretim Takip Sistemi

- Siparişlerin istasyon bazlı takibi (Planlama → CNC → Tutkal → Vakum → Pres →
  Kenarbant → Kilit → Lake → Paketleme)
- Her istasyon için özel yetkilendirilmiş kullanıcılar
- Sipariş geçmişi ve istasyon geçiş kayıtları
- Planlama bölümünde sipariş ekleme/çıkarma/düzenleme

### Stok Yönetimi

- 5 farklı şube için stok takibi (Fabrika, Karabağlar, Edremit, Karşıyaka,
  Manisa)
- Her şube için özel stok yetkilisi
- Stok ekleme/çıkarma işlemleri
- Minimum/maksimum stok uyarıları
- Yeni stok modeli ekleme/çıkarma

### Kullanıcı Yetkilendirme

- **Admin:** Tüm işlemleri yapabilir, kullanıcı ekleyip silebilir
- **İstasyon Yetkilisi:** Sadece kendi istasyonunda işlem yapabilir
- **Stok Yetkilisi:** Sadece kendi şubesinde stok işlemi yapabilir
- **İzleyici:** Her şeyi görebilir ama işlem yapamaz

## 🛠️ Teknolojiler

### Backend

- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- Bcrypt

### Frontend

- React.js
- Redux Toolkit
- Material-UI (MUI)
- Axios
- React Router DOM

## 📦 Kurulum

### Gereksinimler

- Node.js (v14 veya üzeri)
- MongoDB
- Git

### Adımlar

1. **Repository'yi klonlayın**

```bash
git clone https://github.com/KULLANICI_ADINIZ/goktas-kapi.git
cd goktas-kapi
```
