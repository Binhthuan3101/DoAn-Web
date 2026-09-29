# NovaTech / TechShop – Website bán hàng công nghệ

Website thương mại điện tử (B2C) bán laptop, smartphone và phụ kiện.  
Đồ án Web – Trường Đại học Kinh doanh và Công nghệ Hà Nội.

**Sinh viên:** Đậu Bình Thuận – MSSV: 2924126390 – Lớp: Th29.02

---

## Công nghệ sử dụng

| Tầng     | Công nghệ                            |
| -------- | ------------------------------------ |
| Backend  | Node.js, Express.js                  |
| Database | Microsoft SQL Server (`mssql`)       |
| Frontend | HTML5, Tailwind CSS, JavaScript ES6+ |
| Bảo mật  | bcryptjs, JSON Web Token (JWT)       |
| Khác     | dotenv, cors, nodemon                |

---

## Chức năng chính

### Phía khách hàng

- Trang chủ, danh sách sản phẩm (tìm kiếm, lọc danh mục, sắp xếp)
- Xem chi tiết sản phẩm
- Giỏ hàng (localStorage), đặt hàng
- Đăng ký / Đăng nhập / Đăng xuất
- Xem đơn hàng của tôi (khi đã đăng nhập)
- Trang Giới thiệu, Liên hệ

### Phía Admin

- Đăng nhập với `Role = admin`
- **Thêm** sản phẩm
- **Sửa** sản phẩm
- **Xóa** sản phẩm (chặn xóa nếu sản phẩm đã có trong đơn hàng)
- Nút **Admin** chỉ hiện trên header khi tài khoản là admin

---

## Cấu trúc thư mục

```
tech-shop/
├── config/
│   └── db.js              # Kết nối SQL Server
├── controllers/
│   ├── productController.js
│   ├── orderController.js
│   ├── authController.js
│   └── categoryController.js
├── routes/
│   ├── productRoutes.js
│   ├── orderRoutes.js
│   ├── authRoutes.js
│   └── categoryRoutes.js
├── middleware/
│   └── auth.js            # Xác thực JWT (nếu có)
├── public/
│   ├── index.html         # Trang cửa hàng
│   ├── admin.html         # Trang quản trị (CRUD)
│   └── js/
│       └── app.js
├── server.js
├── .env                   # Không commit lên Git
├── .gitignore
├── package.json
└── README.md
```

---

## Cài đặt và chạy local

### 1. Yêu cầu

- Node.js (LTS 18+)
- Microsoft SQL Server + SSMS
- Git

### 2. Tạo database

Mở SSMS, chạy script SQL tạo database `TechShop` và các bảng:

- `Categories`, `Products`, `Users`, `Orders`, `OrderDetails`
- (Có thể dùng script seed dữ liệu mẫu 3 danh mục + 6 sản phẩm)

### 3. Clone và cài package

```bash
git clone https://github.com/TEN_GITHUB_CUA_BAN/tech-shop.git
cd tech-shop
npm install
```

### 4. Cấu hình file `.env`

Tạo file `.env` trong thư mục gốc:

```env
PORT=3000
DB_SERVER=BINHTHUAN310120\SQLEXPRESS06
DB_DATABASE=TechShop
DB_USER=sa
DB_PASSWORD=123456
DB_PORT=1433
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
JWT_SECRET=doi_thanh_chuoi_bi_mat_dai
JWT_EXPIRES_IN=7d
```

### 5. Chạy server

```bash
npm run dev
```

Hoặc production:

```bash
npm start
```

### 6. Mở trình duyệt

| Trang            | Địa chỉ                          |
| ---------------- | -------------------------------- |
| Cửa hàng         | http://localhost:3000            |
| **Admin (CRUD)** | http://localhost:3000/admin.html |

---

## Gán quyền Admin

Sau khi đăng ký tài khoản trên website, chạy trong SSMS:

```sql
USE TechShop;
UPDATE Users SET Role = N'admin' WHERE Email = N'binhthuan3101@gmail.com';
```

Đăng xuất → đăng nhập lại → header hiện nút **Admin**.

---

## API chính

| Phương thức | Endpoint             | Mô tả                                   |
| ----------- | -------------------- | --------------------------------------- |
| GET         | `/api/products`      | Danh sách SP (`?search=`, `?category=`) |
| GET         | `/api/products/:id`  | Chi tiết một SP                         |
| POST        | `/api/products`      | **Thêm** sản phẩm (Admin)               |
| PUT         | `/api/products/:id`  | **Sửa** sản phẩm (Admin)                |
| DELETE      | `/api/products/:id`  | **Xóa** sản phẩm (Admin)                |
| GET         | `/api/categories`    | Danh mục                                |
| POST        | `/api/auth/register` | Đăng ký                                 |
| POST        | `/api/auth/login`    | Đăng nhập                               |
| POST        | `/api/orders`        | Đặt hàng (transaction + trừ tồn kho)    |
| GET         | `/api/orders/my`     | Đơn hàng của tôi (cần JWT)              |

---

## Lưu ý quan trọng

- **Không** commit file `.env` lên GitHub (đã có trong `.gitignore`).
- Sản phẩm đã nằm trong đơn hàng **không xóa được** (bảo toàn lịch sử).
- Đặt hàng dùng **SQL Transaction**: đủ tồn kho mới commit, thiếu thì rollback.

---

## Tác giả

**Đậu Bình Thuận**  
MSSV: 2924126390  
Lớp: Th29.02  
Trường Đại học Kinh doanh và Công nghệ Hà Nội  
Năm: 2026
