import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, MapPin, Edit, Trash2 } from 'lucide-react';
import { useTimeBlockStore } from '../store/timeBlockStore';
import { TimeBlockStatus } from '../types';
import { TimeBlock } from '../store/timeBlockStore';
import { toast } from 'react-hot-toast';

const Calendar: React.FC = () => {
  const {
    timeBlocks,
    loading,
    selectedDate,
    viewMode,
    fetchTimeBlocks,
    createTimeBlock,
    updateTimeBlock,
    deleteTimeBlock,
    setSelectedDate,
    setViewMode,
    getTimeBlocksByDate,
    getTimeBlocksByWeek,
    getCurrentTimeBlocks,
    getUpcomingTimeBlocks,
    getConflictingTimeBlocks
  } = useTimeBlockStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTimeBlock, setEditingTimeBlock] = useState<TimeBlock | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ date: Date; hour: number } | null>(null);

  const [newTimeBlock, setNewTimeBlock] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    color: '#8B5CF6'
  });

  useEffect(() => {
    fetchTimeBlocks();
  }, [fetchTimeBlocks]);

  const currentDate = new Date();
  const displayDate = selectedDate || currentDate;

  // Calendar navigation
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(displayDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Get calendar data based on view mode
  const getCalendarData = () => {
    if (viewMode === 'week') {
      return getWeekData();
    } else {
      return getMonthData();
    }
  };

  const getWeekData = () => {
    const startOfWeek = new Date(displayDate);
    startOfWeek.setDate(displayDate.getDate() - displayDate.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const getMonthData = () => {
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const totalDays = 42; // 6 weeks * 7 days
    
    for (let i = 0; i < totalDays; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const handleCreateTimeBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTimeBlock.title.trim() || !newTimeBlock.startTime || !newTimeBlock.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    const startDateTime = new Date(`${selectedTimeSlot?.date.toISOString().split('T')[0]}T${newTimeBlock.startTime}`);
    const endDateTime = new Date(`${selectedTimeSlot?.date.toISOString().split('T')[0]}T${newTimeBlock.endTime}`);

    if (endDateTime <= startDateTime) {
      toast.error('End time must be after start time');
      return;
    }

    try {
      await createTimeBlock({
        ...newTimeBlock,
        startTime: startDateTime,
        endTime: endDateTime
      });
      setShowCreateModal(false);
      setSelectedTimeSlot(null);
      setNewTimeBlock({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        location: '',
        color: '#8B5CF6'
      });
      toast.success('Time block created successfully');
    } catch (error) {
      toast.error('Failed to create time block');
    }
  };

  const handleUpdateTimeBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTimeBlock) return;

    try {
      await updateTimeBlock(editingTimeBlock._id, {
        title: editingTimeBlock.title,
        description: editingTimeBlock.description,
        startTime: editingTimeBlock.startTime,
        endTime: editingTimeBlock.endTime,
        location: editingTimeBlock.location,
        color: editingTimeBlock.color
      });
      setShowEditModal(false);
      setEditingTimeBlock(null);
      toast.success('Time block updated successfully');
    } catch (error) {
      toast.error('Failed to update time block');
    }
  };

  const handleDeleteTimeBlock = async (timeBlockId: string) => {
    if (window.confirm('Are you sure you want to delete this time block?')) {
      try {
        await deleteTimeBlock(timeBlockId);
        toast.success('Time block deleted successfully');
      } catch (error) {
        toast.error('Failed to delete time block');
      }
    }
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    setSelectedTimeSlot({ date, hour });
    setNewTimeBlock({
      ...newTimeBlock,
      startTime: `${hour.toString().padStart(2, '0')}:00`,
      endTime: `${(hour + 1).toString().padStart(2, '0')}:00`
    });
    setShowCreateModal(true);
  };

  const getTimeBlocksForDate = (date: Date) => {
    return getTimeBlocksByDate(date);
  };

  const getStatusColor = (status: TimeBlockStatus) => {
    switch (status) {
      case TimeBlockStatus.COMPLETED:
        return 'bg-green-500';
      case TimeBlockStatus.IN_PROGRESS:
        return 'bg-blue-500';
      case TimeBlockStatus.CANCELLED:
        return 'bg-red-500';
      default:
        return 'bg-purple-500';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameMonth = (date: Date) => {
    return date.getMonth() === displayDate.getMonth();
  };

  if (loading && timeBlocks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Calendar</h1>
          <p className="text-gray-400">Schedule and manage your time blocks</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Add Time Block
        </button>
      </div>

      {/* Calendar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-lg font-semibold text-white min-w-[200px] text-center">
              {viewMode === 'week' 
                ? `Week of ${displayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                : displayDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              }
            </h2>
            <button
              onClick={() => navigateDate('next')}
              className="p-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={goToToday}
            className="px-3 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors text-sm"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              viewMode === 'month'
                ? 'bg-purple-500 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              viewMode === 'week'
                ? 'bg-purple-500 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Week
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      {viewMode === 'month' ? (
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
          {/* Month View */}
          <div className="grid grid-cols-7 gap-px bg-white/5">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="bg-white/10 p-3 text-center text-sm font-medium text-gray-300">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-white/5">
            {getCalendarData().map((date, index) => {
              const dayTimeBlocks = getTimeBlocksForDate(date);
              return (
                <div
                  key={index}
                  className={`bg-white/5 p-2 min-h-[120px] ${
                    !isSameMonth(date) ? 'opacity-50' : ''
                  } ${isToday(date) ? 'bg-purple-500/20' : ''}`}
                >
                  <div className={`text-sm font-medium mb-2 ${
                    isToday(date) ? 'text-purple-300' : 'text-white'
                  }`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayTimeBlocks.slice(0, 3).map((timeBlock) => (
                      <div
                        key={timeBlock._id}
                        className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80"
                        style={{ backgroundColor: timeBlock.color || '#8B5CF6' }}
                        onClick={() => {
                          setEditingTimeBlock(timeBlock);
                          setShowEditModal(true);
                        }}
                      >
                        {timeBlock.title}
                      </div>
                    ))}
                    {dayTimeBlocks.length > 3 && (
                      <div className="text-xs text-gray-400">
                        +{dayTimeBlocks.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
          {/* Week View */}
          <div className="grid grid-cols-8 gap-px bg-white/5">
            <div className="bg-white/10 p-3"></div>
            {getCalendarData().map((date, index) => (
              <div key={index} className="bg-white/10 p-3 text-center">
                <div className="text-sm font-medium text-gray-300">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={`text-lg font-semibold ${
                  isToday(date) ? 'text-purple-300' : 'text-white'
                }`}>
                  {date.getDate()}
                </div>
              </div>
            ))}
          </div>
          
          {/* Time slots */}
          <div className="max-h-[600px] overflow-y-auto">
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="grid grid-cols-8 gap-px bg-white/5 border-t border-white/10">
                <div className="bg-white/5 p-2 text-right text-sm text-gray-400">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </div>
                {getCalendarData().map((date, dayIndex) => {
                  const dayTimeBlocks = getTimeBlocksForDate(date).filter(tb => {
                    const startHour = new Date(tb.startTime).getHours();
                    const endHour = new Date(tb.endTime).getHours();
                    return hour >= startHour && hour < endHour;
                  });
                  
                  return (
                    <div
                      key={dayIndex}
                      className="bg-white/5 p-1 min-h-[60px] cursor-pointer hover:bg-white/10 transition-colors relative"
                      onClick={() => handleTimeSlotClick(date, hour)}
                    >
                      {dayTimeBlocks.map((timeBlock) => (
                        <div
                          key={timeBlock._id}
                          className="absolute inset-1 p-1 rounded text-xs text-white cursor-pointer hover:opacity-80"
                          style={{ backgroundColor: timeBlock.color || '#8B5CF6' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTimeBlock(timeBlock);
                            setShowEditModal(true);
                          }}
                        >
                          <div className="font-medium truncate">{timeBlock.title}</div>
                          <div className="text-xs opacity-75">
                            {formatTime(new Date(timeBlock.startTime))} - {formatTime(new Date(timeBlock.endTime))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Time Block Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Create Time Block</h2>
            <form onSubmit={handleCreateTimeBlock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  value={newTimeBlock.title}
                  onChange={(e) => setNewTimeBlock({ ...newTimeBlock, title: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter time block title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={newTimeBlock.description}
                  onChange={(e) => setNewTimeBlock({ ...newTimeBlock, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={newTimeBlock.startTime}
                    onChange={(e) => setNewTimeBlock({ ...newTimeBlock, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">End Time</label>
                  <input
                    type="time"
                    value={newTimeBlock.endTime}
                    onChange={(e) => setNewTimeBlock({ ...newTimeBlock, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                <input
                  type="text"
                  value={newTimeBlock.location}
                  onChange={(e) => setNewTimeBlock({ ...newTimeBlock, location: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter location (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                <div className="flex gap-2">
                  {['#8B5CF6', '#EF4444', '#10B981', '#F59E0B', '#3B82F6', '#EC4899'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewTimeBlock({ ...newTimeBlock, color })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newTimeBlock.color === color ? 'border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedTimeSlot(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Time Block Modal */}
      {showEditModal && editingTimeBlock && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Edit Time Block</h2>
              <button
                onClick={() => handleDeleteTimeBlock(editingTimeBlock._id)}
                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateTimeBlock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  value={editingTimeBlock.title}
                  onChange={(e) => setEditingTimeBlock({ ...editingTimeBlock, title: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={editingTimeBlock.description || ''}
                  onChange={(e) => setEditingTimeBlock({ ...editingTimeBlock, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={new Date(editingTimeBlock.startTime).toTimeString().slice(0, 5)}
                    onChange={(e) => {
                      const date = new Date(editingTimeBlock.startTime);
                      const [hours, minutes] = e.target.value.split(':');
                      date.setHours(parseInt(hours), parseInt(minutes));
                      setEditingTimeBlock({ ...editingTimeBlock, startTime: date });
                    }}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">End Time</label>
                  <input
                    type="time"
                    value={new Date(editingTimeBlock.endTime).toTimeString().slice(0, 5)}
                    onChange={(e) => {
                      const date = new Date(editingTimeBlock.endTime);
                      const [hours, minutes] = e.target.value.split(':');
                      date.setHours(parseInt(hours), parseInt(minutes));
                      setEditingTimeBlock({ ...editingTimeBlock, endTime: date });
                    }}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                <input
                  type="text"
                  value={editingTimeBlock.location || ''}
                  onChange={(e) => setEditingTimeBlock({ ...editingTimeBlock, location: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                <div className="flex gap-2">
                  {['#8B5CF6', '#EF4444', '#10B981', '#F59E0B', '#3B82F6', '#EC4899'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditingTimeBlock({ ...editingTimeBlock, color })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        editingTimeBlock.color === color ? 'border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTimeBlock(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;