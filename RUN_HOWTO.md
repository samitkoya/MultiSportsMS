# How to Run the Multi-Sports Management System (MSMS) 🚀

This guide provides step-by-step instructions to set up and run the Multi-Sports Management System from scratch on your local machine.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18.0.0 or higher) - [Download Node.js](https://nodejs.org/)
- **npm** (comes with Node.js) or **bun** (if preferred)
- **Git** (for cloning the repository)

---

## 🛠️ Step 1: Installation & dependencies

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/MultiSportsMS.git
cd MultiSportsMS
```

### 2. Install Root dependencies
The root directory handles the backend and shared tasks.
```bash
npm install
```

### 3. Install Frontend Dependencies
```bash
cd frontend2
npm install
cd ..
```

---

## 📊 Step 2: Database Setup

The project uses **sql.js** (SQLite in WebAssembly), so no external database server (like MySQL or PostgreSQL) is required.
To initialize the database with schema and seed data, run:
```bash
npm run reset-db
```
This will create a `backend/database/msms.db` file.

---

## 🏗️ Step 3: Build the Frontend (Crucial for Running)

The backend server is configured to serve the **production build** of the React/Vite frontend. You must build it before starting the server. 

> **Important:** Ensure you are in the **Root Directory** (`MultiSportsMS/`), NOT the `frontend2/` directory, before running these commands.

```bash
# Run this from the root directory
npm run build:frontend
```

---

## 🚀 Step 4: Run the Application

Now you can start the combined backend-frontend server. Again, make sure you are in the **Root Directory**.

```bash
# Run this from the root directory
npm start
```
By default, the application will be available at: **[http://localhost:3000](http://localhost:3000)**

---

## 🧑‍💻 Development Mode

If you are developing and want hot-reloading for both backend and frontend:

### 1. Start the Backend
```bash
npm run dev
```

### 2. Start the Frontend (Vite Dev Server)
In a new terminal:
```bash
cd frontend2
npm run dev
```
Wait for the dev server to start (usually at [http://localhost:5173](http://localhost:5173)). The frontend will communicate with the backend via the proxy defined in `vite.config.ts`.

---

## ❓ Troubleshooting

- **Port 3000 occupied**: If you receive an `EADDRINUSE` error, ensure no other service is running on port 3000. You can change the port in `backend/server.js` or set a `PORT` environment variable.
- **Missing Build**: If you see a "File Not Found" error when accessing the app, make sure you ran `npm run build:frontend` successfully.
- **Database Errors**: If the database file is corrupted, run `npm run reset-db` to start fresh.

---

## 🚢 Deploying to Hugging Face Spaces

1. Create a new Space on [Hugging Face](https://huggingface.co/spaces).
2. Choose **Docker** as the SDK.
3. Push the entire project repository.
4. Hugging Face will automatically use the included `Dockerfile` to build and serve the application.
