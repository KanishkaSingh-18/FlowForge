# FlowForge

**Plan smarter. Unblock progress. Finish on time.**

FlowForge is a project execution and deadline management platform that helps students organize projects, manage tasks, coordinate with teammates, and identify blockers that prevent progress.

Its key differentiator is **Project Dependency Intelligence**: tasks can depend on prerequisites, and the application identifies blocked tasks, tasks ready to start, and overdue work.

## Problem Statement

Student projects often involve multiple tasks, deadlines, dependencies, and collaborators. Traditional task lists do not always explain what is blocking progress or which task should be completed next.

FlowForge combines project management with dependency-aware task tracking to make project progress easier to understand and manage.

## Target Users

- Students managing academic projects and assignments.
- Individuals organizing multi-step projects.
- Student teams coordinating responsibilities and deadlines.

## Key Features

### Authentication and Access Control
- User registration, login, and logout.
- JWT-based authentication using HTTP-only cookies.
- Protected resources and project membership checks.

### Project Management
- Create and manage projects.
- Support personal and team projects.
- Manage project members and roles.

### Task Management
- Create and update project tasks.
- Assign tasks to users.
- Set task status, priority, and due dates.
- Define dependencies between tasks.

### Project Dependency Intelligence
- Identify tasks blocked by unfinished prerequisites.
- Determine which tasks are ready to start.
- Track overdue tasks.
- Prevent task completion while prerequisites remain unfinished.

### My Work Dashboard
- View tasks assigned to the current user across projects.
- Filter tasks by status and conditions such as blocked or overdue.
- Navigate to the corresponding project workspace.

### Project Activity
- View recorded project activity and related task information.
- Refresh the activity feed to retrieve recent entries.

### Dashboard and Progress Tracking
- View project and task summaries.
- Monitor completion progress.
- Identify outstanding work and blockers.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript |
| Routing | React Router DOM |
| Styling | Tailwind CSS 4 |
| API communication | Axios |
| State management | React Context API |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | bcrypt, JSON Web Tokens, HTTP-only cookies |
| Version control | Git, GitHub |
| Deployment target | Vercel, Render, MongoDB Atlas |

## Architecture

FlowForge uses a client-server architecture.

```text
User
  |
  v
React Frontend (Vite)
  |
  | HTTP requests through Axios
  | Authentication cookies
  v
Express REST API
  |
  | Authentication and authorization
  | Project, task, member, and activity logic
  v
Mongoose
  |
  v
MongoDB
```

The frontend manages the interface, navigation, and user interactions. The backend processes requests, enforces access rules, applies application logic, and accesses persistent data through Mongoose.

Dependency rules are part of the application's logic rather than merely a visual indicator in the interface.

## Project Structure

```text
FlowForge/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   ├── public/
│   ├── vite.config.js
│   └── package.json
├── .gitignore
└── README.md
```

## Local Setup

### Prerequisites

- Node.js and npm compatible with the project's Vite version.
- A MongoDB database, such as MongoDB Atlas.
- Git.

### 1. Clone the repository

```bash
git clone https://github.com/KanishkaSingh-18/FlowForge.git
cd FlowForge
```

### 2. Configure the backend

Create `backend/.env`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Replace the example values with your own configuration. Never commit real credentials or secret values.

### 3. Install and start the backend

```bash
cd backend
npm install
npm run dev
```

The backend uses port `5000` when no other port is configured.

### 4. Configure the frontend

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

This variable specifies the backend API base URL.

### 5. Install and start the frontend

Open a second terminal:

```bash
cd FlowForge/frontend
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

### 6. Build and lint the frontend

From the `frontend` directory:

```bash
npm run build
npm run lint
```

The production build is generated in `frontend/dist/`.

## Environment Variables

| Variable | Location | Purpose |
|---|---|---|
| `PORT` | Backend | Express server port |
| `MONGODB_URI` | Backend | MongoDB connection string |
| `JWT_SECRET` | Backend | Secret used to sign and verify JWTs |
| `CLIENT_URL` | Backend | Allowed frontend origin for CORS |
| `NODE_ENV` | Backend | Runtime environment |
| `VITE_API_URL` | Frontend | Backend API base URL |

**Security:** Variables prefixed with `VITE_` are exposed to the frontend bundle. Never place passwords, private keys, database credentials, or JWT secrets in frontend environment variables.

## Security

- Passwords are hashed using bcrypt.
- Authentication uses JWTs stored in HTTP-only cookies.
- Protected operations require appropriate authentication and authorization.
- Project membership and ownership are used to control access.
- Environment-specific credentials should be configured outside source control.

Production deployment must use appropriate CORS, cookie, and environment settings for the deployed domains.

## Deployment

The planned production architecture is:

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas

Deployment and live application links will be added after deployment and end-to-end verification.

- **GitHub repository:** https://github.com/KanishkaSingh-18/FlowForge
- **Live application:** Pending deployment
- **Demo video:** Pending recording

## Future Scope

Potential enhancements include notifications, integrations with development tools, and additional project analytics. These are not required for the current core workflows.

## Author

Developed as an end-term software project.
