import React from 'react';

const TaskItem = ({ task, onEdit, onDelete, onSelect }) => {
  const getCategoryClass = (category) => {
    return `category-badge category-${category}`;
  };

  const getPriorityClass = (priority) => {
    return `priority-${priority}`;
  };

  return (
    <div className="task-item">
      <div className="task-info">
        <h3 className={task.status === 'completed' ? 'status-completed' : ''}>
          {task.title}
        </h3>
        <p>{task.description}</p>
        <div className="task-meta">
          <span className={getCategoryClass(task.category)}>
            {task.category}
          </span>
          <span className={getPriorityClass(task.priority)}>
            Priority: {task.priority}
          </span>
          <span>
            Pomodoros: {task.completedPomodoros}/{task.estimatedPomodoros}
          </span>
          <span>Status: {task.status}</span>
        </div>
      </div>
      <div className="task-actions">
        <button className="btn btn-primary" onClick={() => onSelect(task)}>
          Select
        </button>
        <button className="btn btn-secondary" onClick={() => onEdit(task)}>
          Edit
        </button>
        <button className="btn btn-danger" onClick={() => onDelete(task._id)}>
          Delete
        </button>
      </div>
    </div>
  );
};

export default TaskItem;
