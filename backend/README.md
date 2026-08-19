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

---

## Project Structure

The backend follows a **modular, feature-driven architecture**.

```text
app/
└── Modules/
    ├── Account/
    │   ├── Actions/
    │   └── Controllers/
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

| Module      | Responsibility                                |
| ----------- | --------------------------------------------- |
| Account     | Authentication and account access             |
| Users       | User management and permissions               |
| Conferences | Conference creation and management            |
| Submissions | Paper/submission management                   |
| Reviews     | Reviewing and reviewer assignments            |
| Decisions   | Submission decisions and programme management |
| Reporting   | Reports and system statistics                 |

---

## Requirements

Before setting up the project, make sure you have installed:

* PHP 8.2 or higher
* Composer
* PostgreSQL
* Git
* Postman *(optional, for API testing)*

Check your versions:

```bash
php -v
composer -V
```

---

## Installation

### 1. Clone the repository

```bash
git clone <REPOSITORY_URL>
```

Move into the backend directory:

```bash
cd Conference-Management-Tool/backend
```

### 2. Install PHP dependencies

```bash
composer install
```

### 3. Create the environment file

**Windows:**

```cmd
copy .env.example .env
```

**Linux/macOS:**

```bash
cp .env.example .env
```

### 4. Generate the application key

```bash
php artisan key:generate
```

### 5. Configure the database

Update your `.env` file with the PostgreSQL credentials supplied by the database team.

Example:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=cmt
DB_USERNAME=postgres
DB_PASSWORD=your_password
```

> **Important:** Never commit `.env` to GitHub.

### 6. Run migrations

```bash
php artisan migrate
```

If seeders are available:

```bash
php artisan db:seed
```

### 7. Start the development server

```bash
php artisan serve
```

The API will be available at:

```text
http://127.0.0.1:8000
```

---

# API

All application API endpoints use the `/api/v1` prefix.

## Authentication

Current authentication endpoints:

| Method | Endpoint                | Description                |
| ------ | ----------------------- | -------------------------- |
| POST   | `/api/v1/auth/register` | Register a user            |
| POST   | `/api/v1/auth/login`    | Authenticate a user        |
| POST   | `/api/v1/auth/logout`   | Log out                    |
| GET    | `/api/v1/auth/me`       | Get the authenticated user |

### Example Registration Request

```json
{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "author"
}
```

Available roles:

```text
author
reviewer
organiser
attendee
admin
```

---

# Swagger API Documentation

The project uses **L5-Swagger** to generate OpenAPI documentation.

Start the Laravel development server:

```bash
php artisan serve
```

Then open:

```text
http://127.0.0.1:8000/api/documentation
```

Swagger UI can be used to:

* View available API endpoints
* View request parameters
* View request bodies
* View API responses
* Test endpoints using **Try it out**
* Understand the API contract between frontend and backend

After changing or adding API documentation, regenerate the Swagger specification:

```bash
php artisan l5-swagger:generate
```

---

# Postman API Testing

The CMT backend can also be tested using **Postman**.

Swagger is used for API documentation and browser-based testing, while Postman can be used for more detailed API testing and development.

## 1. Start the Laravel Backend

Open a terminal in the backend directory:

```bash
cd Conference-Management-Tool/backend
```

Start the server:

```bash
php artisan serve
```

The backend should be available at:

```text
http://127.0.0.1:8000
```

Keep this terminal running while testing the API.

---

## 2. Open Postman

Open Postman and create a new **HTTP Request**.

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

Click **Send**.

A successful login should return:

```text
200 OK
```

The response will contain the authentication information provided by the current implementation.

---

## 5. Test Logout

**Method:**

```text
POST
```

**URL:**

```text
http://127.0.0.1:8000/api/v1/auth/logout
```

Click **Send**.

A successful request should return:

```text
200 OK
```

---

## 6. Test Current User

**Method:**

```text
GET
```

**URL:**

```text
http://127.0.0.1:8000/api/v1/auth/me
```

Click **Send**.

A successful request should return:

```text
200 OK
```

and return the current user's information.

---

## Postman Request Summary

| Method | Endpoint                | Purpose          |
| ------ | ----------------------- | ---------------- |
| POST   | `/api/v1/auth/register` | Register a user  |
| POST   | `/api/v1/auth/login`    | Log in           |
| POST   | `/api/v1/auth/logout`   | Log out          |
| GET    | `/api/v1/auth/me`       | Get current user |

Full local URLs:

```text
POST http://127.0.0.1:8000/api/v1/auth/register
POST http://127.0.0.1:8000/api/v1/auth/login
POST http://127.0.0.1:8000/api/v1/auth/logout
GET  http://127.0.0.1:8000/api/v1/auth/me
```

### Important

When another developer is testing the API on their own computer, `127.0.0.1` refers to **their own machine**.

They must first clone the backend repository, install the dependencies, configure their `.env`, and run:

```bash
php artisan serve
```

before sending requests from Postman.

The current authentication implementation is **mocked** while database integration is being finalized. The request structure and API routes can therefore be tested before PostgreSQL integration is complete.

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

# Development Workflow

## Create a New Branch

Developers should not work directly on `main`.

Create a feature branch:

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

Examples:

```text
feature/auth-login
feature/conference-management
feature/submission-management
feature/review-system
```

## Make Your Changes

Implement your assigned task within the appropriate module.

Before committing, check:

```bash
php artisan route:list
```

and, where applicable:

```bash
php artisan test
```

## Commit Your Changes

Use clear commit messages:

```bash
git add .
git commit -m "feat: add conference creation endpoint"
```

## Push Your Branch

```bash
git push origin feature/your-feature-name
```

## Create a Pull Request

Open a Pull Request on GitHub.

Every Pull Request should:

* Clearly describe the changes
* Reference the relevant GitHub Project work item or issue
* Include testing information
* Pass the required checks
* Be reviewed before merging

Do not merge directly into `main` without the required review.

---

# Working With the Team

The backend is being developed collaboratively.

Before starting development:

1. Pull the latest changes from `main`.
2. Check your assigned GitHub Project work item.
3. Create a feature branch.
4. Implement only your assigned task.
5. Test your changes.
6. Update Swagger documentation when adding or changing API endpoints.
7. Push your branch.
8. Open a Pull Request.
9. Request a code review.
10. Merge only after approval.

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

## Authentication

* [x] Registration endpoint
* [x] Login endpoint
* [x] Logout endpoint
* [x] Current-user endpoint
* [x] Swagger documentation
* [x] Postman testing support

## User Management

* [ ] User listing
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

# Important Notes

The authentication API currently contains **mock functionality** while the database integration is being finalized.

Once the PostgreSQL database structure is available, the mock implementations will be replaced with the proper database-backed implementation.

The API contract and endpoint structure should remain stable wherever possible so that frontend development can continue independently.

---

# Team

**Conference Management Tool — Backend Team**

Backend development is managed through the project's GitHub repository and GitHub Projects board.

All contributors should follow the team's branching, Pull Request, code review, and integration workflow.
