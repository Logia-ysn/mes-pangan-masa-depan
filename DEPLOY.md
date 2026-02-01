# Deployment Guide - ERP Pangan Masa Depan

This guide covers the deployment process for the ERP Pangan Masa Depan application (Backend + Frontend).

## Prerequisites

- Node.js (v18+)
- npm or yarn
- MySQL/MariaDB or PostgreSQL Database

## Backend Deployment

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   - Copy `.env.example` to `.env` (or create `.env`)
   - Update database credentials and other settings:
     ```env
     PORT=3000
     DB_HOST=localhost
     DB_PORT=3306
     DB_USERNAME=root
     DB_PASSWORD=yourpassword
     DB_DATABASE=erp_db
     JWT_SECRET=your_secure_secret
     ```

3. **Database Migration**
   - Run migrations to set up the database schema:
     ```bash
     npm run migrate
     ```

4. **Build**
   - Compile TypeScript to JavaScript:
     ```bash
     npm run build
     ```

5. **Start Server**
   - Run the production server:
     ```bash
     npm start
     ```
   - The API will be available at `http://localhost:3000`.

## Frontend Deployment

1. **Navigate to Directory**
   ```bash
   cd frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build Application**
   - This creates a `dist` folder with static files:
     ```bash
     npm run build
     ```
   - *Note*: Ensure the Backend API URL is correctly set in `src/services/api.ts` or via Environment Variables before building.

4. **Serve Static Files**
   - **For Testing/Preview**:
     ```bash
     npm run preview
     ```
   - **For Production**:
     Deploy the contents of the `dist` folder to a static web server like Nginx, Apache, or Vercel/Netlify.
   - **Nginx Example Config**:
     ```nginx
     server {
         listen 80;
         server_name specific-domain.com;
         root /path/to/frontend/dist;
         index index.html;
         location / {
             try_files $uri $uri/ /index.html;
         }
     }
     ```

## Docker Deployment (Optional)

A `docker-compose.yml` can be created to orchestrate both services.
