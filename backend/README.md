# Northstar Blog Console

Laravel 13 və vanilla JavaScript ilə hazırlanmış blog idarəetmə panelidir.

## İmkanlar

- Sanctum token autentifikasiyası
- İstifadəçinin özü üçün təhlükəsiz qeydiyyat və giriş
- Admin, redaktor və müəllif rolları
- İstifadəçi, kateqoriya və yazı CRUD əməliyyatları
- Müəlliflərin yalnız öz yazılarını idarə etməsi
- Yazı axtarışı, kateqoriya filtri və səhifələmə
- Qaralama/yayımlanmış statusu və avtomatik unikal slug

## Tələblər

- PHP 8.4.1 və ya daha yeni
- Composer
- Node.js və npm (yalnız Vite asset-ləri üçün)

## Quraşdırma

```bash
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```



Bu hesab yalnız lokal inkişaf üçündür; real mühitdə şifrəni dərhal dəyişin.

## Test və formatlama

```bash
php artisan test
vendor/bin/pint --format agent
```
