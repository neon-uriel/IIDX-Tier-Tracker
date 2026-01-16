import React from 'react';
import { ContributionCalendar } from 'react-contribution-calendar';

const ContributionCalendarComponent = ({ history }) => {
  if (!history || history.length === 0) {
    return <div className="contribution-calendar">No lamp history available.</div>;
  }

  // Aggregate history data by date
  const dailyContributions = {};
  history.forEach(entry => {
    const date = new Date(entry.created_at).toISOString().split('T')[0]; // YYYY-MM-DD
    dailyContributions[date] = (dailyContributions[date] || 0) + 1;
  });

  // Transform to the format expected by react-contribution-calendar
  const transformedData = Object.keys(dailyContributions).map(date => ({
    [date]: { level: Math.min(dailyContributions[date], 4) } // Cap level at 4 for visual intensity
  }));

  // Determine start and end dates for the calendar
  const today = new Date();
  const endDate = today.toISOString().split('T')[0]; // Current date
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const startDate = oneYearAgo.toISOString().split('T')[0]; // One year ago

  return (
    <div className="contribution-calendar">
      <h2>Lamp Update History</h2>
      <ContributionCalendar
        data={transformedData}
        dateOptions={{ start: startDate, end: endDate }}
        // styleOptions={{ theme: 'grass' }} // Use a default theme or customize
      />
    </div>
  );
};

export default ContributionCalendarComponent;