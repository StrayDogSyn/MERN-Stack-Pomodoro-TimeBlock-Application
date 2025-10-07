import React, { useState, useEffect } from 'react';
import taskService from '../services/taskService';
import PomodoroTimer from '../components/PomodoroTimer';
import TaskItem from '../components/TaskItem';
import TaskForm from '../components/TaskForm';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await taskService.getTasks();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskService.deleteTask(id);
        fetchTasks();
        if (selectedTask && selectedTask._id === id) {
          setSelectedTask(null);
        }
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleTaskFormSubmit = () => {
    setShowTaskForm(false);
    setEditingTask(null);
    fetchTasks();
  };

  const handleTaskFormCancel = () => {
    setShowTaskForm(false);
    setEditingTask(null);
  };

  const handleSelectTask = (task) => {
    setSelectedTask(task);
  };

  const handleSessionComplete = () => {
    fetchTasks();
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <h2 style={{ color: 'white', marginBottom: '2rem' }}>Dashboard</h2>
      
      {!showTaskForm ? (
        <>
          <PomodoroTimer task={selectedTask} onSessionComplete={handleSessionComplete} />
          
          <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowTaskForm(true)}
              style={{ marginBottom: '1rem' }}
            >
              Create New Task
            </button>
          </div>

          <div className="card">
            <h3>Your Tasks</h3>
            {tasks.length === 0 ? (
              <p>No tasks yet. Create your first task to get started!</p>
            ) : (
              <div className="task-list">
                {tasks.map((task) => (
                  <TaskItem
                    key={task._id}
                    task={task}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onSelect={handleSelectTask}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <TaskForm
          task={editingTask}
          onSubmit={handleTaskFormSubmit}
          onCancel={handleTaskFormCancel}
        />
      )}
    </div>
  );
};

export default Dashboard;
