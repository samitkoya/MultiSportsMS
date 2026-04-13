---
title: Multi-Sports Management System (MSMS)
emoji: 🏆
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---

# Multi-Sports Management System (MSMS) 🏆

[![Hugging Face Spaces](https://img.shields.io/badge/%F0%9F%A4%97%20Hugging%20Face-Spaces-blue)](https://huggingface.co/spaces/samitkoya/MultiSportsMS)

The **Multi-Sports Management System (MSMS)** is a comprehensive, database-driven application designed to streamline the management of sporting events, teams, players, and performance analytics. Developed as a high-performance relational database project, it demonstrates advanced SQL techniques, dynamic rating engines, and a premium modern web architecture.

## 🌟 Key Features

### 🏢 Core Management
- **Sports Support**: Native support for **Cricket, Football, Tennis, and Badminton**, each with its own rule sets and scoring metrics.
- **Venue Management**: Track locations, seating capacity, and surface types for various sporting facilities.
- **Staff & Coaching**: Manage coaching staff with specialized skill sets and experience levels.
- **Team Administration**: Organize teams by sport, with dedicated home venues and assigned coaches.
- **Player Profiles**: Comprehensive player rosters with jersey numbers, positions, and status tracking.
- **Multi-Sport Support**: Athletes can participate in multiple sports simultaneously (using a dedicated `player_sports` junction table) with independent statistics for each category.
- **Advanced Navigation**: Interactive sorting and filtering across pages (Venues, Matches, Tournaments, Teams) for seamless data exploration.

### ⚔️ Match & Event Tracking
- **Event Orchestration**: Manage Tournaments, Leagues, Friendlies, and Championships with distinct formats (Knockout/Round-robin).
- **Match Scheduling**: Plan matches with real-time status updates (Scheduled, Ongoing, Completed, Postponed).
- **Live Event Logging**: Granular tracking of match events such as **Goals, Runs, Wickets, and Points**.
- **Dynamic Rosters**: Manage per-match starting lineups and batting orders.
- **Cross-Origin Assets**: Specialized support for external image URLs via optimized referrer policies, ensuring avatars load flawlessly in iframed environments like Hugging Face.

### 📊 Advanced Analytics
- **Team Standings**: Real-time league tables with Wins, Losses, Draws, and Points calculations.
- **Dynamic Player Ratings**: Automatic performance ratings out of 10, calculated instantly for all sports based on real-time match events (goals, runs, points, wickets).
- **Comprehensive Statistics**: Career-wide performance metrics with dedicated tabs for multi-sport athletes.
- **Top Scorers**: Automatic leaderboards filtered by sport.
- **Upcoming Matches**: A chronological view of all scheduled fixtures with venue details.

---

## 🛠️ Technology Stack

- **Frontend**: [React 18](https://reactjs.org/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Data & Visualization**: [React Query](https://tanstack.com/query) + [Recharts](https://recharts.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Backend**: [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)
- **Database**: [sql.js](https://sql.js.org/) (SQLite via WebAssembly)
- **Architecture**: REST API + 3NF Normalized Relational Database

---

## 💾 Database Architecture

MSMS is powered by a robust 3NF relational schema consisting of **15 Tables**, **5 Views**, and **4 Triggers**.

- **Triggers**: Automated data integrity and statistics updates. For example, logging a `goal` event automatically increments the player's career goals and the team's score.
- **Views**: Complex analytical queries and **Dynamic Rating Formulas** are offloaded to stored database views for maximum performance and a "Live" feel.
- **Junction Tables**: Advanced relationship management for multi-sport athletes and multi-team memberships (e.g., `player_sports`, `player_team_memberships`).
- **Normalization**: Ensures zero data redundancy and maintains referential integrity using `ON DELETE CASCADE` and `ON DELETE SET NULL` constraints.

---

## 🚀 Quick Start

### Local Setup
1. Clone the repository.
2. Run `npm install` in the root directory.
3. Build the frontend: `npm run build:frontend`.
4. Start the server: `npm start`.

## Hugging Face Deployment

This project is optimized for **Hugging Face Spaces** using the Docker SDK and supports persistent data storage.

### Deployment Matrix

| Environment | Platform | Deployment Method | Default Port | Storage |
| :--- | :--- | :--- | :--- | :--- |
| **Local Development** | Node.js | `npm start` | `3000` | Local `msms.db` |
| **Docker** | Container | `docker build -t msms .` | `7860` | Ephemeral (Container) |
| **HF Spaces** | Cloud | Git Push (Docker SDK) | `7860` | **Persistent** (via `/data`) |

#### Hugging Face Steps:
1. Create a new Space on Hugging Face.
2. Select **Docker** as the SDK.
3. Enable **Persistent Storage** in the Space settings (to preserve `msms.db` across restarts).
4. Push the repository; the project automatically uses `/data` for persistence when detected.

---

## 📄 License
This project was developed for academic purposes as part of a DBMS course.
