# Course Management Platform

A comprehensive backend system for academic institutions to support faculty operations, monitor student progress, and enhance academic coordination. Built with Node.js, Express, MySQL, and Redis.

## 🎯 Features

### Module 1: Course Assignment System
- **Role-based CRUD operations** for managers and facilitators
- **Course assignment management** with module, cohort, class, and trimester tracking
- **Advanced filtering** by trimester, cohort, facilitator, and delivery mode
- **Secure access control** ensuring proper permissions

### Module 2: Facilitator Activity Tracker (FAT)
- **Weekly activity logging** for facilitators
- **Attendance tracking** with boolean arrays
- **Grading status management** (formative, summative, moderation)
- **Redis-backed notification system** with automated reminders
- **Manager alerts** for compliance monitoring
- **Background job processing** for scalable notifications

### Module 3: Student Reflection Page (i18n/l10n)
- **Multilingual support** (English, French, Spanish)
- **Dynamic language switching** with localStorage persistence
- **Responsive design** with modern CSS
- **Auto-save functionality** to prevent data loss
- **Accessibility features** with ARIA support

## 🛠 Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL with Sequelize ORM
- **Caching/Queues**: Redis with Bull
- **Authentication**: JWT with bcrypt
- **Testing**: Jest with Supertest
- **Documentation**: Swagger/OpenAPI 3.0
- **Logging**: Winston
- **Validation**: Joi, express-validator

## 📋 Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- Redis (v6.0 or higher)
- npm or yarn

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd course-management-platform
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup

#### Option A: Docker (Recommended)
```bash
# Start MySQL
docker run --name course-management-mysql \
  -e MYSQL_ROOT_PASSWORD=password123 \
  -e MYSQL_DATABASE=course_management \
  -p 3306:3306 \
  -d mysql:8.0

# Start Redis
docker run --name course-management-redis \
  -p 6379:6379 \
  -d redis:alpine
```

#### Option B: Native Installation

**Windows:**
1. Download MySQL Installer from [mysql.com](https://dev.mysql.com/downloads/installer/)
2. Choose "Developer Default" setup
3. Set root password: `password123`
4. Download Redis from [redis.io](https://redis.io/download) or use WSL

**macOS:**
```bash
# Install via Homebrew
brew install mysql redis

# Start services
brew services start mysql
brew services start redis

# Secure MySQL installation
mysql_secure_installation
```

**Linux (Ubuntu/Debian):**
```bash
# Update package list
sudo apt update

# Install MySQL and Redis
sudo apt install mysql-server redis-server

# Start services
sudo systemctl start mysql redis-server
sudo systemctl enable mysql redis-server

# Secure MySQL installation
sudo mysql_secure_installation
```

### 4. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
nano .env
```

**Required Environment Variables:**
```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=course_management
DB_USER=root
DB_PASS=your_mysql_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-make-it-long-and-random
JWT_EXPIRES_IN=24h

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Notification Settings
NOTIFICATION_DEADLINE_HOURS=168
MANAGER_ALERT_EMAIL=manager@institution.edu
```

### 5. Database Initialization
```bash
# Create database manually (if not using Docker)
mysql -u root -p
CREATE DATABASE course_management;
EXIT;

# Seed database with demo data
npm run seed
```

### 6. Start the Application
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## 🔐 Demo Accounts

The seeding process creates the following demo accounts:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Manager | `manager@university.edu` | `Manager123!` | Full system access |
| Facilitator | `facilitator1@university.edu` | `Facilitator123!` | Web Development specialist |
| Facilitator | `facilitator2@university.edu` | `Facilitator123!` | Database Systems specialist |
| Student | `student@university.edu` | `Student123!` | Basic student access |

## 📚 API Documentation

### Access Points
- **Swagger UI**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health
- **Student Reflection**: http://localhost:3000/reflection

### Authentication
All API endpoints (except auth and public routes) require JWT authentication:

```bash
# Login to get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@university.edu","password":"Manager123!"}'

# Use token in subsequent requests
curl -X GET http://localhost:3000/api/course-allocations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

#### Course Assignments (Manager/Facilitator)
- `GET /api/course-allocations` - List course allocations
- `POST /api/course-allocations` - Create allocation (Manager only)
- `GET /api/course-allocations/:id` - Get specific allocation
- `PUT /api/course-allocations/:id` - Update allocation (Manager only)
- `DELETE /api/course-allocations/:id` - Delete allocation (Manager only)

#### Activity Tracker (Facilitator/Manager)
- `GET /api/activity-tracker` - List activity logs
- `POST /api/activity-tracker` - Create activity log (Facilitator only)
- `GET /api/activity-tracker/:id` - Get specific log
- `PUT /api/activity-tracker/:id` - Update activity log
- `DELETE /api/activity-tracker/:id` - Delete log (Manager only)

#### User Management (Manager)
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user details
- `PATCH /api/users/:id/activate` - Activate/deactivate user

#### Notifications (Manager)
- `GET /api/notifications` - Get manager notifications
- `PATCH /api/notifications/:id/read` - Mark notification as read

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

### Test Structure
```
tests/
├── models/
│   ├── User.test.js
│   └── CourseOffering.test.js
└── services/
    └── notificationService.test.js
```

### Test Coverage
- **User Model**: Authentication, validation, password hashing
- **CourseOffering Model**: CRUD operations, relationships, constraints
- **NotificationService**: Queue management, Redis operations, notification processing

## 🏗 Database Schema

### Core Models
- **User**: Base user authentication and profile
- **Manager**: Manager-specific profile and permissions
- **Facilitator**: Facilitator profile with specializations
- **Student**: Student profile with cohort assignment
- **Module**: Course modules with prerequisites
- **Cohort**: Student groupings by program and intake
- **Class**: Academic periods (e.g., 2024S, 2025J)
- **Mode**: Delivery modes (online, in-person, hybrid)
- **CourseOffering**: Course assignments linking all entities
- **ActivityTracker**: Weekly activity logs for facilitators

### Key Relationships
- User → Manager/Facilitator/Student (1:1)
- CourseOffering → Module/Facilitator/Cohort/Class/Mode (N:1)
- ActivityTracker → CourseOffering/Facilitator (N:1)
- Student → Cohort (N:1)

## 🔄 Background Jobs & Notifications

### Redis Queue System
The application uses Bull queues for background job processing:

- **Notification Queue**: Processes activity log submissions and alerts
- **Reminder Queue**: Checks for missing submissions and sends reminders
- **Weekly Scheduling**: Automated reminder checks via cron jobs

### Notification Types
1. **Activity Log Submitted**: Notifies managers when facilitators submit logs
2. **Missing Submission Reminder**: Alerts for overdue activity logs
3. **Late Submission Alert**: Flags submissions past deadline

## 🌍 Internationalization (i18n)

### Student Reflection Page
The reflection page demonstrates i18n implementation:

- **Languages**: English, French, Spanish
- **Dynamic Switching**: Real-time language changes
- **Persistence**: Language preference stored in localStorage
- **Browser Detection**: Automatic language detection
- **Accessibility**: Screen reader announcements for language changes

### Implementation Details
- Translation dictionary in `public/translations.js`
- Dynamic DOM content injection
- Keyboard shortcuts (Ctrl+1/2/3) for language switching
- Form data persistence across language changes

## 📁 Project Structure

```
course-management-platform/
├── src/
│   ├── config/          # Database and Redis configuration
│   ├── middleware/      # Authentication, validation, error handling
│   ├── models/          # Sequelize models and relationships
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic and external services
│   ├── utils/           # Utility functions and helpers
│   ├── seeders/         # Database seeding scripts
│   └── scripts/         # Utility scripts
├── public/              # Static files for reflection page
├── tests/               # Unit and integration tests
├── logs/                # Application logs
└── package.json         # Dependencies and scripts
```

## 🔒 Security Features

- **JWT Authentication** with secure token generation
- **Password Hashing** using bcrypt with salt rounds
- **Input Validation** with Joi and express-validator
- **SQL Injection Prevention** via Sequelize ORM
- **Rate Limiting** to prevent abuse
- **CORS Configuration** for cross-origin requests
- **Security Headers** via Helmet middleware
- **Role-based Access Control** for all endpoints

## 🚀 Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production database credentials
3. Set secure JWT secret (minimum 32 characters)
4. Configure Redis connection for production
5. Set up proper logging levels

### Production Considerations
- Use environment variables for all sensitive data
- Implement proper SSL/TLS certific