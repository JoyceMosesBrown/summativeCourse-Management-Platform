# Course Management Platform

## Overview

The Course Management Platform is a comprehensive web-based system designed to streamline academic course planning and management. It supports administrators, facilitators, and students by offering tools for course allocation, tracking facilitator activities, and reflecting on student experiences. This platform aims to enhance educational workflows using efficient backend operations and internationalization support.

## Project Structure

| Folder/File            | Description                                     |
|------------------------|-------------------------------------------------|
| `/routes/`             | Express route files                             |
| `/models/`             | Sequelize models                                |
| `/middleware/`         | Authentication, validation, error handling      |
| `/services/`           | Business logic and queue processing             |
| `/public/`             | Static files for the reflection page            |
| `/utils/`              | Logger and helper utilities                     |
| `/tests/`              | Unit and integration tests                      |
| `app.js`               | Main entry point of the application             |

## Features

- **Course Allocation Module**
  - Assign courses to facilitators and manage workloads.
  
- **Facilitator Activity Tracker**
  - Monitor teaching activities and performance across allocated courses.
  
- **Student Reflection Page**
  - Collect feedback and reflections from students about their learning experiences.
  
- **Authentication**
  - Secure login with JWT authentication for different user roles.

- **Internationalization (i18n) and Localization (l10n)**
  - Support for multiple languages to enhance accessibilit .(English, French)

## Technologies Used

- **Backend:** Node.js, Express.js
- **Database:** MySQL (via Sequelize ORM)
- **Caching:** Redis
- **Authentication:** JSON Web Tokens (JWT)
- **Internationalization:** i18n

## Installation

1. **Clone the repository**
   git clone <your-repository-url>
cd course-management-platform

### 2. Install Dependencies
npm install

### Access Points
- **Swagger UI**: http://localhost:5000/api-docs
- **Student Reflection**: http://localhost:5000/reflection

## Key API Endpoints

### Authentication

| Method | Endpoint              | Description                         |
|--------|------------------------|-------------------------------------|
| POST   | `/api/auth/register`   | Register a new user                 |
| POST   | `/api/auth/login`      | User login                          |
| GET    | `/api/auth/me`         | Current user info (JWT required)    |

### Course Allocation

| Method | Endpoint                            | Description                   |
|--------|-------------------------------------|-------------------------------|
| GET    | `/api/course-allocations`           | Get all course allocations    |
| POST   | `/api/course-allocations`           | Create a course allocation    |
| PUT    | `/api/course-allocations/:id`       | Update a course allocation    |
| DELETE | `/api/course-allocations/:id`       | Delete a course allocation    |

### Activity Tracker

| Method | Endpoint                              | Description                    |
|--------|----------------------------------------|--------------------------------|
| GET    | `/api/activity-tracker`               | Get activity tracker logs      |
| POST   | `/api/activity-tracker`               | Create a new activity log      |
| PUT    | `/api/activity-tracker/:id`           | Update an activity log         |
| DELETE | `/api/activity-tracker/:id`           | Delete an activity log         |

### Users

| Method | Endpoint                  | Description                         |
|--------|---------------------------|-------------------------------------|
| GET    | `/api/users`              | Get all users                       |
| GET    | `/api/users/:id`          | Get a specific user by ID           |
| PATCH  | `/api/users/:id/activate` | Activate or deactivate a user       |

### Notifications

| Method | Endpoint                          | Description                     |
|--------|-----------------------------------|---------------------------------|
| GET    | `/api/notifications`              | Get all notifications           |
| PATCH  | `/api/notifications/:id/read`     | Mark a notification as read     |
