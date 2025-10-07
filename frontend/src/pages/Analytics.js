import React, { useState, useEffect } from 'react';
import pomodoroService from '../services/pomodoroService';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await pomodoroService.getAnalytics(dateRange.startDate, dateRange.endDate);
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const handleDateChange = (e) => {
    setDateRange({
      ...dateRange,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  return (
    <div className="container">
      <h2 style={{ color: 'white', marginBottom: '2rem' }}>Productivity Analytics</h2>
      
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>Date Range</h3>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Start Date</label>
            <input
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateChange}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>End Date</label>
            <input
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateChange}
            />
          </div>
        </div>
      </div>

      {analytics && (
        <>
          <div className="grid">
            <div className="analytics-card">
              <h3>{analytics.totalSessions}</h3>
              <p>Total Sessions</p>
            </div>
            <div className="analytics-card">
              <h3>{analytics.workSessions}</h3>
              <p>Work Sessions</p>
            </div>
            <div className="analytics-card">
              <h3>{analytics.totalHours}</h3>
              <p>Total Hours</p>
            </div>
            <div className="analytics-card">
              <h3>{analytics.totalMinutes}</h3>
              <p>Total Minutes</p>
            </div>
          </div>

          {analytics.categoryStats && Object.keys(analytics.categoryStats).length > 0 && (
            <div className="card" style={{ marginTop: '2rem' }}>
              <h3>Sessions by Category</h3>
              <div style={{ marginTop: '1rem' }}>
                {Object.entries(analytics.categoryStats).map(([category, stats]) => (
                  <div key={category} style={{ marginBottom: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`category-badge category-${category}`}>
                        {category}
                      </span>
                      <div>
                        <span style={{ marginRight: '1rem' }}>
                          <strong>{stats.count}</strong> sessions
                        </span>
                        <span>
                          <strong>{Math.round(stats.duration / 60 * 10) / 10}</strong> hours
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analytics.dailyStats && Object.keys(analytics.dailyStats).length > 0 && (
            <div className="card" style={{ marginTop: '2rem' }}>
              <h3>Daily Statistics</h3>
              <div style={{ marginTop: '1rem' }}>
                {Object.entries(analytics.dailyStats)
                  .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
                  .map(([date, stats]) => (
                    <div key={date} style={{ marginBottom: '0.5rem', padding: '0.75rem', background: '#f8f9fa', borderRadius: '5px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{new Date(date).toLocaleDateString()}</span>
                        <span>
                          <strong>{stats.count}</strong> sessions • <strong>{Math.round(stats.duration / 60 * 10) / 10}</strong> hours
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Analytics;
