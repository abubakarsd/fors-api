-----

# FORS API - Farmers' Outreach and Records System

-----

## Table of Contents

  * [Overview](https://www.google.com/search?q=%23overview)
  * [Features](https://www.google.com/search?q=%23features)
  * [API Endpoints](https://www.google.com/search?q=%23api-endpoints)
  * [Setup and Installation](https://www.google.com/search?q=%23setup-and-installation)
  * [Environment Variables](https://www.google.com/search?q=%23environment-variables)
  * [Database Setup (Supabase)](https://www.google.com/search?q=%23database-setup-supabase)
  * [Running the Application](https://www.google.com/search?q=%23running-the-application)
  * [Authentication & Authorization](https://www.google.com/search?q=%23authentication--authorization)
  * [Error Handling](https://www.google.com/search?q=%23error-handling)
  * [Future Improvements](https://www.google.com/search?q=%23future-improvements)
  * [License](https://www.google.com/search?q=%23license)

-----

## Overview

The Farmers' Outreach and Records System (FORS) API is a Node.js application built with Express.js, designed to support agricultural development programs. It provides a robust backend for managing farmer data, training records, outreach efforts, and personnel, with a focus on role-based access control and data analysis. The database service used is **Supabase**.

-----

## Features

  * **User Management:** Admins can add, edit, delete, and manage user roles and activation statuses.
  * **Role & Permission Management:** Define custom roles and assign granular permissions to control system access.
  * **Authentication:** Secure email and password-based login with **One-Time Password (OTP) verification**.
  * **Project Management:** Create, view, edit, and delete projects, and assign users to specific projects.
  * **Farmer Data Management:** Full CRUD operations for farmer records, including categorization by type, and tracking of who added a farmer. Includes optional geo-tagging (latitude/longitude).
  * **Quarter Management:** Define and manage fiscal quarters (Q1, Q2, Q3, etc.).
  * **Internal Chat:** A basic messaging module for communication between users.
  * **Dashboard Summaries:** Get aggregated statistics (e.g., total farmers, active projects), with permission-based visibility.
  * **Data Analysis:** Generate reports and insights based on farmer data (e.g., by gender, type, project, region).
  * **Dynamic Port:** The API runs on a configurable port via environment variables.

-----

## API Endpoints

The API routes are structured logically by resource, ensuring a clean and maintainable codebase. All endpoints are prefixed with `/api`.

**Authentication (`/api/auth`)**

  * `POST /api/auth/register`: Register a new user (typically admin-only via user management).
  * `POST /api/auth/login`: Authenticate user, send OTP to email.
  * `POST /api/auth/verify-otp`: Verify OTP and issue JWT.

**Users (`/api/users`)**

  * `GET /api/users`: Get all users (Admin only).
  * `GET /api/users/:id`: Get a single user by ID (Admin only).
  * `POST /api/users`: Create a new user (Admin only).
  * `PUT /api/users/:id`: Update an existing user (Admin only).
  * `DELETE /api/users/:id`: Delete a user (Admin only).

**Roles (`/api/roles`)**

  * `GET /api/roles`: Get all roles with their permissions (Admin only).
  * `GET /api/roles/:id`: Get a single role by ID (Admin only).
  * `POST /api/roles`: Create a new role (Admin only).
  * `PUT /api/roles/:id`: Update an existing role and its permissions (Admin only).
  * `DELETE /api/roles/:id`: Delete a role (Admin only).

**Permissions (`/api/permissions`)**

  * `GET /api/permissions`: Get all permissions (Admin only).
  * `GET /api/permissions/:id`: Get a single permission by ID (Admin only).
  * `POST /api/permissions`: Create a new permission (Admin only).
  * `PUT /api/permissions/:id`: Update an existing permission (Admin only).
  * `DELETE /api/permissions/:id`: Delete a permission (Admin only).

**Projects (`/api/projects`)**

  * `GET /api/projects`: Get all projects (Admin) or assigned projects (User).
  * `GET /api/projects/:id`: Get a single project by ID (Admin or assigned user).
  * `POST /api/projects`: Create a new project (Admin only).
  * `PUT /api/projects/:id`: Update an existing project (Admin only).
  * `DELETE /api/projects/:id`: Delete a project (Admin only).

**Farmers (`/api/farmers`)**

  * `GET /api/farmers`: Get all farmers (Admin) or farmers in assigned projects (User).
  * `GET /api/farmers/:id`: Get a single farmer by ID (Admin or assigned user's project).
  * `POST /api/farmers`: Create a new farmer record (Admin or user in assigned project).
  * `PUT /api/farmers/:id`: Update an existing farmer record (Admin or user in assigned project).
  * `DELETE /api/farmers/:id`: Delete a farmer record (Admin or user in assigned project).

**Farmer Types (`/api/farmer-types`)**

  * `GET /api/farmer-types`: Get all farmer types (Admin only).
  * `GET /api/farmer-types/:id`: Get a single farmer type by ID (Admin only).
  * `POST /api/farmer-types`: Create a new farmer type (Admin only).
  * `PUT /api/farmer-types/:id`: Update an existing farmer type (Admin only).
  * `DELETE /api/farmer-types/:id`: Delete a farmer type (Admin only).

**Quarters (`/api/quarters`)**

  * `GET /api/quarters`: Get all quarters (Admin only).
  * `GET /api/quarters/:id`: Get a single quarter by ID (Admin only).
  * `POST /api/quarters`: Create a new quarter (Admin only).
  * `PUT /api/quarters/:id`: Update an existing quarter (Admin only).
  * `DELETE /api/quarters/:id`: Delete a quarter (Admin only).

**Chats (`/api/chats`)**

  * `GET /api/chats/:receiverId`: Get chat messages between authenticated user and receiver.
  * `POST /api/chats`: Send a new chat message.

**Dashboard (`/api/dashboard`)**

  * `GET /api/dashboard/summary`: Get dashboard summary statistics (Admin or User specific).

**Data Analysis (`/api/data-analysis`)**

  * `GET /api/data-analysis/farmers-by-gender`: Get farmer count by gender.
  * `GET /api/data-analysis/farmers-by-type`: Get farmer count by farmer type.
  * `GET /api/data-analysis/farmers-by-project`: Get farmer count by project.
  * `GET /api/data-analysis/farmers-by-region?groupBy={state|district}`: Get farmer count by state or district.

-----

## Setup and Installation

To get this project up and running locally, follow these steps:

1.  **Clone the repository:**

    ```bash
    git clone <your-repository-url>
    cd fors-api
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

-----

## Environment Variables

Create a `.env` file in the root directory of your project. This file will store your sensitive credentials and configurations.

```dotenv
# .env example
SUPABASE_URL="YOUR_SUPABASE_URL"
SUPABASE_KEY="YOUR_SUPABASE_ANON_KEY"
JWT_SECRET="A_VERY_STRONG_RANDOM_SECRET_KEY_FOR_JWT_SIGNING" # Generate a strong, random string!
PORT=3001 # Or your desired port, defaults to 3000 if not set

# Email service for OTP (e.g., Gmail)
EMAIL_USER="your_email@gmail.com"
EMAIL_PASS="your_email_app_password" # Use an App Password for services like Gmail
```

**How to get `JWT_SECRET`:**
Open your terminal and run:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and paste it as the value for `JWT_SECRET` in your `.env` file.

-----

## Database Setup (Supabase)

The FORS API uses **Supabase** as its database service. You'll need to set up your Supabase project and create the necessary tables.

1.  **Create a Supabase Project:** If you don't have one, go to [Supabase](https://supabase.com/) and create a new project.

2.  **Get Supabase Credentials:** In your Supabase project dashboard, navigate to **Project Settings \> API**. Copy your `Project URL` and `anon public` key. These will be your `SUPABASE_URL` and `SUPABASE_KEY` respectively in your `.env` file.

3.  **Create Database Tables:** Use the SQL Editor in your Supabase dashboard to run the following SQL schema to create your tables:

    ```sql
    -- 1. roles table
    CREATE TABLE roles (
        id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        role_name VARCHAR(255) UNIQUE NOT NULL
    );

    -- 2. permissions table
    CREATE TABLE permissions (
        id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        permission_name VARCHAR(255) NOT NULL,
        permission_code VARCHAR(255) UNIQUE NOT NULL
    );

    -- 3. role_permissions (many-to-many join table)
    CREATE TABLE role_permissions (
        role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        PRIMARY KEY (role_id, permission_id)
    );

    -- 4. users table
    CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Or INT GENERATED ALWAYS AS IDENTITY for integer IDs
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role_id INT NOT NULL REFERENCES roles(id),
        password_hash TEXT NOT NULL,
        activation_status BOOLEAN NOT NULL DEFAULT TRUE,
        otp VARCHAR(6), -- OTP stored temporarily
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- 5. projects table
    CREATE TABLE projects (
        id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        status BOOLEAN DEFAULT TRUE
    );

    -- 6. project_users (many-to-many join table)
    CREATE TABLE project_users (
        project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Match user ID type
        PRIMARY KEY (project_id, user_id)
    );

    -- 7. farmer_types table
    CREATE TABLE farmer_types (
        id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
    );

    -- 8. farmers table
    CREATE TABLE farmers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Or INT GENERATED ALWAYS AS IDENTITY for integer IDs
        full_name VARCHAR(255) NOT NULL,
        mobile_number VARCHAR(20),
        date_of_birth DATE,
        age INT,
        gender VARCHAR(50),
        farmer_type_id INT REFERENCES farmer_types(id),
        country_name VARCHAR(255),
        state_name VARCHAR(255),
        district_name VARCHAR(255),
        village_tract_name VARCHAR(255),
        village_name VARCHAR(255),
        project_id INT REFERENCES projects(id),
        added_by_user_id UUID REFERENCES users(id), -- Match user ID type
        date_added TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        latitude DECIMAL(10, 8), -- Optional for geo-tagging
        longitude DECIMAL(11, 8) -- Optional for geo-tagging
    );

    -- 9. quarters table
    CREATE TABLE quarters (
        id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL
    );

    -- 10. chats table
    CREATE TABLE chats (
        id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Match user ID type
        receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Match user ID type
        message TEXT NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Optional: Initial Data for Roles and Permissions (Highly Recommended)
    INSERT INTO roles (role_name) VALUES
    ('Admin'),
    ('User');

    INSERT INTO permissions (permission_name, permission_code) VALUES
    ('View Dashboard', 'VIEW_DASHBOARD'),
    ('Manage Users', 'MANAGE_USERS'),
    ('Add Users', 'ADD_USERS'),
    ('Edit Users', 'EDIT_USERS'),
    ('Delete Users', 'DELETE_USERS'),
    ('View Roles', 'VIEW_ROLES'),
    ('Add Roles', 'ADD_ROLES'),
    ('Edit Roles', 'EDIT_ROLES'),
    ('Delete Roles', 'DELETE_ROLES'),
    ('View Permissions', 'VIEW_PERMISSIONS'),
    ('Add Permissions', 'ADD_PERMISSIONS'),
    ('Edit Permissions', 'EDIT_PERMISSIONS'),
    ('Delete Permissions', 'DELETE_PERMISSIONS'),
    ('View Projects', 'VIEW_PROJECTS'),
    ('Create Projects', 'CREATE_PROJECTS'),
    ('Edit Projects', 'EDIT_PROJECTS'),
    ('Delete Projects', 'DELETE_PROJECTS'),
    ('View Farmer Records', 'VIEW_FARMER_RECORDS'),
    ('Add Farmer Records', 'ADD_FARMER_RECORDS'),
    ('Edit Farmer Records', 'EDIT_FARMER_RECORDS'),
    ('Delete Farmer Records', 'DELETE_FARMER_RECORDS'),
    ('View Farmer Types', 'VIEW_FARMER_TYPES'),
    ('Add Farmer Types', 'ADD_FARMER_TYPES'),
    ('Edit Farmer Types', 'EDIT_FARMER_TYPES'),
    ('Delete Farmer Types', 'DELETE_FARMER_TYPES'),
    ('View Quarters', 'VIEW_QUARTERS'),
    ('Add Quarters', 'ADD_QUARTERS'),
    ('Edit Quarters', 'EDIT_QUARTERS'),
    ('Delete Quarters', 'DELETE_QUARTERS'),
    ('Internal Chat', 'INTERNAL_CHAT'),
    ('Share Demo Links', 'SHARE_DEMO_LINKS'),
    ('Analyze Data', 'ANALYZE_DATA'),
    ('Analyze Project Data', 'ANALYZE_PROJECT_DATA');

    -- Assign all permissions to Admin role (assuming Admin is role_id 1 after initial insert)
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id FROM roles r, permissions p WHERE r.role_name = 'Admin';

    -- Assign basic user permissions to 'User' role (assuming User is role_id 2 after initial insert)
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id FROM roles r, permissions p
    WHERE r.role_name = 'User' AND p.permission_code IN (
        'VIEW_DASHBOARD',
        'VIEW_PROJECTS',
        'VIEW_FARMER_RECORDS',
        'ADD_FARMER_RECORDS',
        'EDIT_FARMER_RECORDS',
        'INTERNAL_CHAT',
        'SHARE_DEMO_LINKS',
        'ANALYZE_PROJECT_DATA'
    );
    ```

-----

## Running the Application

After setting up your `.env` file and database, you can start the API:

```bash
npm start
# or
node app.js
```

The API will be accessible at `http://localhost:<PORT>` (e.g., `http://localhost:3001` if your `PORT` is set to 3001). You'll see a message in your console indicating which port the server is listening on.

-----

## Authentication & Authorization

The FORS API employs a robust security model:

  * **JWT (JSON Web Tokens):** Used for session management after successful OTP verification.
  * **Email OTP:** Adds an extra layer of security during the login process.
  * **Role-Based Access Control (RBAC):** Users are assigned roles (e.g., Admin, User).
  * **Permission-Based Authorization:** Each role has specific permissions (e.g., `ADD_USERS`, `VIEW_FARMER_RECORDS`). Middleware (`authMiddleware.js`) ensures that only authenticated users with the correct permissions can access certain routes.

To interact with protected routes, you must include a valid JWT in the `Authorization` header of your requests, prefixed with `Bearer`.
Example: `Authorization: Bearer <YOUR_JWT_TOKEN>`

-----

## Error Handling

The API includes a global error handling middleware in `app.js` to catch unhandled errors and return a generic 500 status. Specific routes also include localized error handling for common scenarios (e.g., 400 for bad requests, 404 for not found).

-----

## Future Improvements

  * **Audit Logging:** Implement a dedicated audit log table and middleware to track all significant user actions for accountability.
  * **Geo-Tagging Interface:** Develop frontend features to utilize the `latitude` and `longitude` fields for mapping farmer locations.
  * **Multi-language Support:** If operating in diverse linguistic regions, add internationalization (i18n) capabilities.
  * **Data Backup & Recovery:** Integrate automated backup solutions for the Supabase database.
  * **Mobile Accessibility:** Optimize the API for mobile application consumption or consider building a dedicated mobile app.
  * **Training Module:** Add tables and routes to track farmer training participation and effectiveness.
  * **Input Demo Sharing:** Develop a system to generate unique, shareable links for public farmer data input (e.g., for surveys).
  * **Advanced Analytics:** Expand reporting features with more complex data visualizations and predictive analytics.
  * **Webhooks/Events:** Implement Supabase webhooks for real-time notifications on database changes.

-----

## License

This project is open-source and available under the MIT License.

-----

Feel free to contribute to this project or use it as a foundation for your agricultural development initiatives\!

Do you have any specific features you'd like to dive deeper into, or perhaps need help with deployment?
