# MeetMates

MeetMates is a full-stack sports community app. Users can post community updates, like and comment on posts, and join activities. The backend is built with NestJS + TypeORM (SQLite by default); the frontend uses React + Vite + Tailwind.

## Project Structure
```
backend/    NestJS + SQLite
frontend/   React + Vite + Tailwind
```

## Requirements
- Node.js 18+
- npm
- SQLite (bundled for local dev)

## Quick Start (Development)
### 1. Install dependencies
- Backend
```bash
cd backend
npm install
```
- Frontend
```bash
cd frontend
npm install
```

### 2. Run backend (NestJS)
```bash
cd backend
npm run dev
```
Default API: http://localhost:3000

### 3. Run frontend (Vite)
```bash
cd frontend
npm run dev
```
App URL: http://localhost:5173

## Login（example accounts）
Administrator account:
| username   | email                        | password |
|------------|------------------------------|----------|
| Admin      | abc@abc.com                  | 123456   |

User account:
| username   | email                        | password |
|------------|------------------------------|----------|
| GuGuGaGa   | demo@example.com             | 123456   |
| ShikaYoru  | bcd@bcd.com                  | 123456   |
| 悲伤虾滑蛋  | 123456789@smail.nju.edu.cn   | 123456   |
| 达万影城🎬  | dawanyingcheng@example.com   | 123456   |

