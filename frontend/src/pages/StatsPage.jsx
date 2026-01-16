import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StatsDashboard from '../components/StatsDashboard';
import ContributionCalendar from '../components/ContributionCalendar'; // Uncommented

export default function StatsPage() {
  const [summaryData, setSummaryData] = useState({});
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [summaryResponse, historyResponse] = await Promise.all([
          axios.get('/api/stats/summary'),
          axios.get('/api/stats/history'),
        ]);
        setSummaryData(summaryResponse.data);
        setHistoryData(historyResponse.data);
      } catch (err) {
        console.error('Error fetching statistics:', err);
        setError('Failed to load statistics. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="stats-page">Loading statistics...</div>;
  }

  if (error) {
    return <div className="stats-page error-message">{error}</div>;
  }

  return (
    <div className="stats-page">
      <h1>Statistics Dashboard</h1>
      <StatsDashboard summary={summaryData} />
      <ContributionCalendar history={historyData} /> {/* Uncommented */}
    </div>
  );
}