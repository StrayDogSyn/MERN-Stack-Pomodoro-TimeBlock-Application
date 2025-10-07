import api from './api';

const pomodoroService = {
  getSessions: async () => {
    const response = await api.get('/pomodoro');
    return response.data;
  },

  createSession: async (sessionData) => {
    const response = await api.post('/pomodoro', sessionData);
    return response.data;
  },

  completeSession: async (id) => {
    const response = await api.put(`/pomodoro/${id}/complete`);
    return response.data;
  },

  getAnalytics: async (startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get('/pomodoro/analytics', { params });
    return response.data;
  }
};

export default pomodoroService;
