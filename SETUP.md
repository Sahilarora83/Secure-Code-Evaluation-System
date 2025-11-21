# Setup Instructions

## Quick Start Guide

### 1. Database Setup

First, make sure PostgreSQL is installed and running on your system.

Create a new database:
```sql
CREATE DATABASE code_evaluation;
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file with your database credentials and Daytona API key:
```
PORT=5000
JWT_SECRET=your_secure_jwt_secret_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=code_evaluation
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DAYTONA_API_KEY=dtn_ecb2c3bdca7e9982ceb1a59dfa81faee007969356de7799bbb069d9667a20c5e
DAYTONA_API_URL=https://app.daytona.io/api
NODE_ENV=development
```

Start the backend:
```bash
npm start
# or
npm run dev
```

The server will automatically create all database tables on first run.

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env` file:
```
REACT_APP_API_URL=http://localhost:5000/api
```

Start the frontend:
```bash
npm start
```

### 4. Create Admin Account

1. Go to http://localhost:3000/register
2. Register with role "admin"
3. Login and access the admin panel

### 5. Create Your First Challenge

1. Login as admin
2. Go to Admin Panel
3. Click "Create Challenge"
4. Fill in the challenge details
5. Add test cases
6. Save the challenge

### 6. Test as Candidate

1. Register a new account with role "candidate" (or use a different browser/incognito)
2. Browse challenges
3. Click on a challenge
4. Write code in the editor
5. Click "Run Code" to test
6. Click "Submit" when ready

## Troubleshooting

### Database Connection Issues
- Make sure PostgreSQL is running
- Check your database credentials in `.env`
- Verify the database exists

### Daytona API Issues
- The system includes a fallback mock execution for development
- In production, ensure Daytona API is accessible
- Check your API key is correct

### Port Conflicts
- Backend default: 5000
- Frontend default: 3000
- Change ports in `.env` files if needed

## Production Deployment

1. Set `NODE_ENV=production` in backend `.env`
2. Build frontend: `cd frontend && npm run build`
3. Serve frontend build folder with a web server (nginx, Apache, etc.)
4. Use PM2 or similar for Node.js process management
5. Set up SSL certificates
6. Configure environment variables securely

