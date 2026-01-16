import React from 'react';

const StatsDashboard = ({ summary }) => {
  if (!summary || Object.keys(summary).length === 0) {
    return <div className="stats-dashboard">No summary data available.</div>;
  }

  const lampOrder = [
    'NO PLAY', 'FAILED', 'ASSIST CLEAR', 'EASY CLEAR', 'CLEAR', 'HARD', 'EX-HARD', 'FULLCOMBO'
  ];

  // Get all unique lamps across all levels for consistent column headers
  const allLamps = new Set();
  Object.values(summary).forEach(levelData => {
    Object.keys(levelData).forEach(lamp => allLamps.add(lamp));
  });
  const sortedLamps = Array.from(allLamps).sort((a, b) => lampOrder.indexOf(a) - lampOrder.indexOf(b));

  return (
    <div className="stats-dashboard">
      <h2>Clear Status Summary by Level</h2>
      <table>
        <thead>
          <tr>
            <th>Level</th>
            {sortedLamps.map(lamp => (
              <th key={lamp}>{lamp}</th>
            ))}
            <th>Total Cleared</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(summary).sort((a, b) => parseInt(a) - parseInt(b)).map(level => {
            const levelData = summary[level];
            const totalCleared = Object.values(levelData).reduce((acc, count) => acc + count, 0);
            return (
              <tr key={level}>
                <td>☆{level}</td>
                {sortedLamps.map(lamp => (
                  <td key={`${level}-${lamp}`}>{levelData[lamp] || 0}</td>
                ))}
                <td>{totalCleared}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StatsDashboard;
