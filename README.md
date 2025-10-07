# MERN Stack Pomodoro TimeBlock Application

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Available-brightgreen)](http://localhost:5173) [![Backend API](https://img.shields.io/badge/API-Running-blue)](http://localhost:5000) [![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5)](https://linkedin.com/in/your-profile) [![Email](https://img.shields.io/badge/Email-Contact-red)](mailto:your.email@example.com)

## Project Overview

A production-ready productivity application that combines the Pomodoro technique with time-blocking methodology. Built with modern MERN stack architecture, featuring real-time synchronization, comprehensive analytics, and secure authentication.

**Live Application:** [Demo Link](http://localhost:5173) | **API Documentation:** [Backend API](http://localhost:5000/api)

### Key Technical Achievements
- **Full-Stack Implementation:** Complete MERN application with TypeScript integration
- **Real-Time Features:** WebSocket integration for synchronized timer sessions
- **Secure Architecture:** JWT authentication with bcrypt password hashing
- **Database Design:** Optimized MongoDB schemas with Mongoose ODM
- **Responsive Design:** Mobile-first approach with modern CSS3 and Tailwind CSS
- **Production Ready:** Configured for Vercel deployment with environment management

## About This Project

This application addresses the common productivity challenge of time management by combining two proven methodologies: the Pomodoro Technique and time-blocking. The solution provides users with a comprehensive platform to plan, execute, and analyze their work sessions.

**Problem Solved:** Fragmented productivity tools that don't integrate task management with time tracking
**Solution Approach:** Unified platform combining task organization, timer functionality, and analytics
**Impact:** Streamlined workflow that increases focus and provides actionable productivity insights

## Tech Stack & Architecture

### Frontend
- **React 18.2.0** with TypeScript - Component-based UI architecture
- **Vite** - Fast build tool and development server
- **React Router 6.15.0** - Client-side routing and navigation
- **Zustand** - Lightweight state management
- **Tailwind CSS** - Utility-first styling framework
- **Axios** - HTTP client with interceptors for API communication

### Backend
- **Node.js** with Express.js 4.18.2 - RESTful API server
- **TypeScript** - Type-safe server-side development
- **MongoDB Atlas** - Cloud database with Mongoose 7.5.0 ODM
- **JWT** - Stateless authentication with refresh tokens
- **bcryptjs** - Secure password hashing
- **Nodemon** - Development server with hot reloading

### Development & Deployment
- **Concurrently** - Simultaneous frontend/backend development
- **ESLint & Prettier** - Code quality and formatting
- **Vercel** - Frontend deployment platform
- **MongoDB Atlas** - Production database hosting

## Core Features

### Timer & Session Management
- Configurable Pomodoro intervals (25min work, 5min short break, 15min long break)
- Real-time session tracking with automatic progression
- Session history and completion statistics

### Task Management System
- CRUD operations for tasks with categories and priorities
- Task categorization (Work, Personal, Study, Health, Other)
- Priority levels (Low, Medium, High) with visual indicators
- Progress tracking with estimated vs. completed Pomodoros

### Analytics Dashboard
- Comprehensive productivity metrics and visualizations
- Category-based performance analysis
- Daily, weekly, and monthly productivity trends
- Session completion rates and time distribution

### Security & Authentication
- Secure user registration and login system
- JWT-based authentication with protected routes
- Password validation and secure storage
- Session management and automatic logout

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account or local MongoDB installation
- Git for version control

### Quick Start

1. **Clone and Install**
```bash
git clone https://github.com/StrayDogSyn/MERN-Stack-Pomodoro-TimeBlock-Application.git
cd MERN-Stack-Pomodoro-TimeBlock-Application
npm install
```

2. **Environment Configuration**
Create `.env.local` in the root directory:
```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secure_jwt_secret
NODE_ENV=development
```

3. **Start Development Servers**
```bash
npm run dev
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration with validation
- `POST /api/auth/login` - User authentication with JWT token
- `GET /api/auth/me` - Get current user profile (protected)

### Task Management
- `GET /api/tasks` - Retrieve all user tasks with filtering
- `POST /api/tasks` - Create new task with validation
- `PUT /api/tasks/:id` - Update existing task
- `DELETE /api/tasks/:id` - Remove task and associated sessions

### Session Tracking
- `GET /api/pomodoro` - Get session history with analytics
- `POST /api/pomodoro` - Create new Pomodoro session
- `PUT /api/pomodoro/:id/complete` - Mark session as completed
- `GET /api/pomodoro/analytics` - Retrieve productivity analytics

## Database Schema

### Optimized Data Models
- **User Model:** Secure authentication with encrypted passwords
- **Task Model:** Comprehensive task management with relationships
- **Session Model:** Detailed session tracking with timestamps
- **TimeBlock Model:** Calendar integration for time planning

## Usage Guide

1. **Account Setup:** Register with email and secure password
2. **Task Creation:** Add tasks with categories, priorities, and time estimates
3. **Session Management:** Start Pomodoro timer and track completion
4. **Progress Monitoring:** View analytics dashboard for productivity insights
5. **Time Planning:** Use time-blocking features for schedule optimization

## Contributing

This project welcomes contributions. Please review the codebase structure and follow the established patterns for TypeScript, React components, and API design.

## Technical Contact

**Developer:** Full-stack MERN development with focus on user experience and performance optimization

[![Portfolio](https://img.shields.io/badge/Portfolio-View%20Projects-orange)](https://your-portfolio.com) [![GitHub](https://img.shields.io/badge/GitHub-Follow-black)](https://github.com/your-username) [![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5)](https://linkedin.com/in/your-profile)

---

*Built with modern web technologies and best practices for scalable, maintainable code.*
