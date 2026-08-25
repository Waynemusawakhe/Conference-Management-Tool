# Conference Management Tool (CMT) — Backend

Backend API for the **Conference Management Tool (CMT)**, built with Laravel.

The backend provides RESTful API endpoints for authentication, user management, conferences, submissions, reviews, decisions, programme management, and reporting.

---

## Tech Stack

* **PHP:** 8.2+
* **Laravel:** 12.66.0
* **Database:** PostgreSQL
* **API Authentication:** Laravel Sanctum
* **API Documentation:** Swagger / OpenAPI (L5-Swagger)
* **Dependency Management:** Composer
* **Version Control:** Git / GitHub
* **API Testing:** Postman

---

# Requirements

Before setting up the project, make sure you have installed:

* PHP 8.2 or higher
* Composer
* PostgreSQL
* Git
* Postman

Check your installed versions:

```bash
php -v
composer -V
```

---

# Project Structure

The backend follows a **modular, feature-driven architecture**.

```text
app/
└── Modules/
    ├── Account/
    │   ├── Actions/
    │   ├── Controllers/
    │   └── Requests/
    │
    ├── Users/
    │   ├── Actions/
    │   ├── Controllers/
    │   ├── Models/
    │   ├── Policies/
    │   └── Requests/
    │
    ├── Conferences/
    ├── Submissions/
    ├── Reviews/
    ├── Decisions/
    └── Reporting/
```

### Backend Modules

| Module      | Responsibility                                                      |
| ----------- | ------------------------------------------------------------------- |
| Account     | Authentication, registration, login, logout, and email verification |
| Users       | User management and permissions                                     |
| Conferences | Conference creation and management                                  |
| Submissions | Paper/submission management                                         |
| Reviews     | Reviewing and reviewer assignments                                  |
| Decisions   | Submission decisions and programme management                       |
| Reporting   | Reports and system statistics                                       |

---

# Installation

## 1. Clone the Repository

```bash
git clone <REPOSITORY_URL>
```

Move into the backend directory:

```bash
cd Conference-Management-Tool/backend
```

## 2. Install Dependencies

```bash
composer install
```

## 3. Create the Environment File

### Windows

```cmd
copy .env.example .env
```

### Linux/macOS

```bash
cp .env.example .env
```

## 4. Generate the Application Key

```bash
php artisan key:generate
```

## 5. Configure the Database

Update your `.env` file with the PostgreSQL credentials supplied by the database team.

Example:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=conference_management
DB_USERNAME=postgres
DB_PASSWORD=your_password
```

> **Important:** Never commit `.env` to GitHub.

## 6. Run Database Migrations

```bash
php artisan migrate
```

If seeders are available:

```bash
php artisan db:seed
```

## 7. Start the Development Server

```bash
php artisan serve
```

The backend will be available at:

```text
http://127.0.0.1:8000
```

---

# API

All application API endpoints use the `/api/v1` prefix.

## Authentication & Account Management

The Account module provides the authentication and user-account functionality required by the CMT backend.

Implemented functionality includes:

* User registration
* User login
* User logout
* Authenticated-user information
* Email verification
* Request validation
* Role-based account handling
* Laravel Sanctum authentication
* Swagger/OpenAPI documentation

### Authentication Flow

1. A user registers using the registration endpoint.
2. The user's account is created and an email verification process is initiated.
3. The user verifies their email address.
4. The verified user can authenticate through the login endpoint.
5. Laravel Sanctum provides authentication for protected API endpoints.
6. The authenticated user can access authorized resources.
7. The user can log out and invalidate their authentication session/token.

### Authentication Endpoints

| Method | Endpoint                                | Description                              |
| ------ | --------------------------------------- | ---------------------------------------- |
| POST   | `/api/v1/auth/register`                 | Register a new user                      |
| POST   | `/api/v1/auth/login`                    | Authenticate a user                      |
| POST   | `/api/v1/auth/logout`                   | Log out the authenticated user           |
| GET    | `/api/v1/auth/me`                       | Get the authenticated user's information |
| GET    | `/api/v1/auth/verify-email/{id}/{hash}` | Verify a user's email address            |

---

## User Management

User management endpoints are responsible for managing registered users and their roles.

| Method | Endpoint             | Description      |
| ------ | -------------------- | ---------------- |
| GET    | `/api/v1/users`      | Get all users    |
| GET    | `/api/v1/users/{id}` | Get a user by ID |
| POST   | `/api/v1/users`      | Create a user    |

### Available Roles

```text
author
reviewer
organiser
attendee
admin
```

---

# Example Registration Request

```json
{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "password_confirmation": "password123",
    "role": "author"
}
```

A successful registration returns a `201 Created` response.

Example:

```json
{
    "success": true,
    "message": "User created successfully.",
    "data": {
        "name": "Test User",
        "email": "test@example.com",
        "role": "author",
        "created_at": "2026-08-24T10:13:14.000000Z",
        "updated_at": "2026-08-24T10:13:14.000000Z",
        "id": 1
    }
}
```

---

# Swagger API Documentation

The project uses **L5-Swagger** to generate OpenAPI documentation.

Start the Laravel server:

```bash
php artisan serve
```

Then open:

```text
http://127.0.0.1:8000/api/documentation
```

Swagger UI allows developers to:

* View available API endpoints
* View request parameters
* View request bodies
* View API responses
* Test endpoints using **Try it out**
* Understand the API contract between frontend and backend

After adding or changing API documentation, regenerate Swagger:

```bash
php artisan l5-swagger:generate
```

---

# Postman API Testing

The CMT backend can also be tested using **Postman**.

Swagger is used for API documentation and browser-based testing, while Postman can be used for detailed API testing and development.

## 1. Start the Laravel Backend

```bash
cd Conference-Management-Tool/backend
php artisan serve
```

The backend should be available at:

```text
http://127.0.0.1:8000
```

Keep the terminal running while testing.

---

## 2. API Base URL

The API base URL is:

```text
http://127.0.0.1:8000/api/v1
```

---

## 3. Test Registration

**Method:**

```text
POST
```

**URL:**

```text
http://127.0.0.1:8000/api/v1/auth/register
```

Select:

```text
Body → raw → JSON
```

Use:

```json
{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "password_confirmation": "password123",
    "role": "author"
}
```

Click **Send**.

A successful request should return:

```text
201 Created
```

---

## 4. Test Login

**Method:**

```text
POST
```

**URL:**

```text
http://127.0.0.1:8000/api/v1/auth/login
```

Body:

```json
{
    "email": "test@example.com",
    "password": "password123"
}
```

A successful login should return:

```text
200 OK
```

---

## 5. Test Current User

**Method:**

```text
GET
```

**URL:**

```text
http://127.0.0.1:8000/api/v1/auth/me
```

A successful request should return:

```text
200 OK
```

and return the authenticated user's information.

---

## 6. Test Logout

**Method:**

```text
POST
```

**URL:**

```text
http://127.0.0.1:8000/api/v1/auth/logout
```

A successful request should return:

```text
200 OK
```

---

# Postman Request Summary

| Method | Endpoint                                | Purpose          |
| ------ | --------------------------------------- | ---------------- |
| POST   | `/api/v1/auth/register`                 | Register a user  |
| POST   | `/api/v1/auth/login`                    | Log in           |
| POST   | `/api/v1/auth/logout`                   | Log out          |
| GET    | `/api/v1/auth/me`                       | Get current user |
| GET    | `/api/v1/auth/verify-email/{id}/{hash}` | Verify email     |
| GET    | `/api/v1/users`                         | Get users        |
| GET    | `/api/v1/users/{id}`                    | Get user         |
| POST   | `/api/v1/users`                         | Create user      |

---

# API Versioning

The backend uses versioned API routes.

Current version:

```text
/api/v1
```

Example:

```text
/api/v1/auth/register
```

Future breaking changes should use a new API version rather than unexpectedly changing existing endpoints.

---

# Git & Pull Request Workflow

All backend development should be done through **feature branches and Pull Requests**.

Do not push development work directly to `main`.

## 1. Get the Latest Code

```bash
git checkout main
git pull origin main
```

## 2. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

Examples:

```bash
git checkout -b feature/auth-login
git checkout -b feature/conference-management
git checkout -b feature/submission-api
```

## 3. Make Your Changes

Work only on the task assigned to you.

Check your changes:

```bash
git status
```

## 4. Add Your Changes

```bash
git add .
```

Or add a specific file:

```bash
git add app/Modules/Account/Controllers/AuthController.php
```

## 5. Commit Your Changes

```bash
git commit -m "feat: add login endpoint"
```

Examples:

```bash
git commit -m "feat: add conference creation endpoint"
git commit -m "fix: validate submission request"
git commit -m "docs: update API documentation"
```

## 6. Push Your Branch

```bash
git push -u origin feature/your-feature-name
```

For subsequent pushes:

```bash
git push
```

---

# Creating a Pull Request

After pushing your branch, open the project's GitHub repository.

Set:

```text
Base branch: main
Compare branch: feature/your-feature-name
```

Add a clear title describing the work.

Example:

```text
feat: add authentication login endpoint
```

Include:

* What you changed
* What endpoints or functionality were added
* How you tested it
* Any known issues or blockers

Then create the Pull Request.

---

# Code Review

After creating the Pull Request:

1. Request a review from the appropriate backend reviewer.
2. Wait for the review.
3. Address requested changes.
4. Push the changes to the same branch.

For example:

```bash
git add .
git commit -m "fix: address review comments"
git push
```

The existing Pull Request will automatically update.

---

# Merging

Once the Pull Request has been reviewed and approved, it can be merged into `main` according to the team's repository permissions and workflow.

After the Pull Request is merged:

```bash
git checkout main
git pull origin main
```

Then create a new feature branch for the next task.

---

# Complete Git Workflow

```text
main
  │
  ├── git pull
  │
  └── feature/your-task
          │
          ├── Make changes
          ├── git status
          ├── git add .
          ├── git commit
          ├── git push
          │
          └── Pull Request
                    │
                    ├── Code Review
                    ├── Fix requested changes
                    └── Approval
                           │
                           ▼
                          main
```

### Quick Command Reference

```bash
git checkout main
git pull origin main

git checkout -b feature/your-feature-name

# Make your changes

git status
git add .
git commit -m "feat: describe your change"
git push -u origin feature/your-feature-name
```

Then create the **Pull Request on GitHub**.

---

# Development Workflow

Before starting development:

1. Pull the latest changes from `main`.
2. Check your assigned GitHub Project work item.
3. Create a feature branch.
4. Implement only your assigned task.
5. Test your changes.
6. Update Swagger documentation when adding or changing API endpoints.
7. Add and commit your changes.
8. Push your branch.
9. Open a Pull Request.
10. Request a code review.
11. Address review comments if required.
12. Merge only after approval.

---

# Useful Laravel Commands

Start the server:

```bash
php artisan serve
```

Show routes:

```bash
php artisan route:list
```

Clear cached configuration:

```bash
php artisan optimize:clear
```

Run migrations:

```bash
php artisan migrate
```

Run tests:

```bash
php artisan test
```

Generate Swagger documentation:

```bash
php artisan l5-swagger:generate
```

---

# Environment Variables

Never commit sensitive credentials to GitHub.

The following file should remain local:

```text
.env
```

Use `.env.example` to document the required environment variables.

---

# Current Development Status

## Authentication & Account Management

* [x] User registration
* [x] User login
* [x] User logout
* [x] Current-user endpoint
* [x] Email verification
* [x] Request validation
* [x] Laravel Sanctum authentication
* [x] Role-based account handling
* [x] Swagger/OpenAPI documentation
* [x] API testing support

## User Management

* [x] User creation
* [x] User listing
* [x] User retrieval by ID
* [ ] User profile management
* [ ] Role management
* [ ] User activation/deactivation
* [ ] Authorization policies

## Conference Management

* [ ] Conference creation
* [ ] Conference management
* [ ] Conference details
* [ ] Conference status management

## Submissions

* [ ] Submission creation
* [ ] Submission management
* [ ] Submission status

## Reviews

* [ ] Reviewer assignment
* [ ] Review submission
* [ ] Review management

## Decisions & Programme

* [ ] Submission decisions
* [ ] Programme management

## Reporting

* [ ] System reports
* [ ] Conference statistics

---

# Backend Architecture

The backend uses a **modular monolith with a feature-driven architecture**.

Business logic is separated from controllers through dedicated **Actions**, while validation is handled through dedicated **Request** classes.

This structure improves:

* Maintainability
* Separation of concerns
* Testability
* Code organization
* Feature scalability
* Collaboration between backend developers

The Account module is structured around components such as:

```text
Account/
├── Actions/
│   ├── LoginAction.php
│   ├── LogoutAction.php
│   └── ...
├── Controllers/
│   ├── AuthController.php
│   └── UserController.php
└── Requests/
    └── LoginRequest.php
```

Shared functionality such as middleware is maintained separately under:

```text
Modules/Shared/
```

---

# Important Notes

The authentication and user-management functionality is implemented using the project's Laravel backend architecture and PostgreSQL database configuration.

API endpoints are documented using Swagger/OpenAPI and can be tested through Swagger UI or Postman.

When another developer tests the API on their own computer, `127.0.0.1` refers to **their own machine**.

They must clone the repository, install dependencies, configure their `.env`, configure PostgreSQL, run migrations, and start the Laravel development server before testing the API.

---

# Team

**Conference Management Tool — Backend Team**

Backend development is managed through the project's GitHub repository and GitHub Projects board.

All contributors should follow the team's branching, Pull Request, code review, testing, and integration workflow.
