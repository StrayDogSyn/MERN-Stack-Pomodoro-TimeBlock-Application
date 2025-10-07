import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <div className="navbar">
      <div className="navbar-content">
        <h1>🍅 Pomodoro TimeBlock</h1>
        <nav>
          {user ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/analytics">Analytics</Link>
              <span style={{ color: '#667eea', fontWeight: 'bold' }}>{user.name}</span>
              <button onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/">Home</Link>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </div>
    </div>
  );
};

export default Navbar;
