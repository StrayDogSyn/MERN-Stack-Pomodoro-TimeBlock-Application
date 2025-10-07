import api from './api';

const timeBlockService = {
  getTimeBlocks: async () => {
    const response = await api.get('/timeblocks');
    return response.data;
  },

  createTimeBlock: async (timeBlockData) => {
    const response = await api.post('/timeblocks', timeBlockData);
    return response.data;
  },

  updateTimeBlock: async (id, timeBlockData) => {
    const response = await api.put(`/timeblocks/${id}`, timeBlockData);
    return response.data;
  },

  deleteTimeBlock: async (id) => {
    const response = await api.delete(`/timeblocks/${id}`);
    return response.data;
  }
};

export default timeBlockService;
