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

## Requirements

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
DB_DATABASE=cmt
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

Keep this terminal running while testing.

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

When another developer tests the API on their own computer, `127.0.0.1` refers to **their own machine**.

They must clone the repository, install dependencies, configure their `.env`, and run:

```bash
php artisan serve
```

before sending requests from Postman.

The current authentication implementation is **mocked** while database integration is being finalized. The API routes and request structures can therefore be tested before PostgreSQL integration is complete.

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

Before starting work:

```bash
git checkout main
git pull origin main
```

This ensures you are working with the latest version of the backend.

---

## 2. Create a Feature Branch

Create a branch for your assigned task:

```bash
git checkout -b feature/your-feature-name
```

Examples:

```bash
git checkout -b feature/auth-login
git checkout -b feature/conference-management
git checkout -b feature/submission-api
```

Use a clear branch name that describes the work.

---

## 3. Make Your Changes

Work only on the task assigned to you.

After making your changes:

```bash
git status
```

Review the changed files before adding them.

---

## 4. Add Your Changes

Add the files you want to include:

```bash
git add .
```

Or add a specific file:

```bash
git add app/Modules/Account/Controllers/AuthController.php
```

Check again:

```bash
git status
```

---

## 5. Commit Your Changes

Create a commit with a clear message:

```bash
git commit -m "feat: add login endpoint"
```

Examples:

```bash
git commit -m "feat: add conference creation endpoint"
git commit -m "fix: validate submission request"
git commit -m "docs: update API documentation"
```

---

## 6. Push Your Branch

Push your feature branch to GitHub:

```bash
git push -u origin feature/your-feature-name
```

For subsequent pushes:

```bash
git push
```

---

# Creating a Pull Request

After pushing your branch, go to the project's GitHub repository.

GitHub should display an option such as:

**Compare & pull request**

Select it.

Set:

```text
Base branch: main
Compare branch: feature/your-feature-name
```

Add a clear title.

Example:

```text
feat: add authentication login endpoint
```

In the description, explain:

* What you changed
* What endpoints or functionality were added
* How you tested it
* Any known issues or blockers

Example:

```text
## Changes

- Added login endpoint
- Added LoginUserAction
- Added Swagger documentation
- Added API route

## Testing

- Tested using Swagger
- Tested using Postman
- Confirmed route appears in php artisan route:list

## Notes

Authentication is currently mocked while database integration is being finalized.
```

Then click:

**Create pull request**

---

# Code Review

After creating the Pull Request:

1. Request a review from the appropriate backend reviewer.
2. Wait for the review.
3. Address any requested changes.
4. Push the changes to the same branch.

You do **not** need to create another Pull Request after making changes.

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

After the Pull Request is merged, update your local `main` branch:

```bash
git checkout main
git pull origin main
```

Then create a new feature branch for your next task.

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

All contributors should follow the team's branching, Pull Request, code review, testing, and integration workflow.
#   T r i g g e r   C I   r e r u n  
 // Testing CI/CD
