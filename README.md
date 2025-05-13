# Udhaar Management System

A Django-based supermarket management system with role-based access control, designed to handle product inventory, orders, and customer credit (udhaar) management.

## Features

### 1. User Authentication & Authorization
- Role-based access control with 5 distinct user types
- Secure login system with email and password
- Permission-based feature access
- Custom user model with udhaar tracking

### 2. Dashboard
- Real-time statistics and metrics
- Total revenue overview
- Udhaar amount tracking
- User statistics
- Product inventory summary
- Recent activity monitoring
- Due payment tracking with dates

### 3. Product Management
- Complete product catalog
- Stock level tracking
- Price management
- Product search functionality
- Stock update history
- Add/Edit/Delete products (restricted by role)

### 4. Order Management
- Create new orders
- Track order status (Paid/Unpaid)
- Order history
- Order details with items
- Order search functionality
- Payment status tracking

### 5. User Management
- Customer account management
- Udhaar balance tracking
- Due date management
- Payment history
- User search functionality
- Role assignment

### 6. Security Features
- Permission-based access control
- CSRF protection
- Secure password handling
- Role-based UI adaptation
- Permission denied handling

## User Roles & Access Levels

### 1. Admin (username: a, password: 123)
- Full system access
- User role management
- System configuration
- All CRUD operations
- Access to all features
- Can create new users
- Can assign roles

### 2. Accountant (username: aa, password: 123)
- View customer accounts
- Update udhaar amounts
- View all orders
- Update order status
- View product catalog
- Create orders
- Add order items
- Cannot modify product catalog
- Cannot delete records

### 3. Entry Operator (username: e, password: 123)
- Create new orders
- Update order status
- View product catalog
- View customer details
- Basic order management
- Cannot delete records
- Cannot manage products
- Cannot manage user accounts

### 4. Order Manager (username: o, password: 123)
- Complete order management
- Stock level updates
- Customer udhaar management
- Full order history access
- Cannot manage product catalog
- Activity logging
- Payment processing

### 5. Product Manager (username: p, password: 123)
- Complete product management
- Inventory control
- Add/Edit/Delete products
- View orders (read-only)
- View customers (read-only)
- Stock level management
- Product analytics

## Technical Features

### Frontend
- Responsive design
- Modern UI/UX
- Real-time search functionality
- Dynamic content loading
- Modal forms for actions
- Permission-based UI elements
- Error handling and feedback

### Backend
- Django 5.1.7
- Custom User Model
- Role-based permissions
- RESTful API endpoints
- Secure authentication
- Database migrations
- Error logging

## Database Schema

### Models
1. User (Custom User Model)
   - Username, Email, Password
   - Role (admin/user)
   - Udhaar amount
   - Due date
   - Created/Updated timestamps

2. Product
   - Name
   - Price
   - Stock
   - Created/Updated timestamps

3. Order
   - User (ForeignKey)
   - Total amount
   - Status (Paid/Unpaid)
   - Order date
   - Created timestamp

4. OrderItem
   - Order (ForeignKey)
   - Product (ForeignKey)
   - Quantity
   - Price
   - Created timestamp

## Suggested Improvements

1. Dashboard Enhancements
   - Add graphical statistics
   - Daily/weekly/monthly reports
   - Export functionality for reports
   - Real-time notifications

2. Product Management
   - Barcode scanning support
   - Low stock alerts
   - Product categories
   - Bulk import/export
   - Price history tracking

3. Order Management
   - Print invoices
   - Email notifications
   - Order status workflow
   - Bulk order processing
   - Return handling

4. User Management
   - SMS notifications for due payments
   - Payment reminders
   - Credit limit management
   - Customer loyalty system

5. Security Enhancements
   - Two-factor authentication
   - Activity logging
   - IP-based access control
   - Session management
   - Automated backups

## Installation & Setup

1. Clone the repository
2. Create virtual environment
3. Install dependencies: `pip install -r requirements.txt`
4. Run migrations: `python manage.py migrate`
5. Create superuser: `python manage.py createsuperuser`
6. Run server: `python manage.py runserver`

## Default User Credentials

```
Admin:
- Username: a
- Password: 123
- Role: Superuser/Admin

Accountant:
- Username: aa
- Password: 123
- Role: Financial Management

Entry Operator:
- Username: e
- Password: 123
- Role: Data Entry

Order Manager:
- Username: o
- Password: 123
- Role: Order Processing

Product Manager:
- Username: p
- Password: 123
- Role: Inventory Management
```

## Security Notes

1. Change default passwords in production
2. Enable HTTPS in production
3. Regular security audits
4. Monitor user activities
5. Regular backups
6. Update dependencies

## Support

For support, please contact the system administrator or refer to the documentation.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 