import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="container">
      <div style={{ 
        textAlign: 'center', 
        color: 'white', 
        padding: '4rem 2rem',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          🍅 Pomodoro TimeBlock
        </h1>
        <p style={{ fontSize: '1.5rem', marginBottom: '2rem', opacity: 0.9 }}>
          Boost Your Productivity with Time-Blocking and Pomodoro Technique
        </p>
        
        <div className="card" style={{ marginTop: '3rem', textAlign: 'left' }}>
          <h2 style={{ color: '#667eea', marginBottom: '1.5rem' }}>Key Features</h2>
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div>
              <h3 style={{ color: '#333', marginBottom: '0.5rem' }}>⏰ Real-time Pomodoro Timer</h3>
              <p>Stay focused with customizable work and break intervals synchronized in real-time</p>
            </div>
            <div>
              <h3 style={{ color: '#333', marginBottom: '0.5rem' }}>📋 Task Management</h3>
              <p>Organize tasks with categories, priorities, and track completed pomodoros</p>
            </div>
            <div>
              <h3 style={{ color: '#333', marginBottom: '0.5rem' }}>📊 Productivity Analytics</h3>
              <p>Visualize your productivity with detailed analytics and insights</p>
            </div>
            <div>
              <h3 style={{ color: '#333', marginBottom: '0.5rem' }}>🔒 Secure Authentication</h3>
              <p>Your data is protected with JWT-based authentication</p>
            </div>
            <div>
              <h3 style={{ color: '#333', marginBottom: '0.5rem' }}>📱 Responsive Design</h3>
              <p>Access your productivity tools on any device, anywhere</p>
            </div>
          </div>
        </div>

        {!user && (
          <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/register">
              <button className="btn btn-primary" style={{ fontSize: '1.2rem' }}>
                Get Started
              </button>
            </Link>
            <Link to="/login">
              <button className="btn btn-secondary" style={{ fontSize: '1.2rem' }}>
                Login
              </button>
            </Link>
          </div>
        )}

        {user && (
          <div style={{ marginTop: '3rem' }}>
            <Link to="/dashboard">
              <button className="btn btn-primary" style={{ fontSize: '1.2rem' }}>
                Go to Dashboard
              </button>
            </Link>
          </div>
        )}

        <div className="card" style={{ marginTop: '3rem' }}>
          <h3 style={{ color: '#667eea', marginBottom: '1rem' }}>Tech Stack</h3>
          <p><strong>Frontend:</strong> React, React Router, Axios</p>
          <p><strong>Backend:</strong> Node.js, Express.js, MongoDB, Mongoose</p>
          <p><strong>Authentication:</strong> JWT (JSON Web Tokens)</p>
          <p><strong>Features:</strong> Real-time timer sync, RESTful API, Responsive UI</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
