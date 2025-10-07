# MERN Stack Pomodoro TimeBlock Application

A fully functional productivity application combining the Pomodoro technique with time-blocking methodology to help users manage their time effectively and boost productivity.

## 🚀 Features

- **Real-time Pomodoro Timer**: Synchronized timer with work (25min), short break (5min), and long break (15min) intervals
- **Task Management**: Create, update, delete, and organize tasks with categories and priorities
- **Task Categorization**: Organize tasks by category (Work, Personal, Study, Health, Other)
- **Priority Levels**: Set task priorities (Low, Medium, High)
- **Productivity Analytics Dashboard**: Visualize your productivity with detailed statistics
  - Total sessions and work hours
  - Category-based analytics
  - Daily productivity trends
- **JWT Authentication**: Secure user authentication and authorization
- **Responsive UI**: Mobile-friendly design that works on all devices
- **Session Tracking**: Automatically track completed Pomodoro sessions

## 🛠️ Tech Stack

### Frontend
- **React** 18.2.0 - UI library
- **React Router** 6.15.0 - Client-side routing
- **Axios** - HTTP client for API requests
- **CSS3** - Responsive styling with modern design

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** 4.18.2 - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** 7.5.0 - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing

## 📋 Prerequisites

Before running this application, make sure you have the following installed:
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## 🔧 Installation

### 1. Clone the repository
```bash
git clone https://github.com/StrayDogSyn/MERN-Stack-Pomodoro-TimeBlock-Application.git
cd MERN-Stack-Pomodoro-TimeBlock-Application
```

### 2. Set up the Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:
```env
MONGODB_URI=mongodb://localhost:27017/pomodoro-timeblock
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
NODE_ENV=development
```

### 3. Set up the Frontend

```bash
cd ../frontend
npm install
```

### 4. Start MongoDB

Make sure MongoDB is running on your system:
```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Linux
sudo systemctl start mongod

# On Windows
net start MongoDB
```

### 5. Run the Application

**Backend** (from the backend directory):
```bash
npm run dev
```
The backend server will start on `http://localhost:5000`

**Frontend** (from the frontend directory, in a new terminal):
```bash
npm start
```
The frontend will start on `http://localhost:3000`

## 📱 Usage

1. **Register**: Create a new account
2. **Login**: Sign in with your credentials
3. **Create Tasks**: Add tasks with categories, priorities, and estimated Pomodoros
4. **Start Timer**: Select a task and start the Pomodoro timer
5. **Track Progress**: Monitor your completed Pomodoros for each task
6. **View Analytics**: Check your productivity statistics in the Analytics dashboard

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Tasks
- `GET /api/tasks` - Get all user tasks (protected)
- `GET /api/tasks/:id` - Get single task (protected)
- `POST /api/tasks` - Create new task (protected)
- `PUT /api/tasks/:id` - Update task (protected)
- `DELETE /api/tasks/:id` - Delete task (protected)

### Pomodoro Sessions
- `GET /api/pomodoro` - Get all sessions (protected)
- `POST /api/pomodoro` - Create new session (protected)
- `PUT /api/pomodoro/:id/complete` - Complete session (protected)
- `GET /api/pomodoro/analytics` - Get analytics data (protected)

### Time Blocks
- `GET /api/timeblocks` - Get all time blocks (protected)
- `POST /api/timeblocks` - Create time block (protected)
- `PUT /api/timeblocks/:id` - Update time block (protected)
- `DELETE /api/timeblocks/:id` - Delete time block (protected)

## 🗄️ Database Schema

### User Model
- name: String
- email: String (unique)
- password: String (hashed)
- createdAt: Date

### Task Model
- user: ObjectId (ref: User)
- title: String
- description: String
- category: Enum (work, personal, study, health, other)
- priority: Enum (low, medium, high)
- status: Enum (todo, in-progress, completed)
- estimatedPomodoros: Number
- completedPomodoros: Number
- dueDate: Date
- createdAt: Date
- updatedAt: Date

### PomodoroSession Model
- user: ObjectId (ref: User)
- task: ObjectId (ref: Task)
- duration: Number
- type: Enum (work, shortBreak, longBreak)
- completed: Boolean
- startTime: Date
- endTime: Date
- createdAt: Date

### TimeBlock Model
- user: ObjectId (ref: User)
- task: ObjectId (ref: Task)
- startTime: Date
- endTime: Date
- title: String
- description: String
- completed: Boolean
- createdAt: Date

## 🎨 Screenshots

The application features:
- Modern gradient background design
- Intuitive card-based layout
- Responsive navigation bar
- Clean and minimalist timer interface
- Interactive task management system
- Visual analytics dashboard with statistics

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the ISC License.

## 👤 Author

Full-stack development from database schema to responsive UI implementation.

## 🙏 Acknowledgments

- Pomodoro Technique® by Francesco Cirillo
- MongoDB for the excellent documentation
- React community for amazing tools and libraries
