import React, { useState, useEffect, useRef } from 'react';
import pomodoroService from '../services/pomodoroService';

const PomodoroTimer = ({ task, onSessionComplete }) => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [timerType, setTimerType] = useState('work');
  const [sessionId, setSessionId] = useState(null);
  const intervalRef = useRef(null);

  const timerSettings = {
    work: 25,
    shortBreak: 5,
    longBreak: 15
  };

  useEffect(() => {
    if (isActive && (minutes > 0 || seconds > 0)) {
      intervalRef.current = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            handleTimerComplete();
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isActive, minutes, seconds]);

  const handleTimerComplete = async () => {
    setIsActive(false);
    
    if (sessionId) {
      try {
        await pomodoroService.completeSession(sessionId);
        if (onSessionComplete) {
          onSessionComplete();
        }
      } catch (error) {
        console.error('Error completing session:', error);
      }
    }

    // Play notification sound (browser API)
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUR8NUqvm8bhdFgpJp+LyvmsfBDCF0/HWhzQGHm/A7+OaUh0MUqvm8bhdFwlHp+HyvmwfAy6Cz/PWijYHIXHD8OScVBwLUK3j8rtfGQhFpeDxvmwfAy6Cz/PWijYHIXHD8OScVBwLUK3j8rtfGQdDo97wv24gBS+Bz/PXizYHIXHD8OScVRsLUK3j8rteGQdDo97wv28gBS+Bz/PXizYHIXHD8OScVRsLUK3j8rteGQZCot3wv28gBS+Bz/PXizYHIXHD8OScVRsLT6zj8bteGQZCot3wv28gBS+Bz/PXizYHIXHD8OScVRsLT6zj8bteGQZCot3wv28gBS+Bz/PXizYHIXHD8OScVRsLT6zj8bteGQZCot3wv28gBS+Bz/PXizYHIXHD8OScVRsLT6zj8bteGQZCot3wv28gBS+Bz/PXizYHIXHD8OScVRsLT6zj8bteGQZCot3wv28gBS+Bz/PXizYHIXHD8OScVRsLT6zj8bteGQZCot3wv28gBS+Bz/PXizYHIXHD8OScVRsLT6zj8bteGQZCot3wv28gBS+Bz/PXizYHIXHD8OScVRsLT6zj8bteGQZCot3wv28gBS+Bz/PXizYHIXHD8OScVRsLT6zj8bteGQZCot3wv28gBS+Bz/PXizYHIXHD8OScVRsLT6zj8bteGQZCot3wv28gBS+Bz/PXizYHIXHD8OScVRsLT6zj8bteGQZCot3wv28gBS+Bz/PXizYHIXHD8OScVRsLT6zj8bteGQZCot3wv28gBS+Bz/PXizYHIXHD8OScVRsLT6zj8bteGQZCot3wv28gBS+Bz/PXizYHIXHD8OScVRsLT6zj8bteGQZCot3wv28gBS+Bz/PXizYHIXHD8OScVRsLT6zj8bteGQZCot3wv28gBS+Bz/PXizYHIXHD8OScVRsLT6zj8bteGQZCot3wv28gBS+Bz/PXizYHIXHD8OScVRsLT6zj8bteGQZCot3wv28gBS+Bz/PXizYHIXHD8OScVRsLT6zj8bteGQZCot3wv28gBS+Bz/PXizYHIXHD8OScVRsLT6zj8bteGQZCot3wv28gBS+Bz/PXizYHIXHD8OScVRsLT6zj8bteGQZCot3wv28gBS+Bz/PXizYHIXHD8OScVRsLT6zj8bteGQZCot3wv28gBS+Bz/PXizYHIXHD8OScVRsLT6zj8bteGQZCot3wv28gBS+Bz/PXizYHIXHD8OScVRsLT6zj8bteGQZCot3wv28gBS+Bz/PXizYHIXHD8OScVRsLT6zj8Q==');
    audio.play().catch(() => {});

    alert(`${timerType === 'work' ? 'Work' : 'Break'} session completed!`);
  };

  const startTimer = async () => {
    setIsActive(true);
    
    if (!sessionId) {
      try {
        const session = await pomodoroService.createSession({
          duration: timerSettings[timerType],
          type: timerType,
          task: task?._id,
          startTime: new Date()
        });
        setSessionId(session._id);
      } catch (error) {
        console.error('Error creating session:', error);
      }
    }
  };

  const pauseTimer = () => {
    setIsActive(false);
  };

  const resetTimer = () => {
    setIsActive(false);
    setMinutes(timerSettings[timerType]);
    setSeconds(0);
    setSessionId(null);
  };

  const changeTimerType = (type) => {
    setTimerType(type);
    setMinutes(timerSettings[type]);
    setSeconds(0);
    setIsActive(false);
    setSessionId(null);
  };

  return (
    <div className="timer-container">
      <h2>{task ? task.title : 'Pomodoro Timer'}</h2>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
        <button 
          className={`btn ${timerType === 'work' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => changeTimerType('work')}
        >
          Work
        </button>
        <button 
          className={`btn ${timerType === 'shortBreak' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => changeTimerType('shortBreak')}
        >
          Short Break
        </button>
        <button 
          className={`btn ${timerType === 'longBreak' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => changeTimerType('longBreak')}
        >
          Long Break
        </button>
      </div>
      <div className="timer-display">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
      <div className="timer-controls">
        {!isActive ? (
          <button className="btn btn-success" onClick={startTimer}>
            Start
          </button>
        ) : (
          <button className="btn btn-secondary" onClick={pauseTimer}>
            Pause
          </button>
        )}
        <button className="btn btn-danger" onClick={resetTimer}>
          Reset
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
