# Poultry Management System

A poultry farm management backend built with **Node.js, Express.js and PostgreSQL**. The system is designed to help manage poultry flocks, egg production, feed manufacturing, raw materials, inventory, sales, expenses and farm performance reports.

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Requirements](#requirements)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [PDF Reports](#pdf-reports)
- [Database](#database)
- [Financial Calculations](#financial-calculations)
- [Error Handling and Troubleshooting](#error-handling-and-troubleshooting)
- [Future Improvements](#future-improvements)

## Project Overview

The Poultry Management System provides a centralized way to manage the daily activities and financial performance of a poultry farm.

The backend follows a **modular monolith architecture**, separating HTTP routes, controllers, business logic and database operations into organized modules.

The project uses PostgreSQL hosted on Neon for persistent data storage.

## Features

### 1. Authentication and Authorization

- User registration and login.
- Password hashing.
- JSON Web Token (JWT) authentication.
- Role-based access control.

### 2. Flock Management

- Register and manage poultry flocks.
- Record initial bird quantities.
- Retrieve flock information.
- Update flock details and status.

### 3. Egg Production

- Record daily egg collection.
- Record broken eggs.
- Calculate intact eggs.
- Retrieve production records and summaries.

### 4. Raw Material Management

- Register feed raw materials.
- Record raw material purchases.
- Track material usage in feed production.
- Calculate estimated remaining stock and material costs.

### 5. Feed Formulation and Production

- Create and manage feed formulas.
- Define raw materials used in each formula.
- Record feed production batches.
- Track actual production quantities.
- Calculate feed production costs from raw material usage.

### 6. Feed Consumption

- Record feed consumed by a flock.
- Track consumption quantities and dates.
- Record feed consumption costs where available.

### 7. Inventory Management

- View raw material stock information.
- View finished feed inventory.
- Monitor estimated remaining quantities and stock values.

### 8. Expense Management

- Record farm expenses.
- Associate expenses with flocks where applicable.
- Categorize and summarize expenses.
- Retrieve expense records.

### 9. Egg Sales

- Record egg sales.
- Track quantities sold and selling prices.
- Calculate total sales amounts.
- Summarize sales revenue over a selected period.

### 10. Reports and Analytics

- Retrieve farm summary reports.
- Generate daily activity reports.
- Summarize egg production, sales, feed consumption and expenses.
- Generate downloadable PDF reports with summary figures, tables and charts.

**Note:** The PDF endpoint and its output should be tested in the running application before being considered production-ready.

## Technology Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | Backend web framework |
| PostgreSQL | Relational database |
| Neon | Hosted PostgreSQL database |
| `pg` | PostgreSQL client for Node.js |
| `bcryptjs` | Password hashing |
| `jsonwebtoken` | JWT authentication |
| `dotenv` | Environment variable configuration |
| `pdfkit` | PDF report generation |
| Nodemon | Development server restart utility |
| Thunder Client | API testing |

The web dashboard is a planned frontend extension and is separate from the current backend.

## System Architecture

The application follows a modular monolith architecture.

```text
Client / Thunder Client / Web Dashboard
                  |
                  v
          Express Application
                  |
                  v
                Routes
                  |
                  v
              Controllers
                  |
                  v
               Services
                  |
                  v
             Repositories
                  |
                  v
          PostgreSQL on Neon
```

### Architectural responsibilities

- **Routes:** Define API endpoints and attach authentication or authorization middleware.
- **Controllers:** Receive HTTP requests, call services and return HTTP responses.
- **Services:** Contain business rules, validation and calculations.
- **Repositories:** Execute database queries and return database results.
- **Configuration:** Stores database connection setup and other application configuration.
- **Middleware:** Handles authentication, authorization and errors.
- **PDF service:** Builds downloadable PDF reports from report data.

## Project Structure

The main source directories are organized by functional module.

```text
poultry-management/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   ├── error.middleware.js
│   │   └── not-found.middleware.js
│   └── modules/
│       ├── auth/
│       ├── flocks/
│       ├── production/
│       ├── raw-materials/
│       ├── feed-formulas/
│       ├── feed-production/
│       ├── feed-consumption/
│       ├── inventory/
│       ├── expenses/
│       ├── egg-sales/
│       └── reports/
│           ├── reports.routes.js
│           ├── reports.controller.js
│           ├── reports.service.js
│           ├── reports.repository.js
│           ├── reports.pdf.controller.js
│           └── reports.pdf.service.js
├── .env
├── .gitignore
├── package.json
└── README.md
```

Some filenames may differ depending on the final implementation. Each module should contain the routes, controller, service and repository files relevant to that module.

## Requirements

Install the following before running the project:

- Node.js and npm.
- A PostgreSQL database or Neon PostgreSQL project.
- Visual Studio Code or another code editor.
- Thunder Client or another API testing tool.
- Git for version control.

## Installation

Clone the repository:

```bash
git clone https://github.com/Shock-gun/poultry-management.git
```

Navigate into the project directory:

```bash
cd poultry-management
```

Install dependencies:

```bash
npm install
```

If PDF generation is enabled, ensure PDFKit is installed:

```bash
npm install pdfkit
```

## Environment Configuration

Create a `.env` file in the project root.

Example:

```env
PORT=3000
DATABASE_URL=your_neon_postgresql_connection_string
JWT_SECRET=your_long_random_secret
```

Replace the example values with your actual database connection string and a strong JWT secret.

Do not commit your `.env` file or expose database credentials, passwords or JWT secrets.

Ensure `.gitignore` contains:

```gitignore
node_modules/
.env
*.log
poultry-farm-report*.pdf
```

The PDF ignore rule is optional; remove it if you intentionally want to version generated reports.

## Running the Application

Start the development server:

```bash
npm run dev
```

The expected startup message is similar to:

```text
Poultry Management API running on port 3000
```

The local API base URL is:

```text
http://localhost:3000
```

Keep the development server running while testing endpoints.

## Authentication

Most protected endpoints require a valid JWT.

### Login

Send a `POST` request to:

```text
http://localhost:3000/api/auth/login
```

Example JSON body:

```json
{
  "email": "your_registered_email",
  "password": "your_password"
}
```

Use the actual credentials of a registered account.

After a successful login, copy the returned token.

### Authenticated requests

Add this HTTP header to protected requests:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

Replace `YOUR_JWT_TOKEN` with the actual token.

Access to certain operations depends on the user's role.

## API Endpoints

The following table describes the main module endpoints. Confirm the exact paths against each module's routes file before relying on them in an external client.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in |
| GET | `/api/flocks` | List flocks |
| GET | `/api/production` | Access egg production records |
| GET | `/api/inventory` | View inventory overview |
| GET | `/api/inventory/raw-materials` | View raw material stock |
| GET | `/api/inventory/finished-feed` | View finished feed stock |
| GET | `/api/expenses` | List farm expenses |
| GET | `/api/egg-sales` | List egg sales |
| GET | `/api/reports/summary` | Retrieve farm summary |
| GET | `/api/reports/daily` | Retrieve daily activity report |
| GET | `/api/reports/pdf` | Download a farm report as PDF |

Some modules also provide create, update, delete, detail, purchase and summary operations, subject to their implemented routes and permissions.

### Report date filters

Reports may accept `start_date` and `end_date` query parameters in `YYYY-MM-DD` format.

Example:

```text
GET /api/reports/summary?start_date=2026-10-01&end_date=2026-10-22
```

## PDF Reports

The PDF report feature is designed to generate a downloadable report containing:

- Farm summary metrics.
- Egg production and sales information.
- Feed consumption and expense figures.
- A daily activity table.
- Egg production and sales revenue charts.

### Download a report using PowerShell

After obtaining a valid JWT token, run:

```powershell
curl.exe -sS -w "`nHTTP Status: %{http_code}`nContent-Type: %{content_type}`nDownloaded: %{size_download} bytes`n" -H "Authorization: Bearer YOUR_JWT_TOKEN" -o poultry-farm-report.pdf "http://localhost:3000/api/reports/pdf"
```

Replace `YOUR_JWT_TOKEN` with your actual token.

A successful response should return:

```text
HTTP Status: 200
Content-Type: application/pdf
```

Open the generated report:

```powershell
Start-Process .\poultry-farm-report.pdf
```

If the request returns `401 Unauthorized`, obtain a fresh token by logging in again.

If the PDF is unreadable, verify the HTTP response, downloaded file size and server error logs before treating the report as successful.

### Download a report for a date range

```powershell
curl.exe -H "Authorization: Bearer YOUR_JWT_TOKEN" -o poultry-farm-report.pdf "http://localhost:3000/api/reports/pdf?start_date=2026-10-01&end_date=2026-10-22"
```

## Database

The application uses PostgreSQL to store farm data.

Core database tables include:

- `users`
- `flocks`
- `egg_production`
- `egg_sales`
- `raw_materials`
- `raw_material_purchases`
- `feed_formulas`
- `feed_formula_ingredients`
- `feed_production_batches`
- `feed_production_ingredients`
- `finished_feed_inventory`
- `feed_consumption`
- `farm_expenses`

Additional tables support feed types, feed purchases and other inventory-related operations.

Database changes should be managed carefully so that repository queries remain consistent with the actual schema.

## Financial Calculations

The reporting module is intended to help assess farm performance using recorded production, sales, feed costs and expenses.

### Egg production

```text
Intact Eggs = Eggs Collected - Broken Eggs
```

### Egg sales revenue

```text
Sales Revenue = Sum of Recorded Egg Sale Amounts
```

### Feed production cost

```text
Feed Production Cost = Sum of Raw Material Costs Used
```

### Feed consumption cost

```text
Feed Consumption Cost = Sum of (Quantity Consumed × Recorded Cost per Unit)
```

### Estimated operating profit

```text
Estimated Operating Profit =
    Egg Sales Revenue
    - Feed Consumption Cost
    - Other Farm Expenses
```

**Accounting note:** These figures are estimates until expense categories and inventory costs have been reconciled. Feed costs must not be counted twice if feed expenses are already included in farm expenses. Unsold eggs, inventory valuation and other production costs may also affect actual profitability.

## Error Handling and Troubleshooting

### Server fails to start

- Check the terminal error.
- Verify imports and exported function names.
- Confirm required environment variables are configured.
- Ensure the database configuration loads correctly.

### `401 Unauthorized`

- Log in again to obtain a valid token.
- Check that the request includes the `Authorization` header.
- Ensure the token has not expired.

### `403 Forbidden`

The authenticated user may not have the role required for the requested operation.

### Database errors

- Confirm the Neon database is available.
- Verify the connection string.
- Check that required tables and columns exist.
- Compare repository SQL with the actual database schema.

### PDF download errors

- Confirm the PDF route is registered.
- Check that the PDF controller imports the correct PDF service.
- Verify authentication.
- Inspect server logs for database or PDF generation errors.
- Confirm the response content type is `application/pdf`.
- Verify that the downloaded file opens correctly.

## Future Improvements

Planned improvements include:

- A React web dashboard.
- Interactive egg production, sales and financial charts.
- Date filters for reports.
- A dashboard button to download PDF reports.
- Improved profit calculations using reconciled costs.
- More detailed flock performance reports.
- Feed conversion and average consumption analysis.
- Stock alerts for raw materials and finished feed.
- Automated testing and API documentation.
- Production deployment, monitoring and security improvements.

## Project Status

The project is being developed incrementally. Backend modules are implemented progressively, and individual endpoints should be tested before being considered production-ready.

The next planned step is a React dashboard connected to the existing authenticated API, with interactive charts and a PDF download button.

## License

Add your chosen open-source or proprietary license here before distributing the project.
