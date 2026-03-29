# BookCircle

[![React](https://img.shields.io/badge/Frontend-React%2019-61dafb?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Build-Vite-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Netlify](https://img.shields.io/badge/Deploy-Netlify-00c7b7?logo=netlify&logoColor=white)](https://www.netlify.com/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ecf8e?logo=supabase&logoColor=white)](https://supabase.com/)

BookCircle is a hyperlocal book exchange platform for apartment societies and local communities.  
Residents can join a society, list books, request books from neighbors, connect through WhatsApp or direct call, and manage community approvals through admin dashboards.

## Live Demo

- App: [https://bookscircle.netlify.app](https://bookscircle.netlify.app)
- Login: [https://bookscircle.netlify.app/login](https://bookscircle.netlify.app/login)

## Demo Credentials

### Platform Admin

- Phone: `9999999999`
- Password: `Admin@123`

### Test Notes

- create a new user from the login/signup flow
- create or join a society
- list books and send requests
- use WhatsApp or direct call from the dashboard

## Screenshots

Add screenshots here after uploading images to the repo, for example:

```md
![Login](./docs/login.png)
![Dashboard](./docs/dashboard.png)
![Admin](./docs/admin.png)
```

## Features

- Phone-based login and signup flow
- Society join and society creation flow
- Society admin approval system for members
- Platform admin dashboard for SaaS management
- Book listing and book request system
- WhatsApp owner contact button
- Direct call owner button
- Wing/building optional, room number support
- Mobile-friendly UI
- Progressive Web App support

## Tech Stack

- Frontend: React + Vite
- Backend: Express
- Database: PostgreSQL / Supabase
- ORM: Prisma 7 with `@prisma/adapter-pg`
- Hosting: Netlify Functions + Netlify static frontend

## Project Structure

```text
books-main/
  backend/
    netlify-functions/
    prisma/
    routes/
    scripts/
  frontend/
    public/
    src/
  netlify.toml
```

## Local Development

### 1. Install dependencies

From the project root:

```powershell
npm install
cd frontend
npm install
cd ..
cd backend
npm install
cd ..
```

### 2. Configure environment

Create [backend/.env](D:/books-main/backend/.env) with:

```env
DATABASE_URL="your_supabase_pooled_url"
DIRECT_URL="your_supabase_direct_url"
JWT_SECRET="your_strong_secret"
FRONTEND_URL="http://localhost:5173"
```

Example Supabase format:

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
```

Important:

- URL-encode special password characters like `@` as `%40`
- do not commit `.env`

### 3. Seed the platform admin

```powershell
cd backend
npm run seed:admin
```

Default seeded admin:

- Phone: `9999999999`
- Password: `Admin@123`

### 4. Start backend

```powershell
cd backend
node index.js
```

### 5. Start frontend

```powershell
cd frontend
npm run dev
```

Frontend:

- [http://localhost:5173](http://localhost:5173)

Backend:

- [http://127.0.0.1:5000](http://127.0.0.1:5000)

## Netlify Deployment

This project is configured for Netlify using [netlify.toml](D:/books-main/netlify.toml).

### Build settings

- Build command:

```bash
npm install --prefix frontend && npm --prefix frontend run build
```

- Publish directory:

```bash
frontend/dist
```

- Functions directory:

```bash
backend/netlify-functions
```

### Required Netlify Environment Variables

Add these in Netlify Site Configuration -> Environment Variables:

```env
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JWT_SECRET=your_strong_secret
FRONTEND_URL=https://your-site.netlify.app
```

### Deploy flow

1. Push code to GitHub
2. Import repo into Netlify
3. Add the environment variables
4. Trigger deploy
5. Use `Clear cache and deploy site` if API behavior looks stale

## Supabase Setup

1. Create a Supabase project
2. Copy the pooled and direct Postgres URLs
3. Put them in [backend/.env](D:/books-main/backend/.env)
4. Seed the admin:

```powershell
cd backend
npm run seed:admin
```

## Main User Flows

### Member

- login or signup with phone
- join a society or create a new one
- list books
- request books
- contact owner by WhatsApp or direct call

### Society Admin

- approve or reject pending members
- promote members to society admin
- view activity and requests

### Platform Admin

- approve or reject societies
- create society and society admin
- manage subscriptions
- monitor platform stats

## PWA

The frontend now includes:

- web app manifest
- service worker
- install prompt

Users can install BookCircle on mobile home screens for an app-like experience.

## Useful Commands

Root:

```powershell
npm install
```

Frontend:

```powershell
cd frontend
npm run dev
npm run build
npm run lint
```

Backend:

```powershell
cd backend
node index.js
npm run seed:admin
```

## Notes

- Supabase/Auth dashboard users are different from the app’s custom `public.User` table
- this app currently uses custom JWT auth, not Supabase Auth
- if Netlify shows stale API behavior, use `Clear cache and deploy site`
- if a secret was exposed publicly, rotate it immediately in Supabase and Netlify

## License

Private project. Add a license if you want to open source it.
