# T2K Coffee Shop Management System

A web-based coffee shop management system built with **Spring Boot**, **Spring Security**, **Spring Data JPA**, **MySQL**, and a separate **HTML/CSS/JavaScript** frontend.

## Overview

This project supports core coffee shop operations for multiple roles:

- **Customer**: browse products, place orders, earn reward points
- **Staff**: manage in-store orders, tables, and payments
- **Admin**: manage products, categories, promotions, staff accounts, and dashboard analytics

The backend exposes REST APIs for authentication, account management, products, orders, tables, payments, promotions, and dashboard reporting.

## Tech Stack

### Backend
- Java 17
- Spring Boot 3.1
- Spring Web
- Spring Data JPA
- Spring Security
- JWT authentication
- MySQL
- Lombok
- Maven

### Frontend
- HTML5
- CSS3
- JavaScript

## Main Features

### Authentication & Authorization
- JWT-based login
- Role-based access control for:
  - `CUSTOMER`
  - `STAFF`
  - `ADMIN`

### Account Management
- Register and login accounts
- Update profile information
- Upload avatar
- Reward points management

### Product Management
- CRUD products
- Search products
- Filter products by category
- Update product availability
- Upload product images

### Category & Variant Management
- Manage product categories
- Manage product variants

### Order Management
- Create orders
- Add order details
- Assign tables to orders
- Update order status
- View order history
- Reward point accumulation based on order value

### Table Management
- Track table usage status
- Update table states during order flow

### Payment Management
- Record payment method and payment status
- Support daily payment statistics

### Promotion Management
- Manage promotional campaigns and discount logic

### Dashboard & Reporting
- Daily revenue summary
- Total orders
- Product statistics
- Best-selling products
- Busy time analysis
- Revenue charts by week, month, and year

## Project Structure

```text
DOAN_COSO/
├── coffee-shop-system/
│   ├── backend/
│   │   ├── pom.xml
│   │   ├── application.properties
│   │   └── src/main/java/com/t2kcoffee/
│   │       ├── config/
│   │       ├── controller/
│   │       ├── dto/
│   │       ├── entity/
│   │       ├── repository/
│   │       ├── security/
│   │       ├── service/
│   │       └── CoffeeT2KApplication.java
│   └── frontend/
│       ├── admin/
│       ├── auth/
│       ├── customer/
│       ├── staff/
│       ├── assets/
│       └── components/
└── README.md
```

## API Modules

Main backend modules include:

- `AccountController`
- `ProductController`
- `CategoryController`
- `CafeOrderController`
- `CafeTableController`
- `PaymentController`
- `PromotionController`
- `DashboardController`
- `SystemInfoController`
- `ActivityController`
- `ProductVariantController`

## Security Rules

The backend is configured with stateless JWT authentication and route-based authorization:

- Public access for selected product, category, promotion, table, account, and order endpoints
- Staff/Admin access for internal management APIs
- Admin-only access for dashboard and system endpoints

## Configuration

Example `application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/coffee_t2k
spring.datasource.username=root
spring.datasource.password=
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

spring.jpa.hibernate.ddl-auto=none
spring.jpa.show-sql=true

server.port=8081

app.upload.dir=./uploads/images
```

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/ThangphamDev/DOAN_COSO.git
cd DOAN_COSO
git checkout test12
```

### 2. Configure database
Create a MySQL database named:

```sql
coffee_t2k
```

Then update your database username and password in:

```text
coffee-shop-system/backend/application.properties
```

### 3. Run the backend
```bash
cd coffee-shop-system/backend
mvn spring-boot:run
```

Backend runs at:

```text
http://localhost:8081
```

### 4. Run the frontend
Open the frontend files with Live Server or another local static server.

Recommended entry file:

```text
coffee-shop-system/frontend/index.html
```

## Example Endpoints

### Authentication
- `POST /api/accounts/login`
- `POST /api/accounts/register`

### Products
- `GET /api/products`
- `GET /api/products/{id}`
- `GET /api/products/search?keyword=...`
- `POST /api/products`
- `POST /api/products/with-image`

### Orders
- `POST /api/orders`
- `PUT /api/orders/{id}`
- `GET /api/orders/...`

### Dashboard
- `GET /api/dashboard/summary`
- `GET /api/dashboard/revenue-chart?period=week`
- `GET /api/dashboard/top-products`

## Development Notes

- Product and avatar images are stored in local upload folders
- CORS is enabled for local frontend integration
- Some frontend and backend modules are still under active development and may need cleanup or further refactoring
- This branch is suitable for demonstrating backend architecture, API design, and business logic implementation in an academic project

## Future Improvements

- Add Swagger/OpenAPI documentation
- Add DTO validation with Bean Validation
- Standardize API response format
- Improve exception handling with global handlers
- Add unit/integration tests
- Add Docker setup for local deployment
- Seed database scripts and environment templates

## Author

**Pham Xuan Thang**  
GitHub: `ThangphamDev`
