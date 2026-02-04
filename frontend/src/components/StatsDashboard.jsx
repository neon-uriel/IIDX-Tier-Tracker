import React from 'react';

const StatsDashboard = ({ summary }) => {
  if (!summary || Object.keys(summary).length === 0) {
    return <div className="stats-dashboard">No summary data available.</div>;
  }

  const lampOrder = [
    'FAILED', 'ASSIST CLEAR', 'EASY CLEAR', 'CLEAR', 'HARD', 'EX-HARD', 'FULLCOMBO'
  ];

  const sortedLamps = lampOrder;

  const lampDisplayNames = {
    'FAILED': 'FAILED',
    'ASSIST CLEAR': 'ASSIST',
    'EASY CLEAR': 'EASY',
    'CLEAR': 'CLEAR',
    'HARD': 'HARD',
    'EX-HARD': 'EX-HARD',
    'FULLCOMBO': 'FC'
  };

  const getLampClass = (lamp) => {
    const classMap = {
      'FAILED': 'lamp-failed',
      'ASSIST CLEAR': 'lamp-assist',
      'EASY CLEAR': 'lamp-easy',
      'CLEAR': 'lamp-clear',
      'HARD': 'lamp-hard',
      'EX-HARD': 'lamp-exhard',
      'FULLCOMBO': 'lamp-fullcombo',
    };
    return classMap[lamp] || '';
  };

  return (
    <div className="stats-dashboard w-full">
      <div className="glass rounded-xl sm:rounded-2xl !p-3 sm:!p-8 shadow-2xl overflow-hidden border border-white/20">
        <h2 className="text-lg sm:text-2xl font-heading font-bold mb-4 sm:mb-8 text-primary">Clear Status Summary</h2>
        <div className="rounded-lg sm:rounded-xl border border-white/20 overflow-hidden w-full">
          <div className="overflow-x-auto w-full -webkit-overflow-scrolling-touch">
            <table className="w-full text-left border-collapse" style={{ minWidth: '600px' }}>
              <thead>
                <tr className="bg-black/40 backdrop-blur-md border-b border-white/10 text-primary">
                  <th className="p-2 sm:p-4 font-heading font-bold whitespace-nowrap border-r border-white/5 text-center text-xs sm:text-base sticky left-0 bg-black/60 backdrop-blur-md z-10" style={{ width: '50px' }}>Lv</th>
                  {sortedLamps.map(lamp => (
                    <th key={lamp} className={`p-1 sm:p-4 font-heading font-bold whitespace-nowrap text-center border-r border-white/5 ${getLampClass(lamp)} !bg-transparent !shadow-none text-[10px] sm:text-base`} style={{ textShadow: '0 0 5px currentColor' }}>{lampDisplayNames[lamp]}</th>
                  ))}
                  <th className="p-2 sm:p-4 font-heading font-bold whitespace-nowrap text-center text-xs sm:text-base">Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(summary).sort((a, b) => parseInt(a) - parseInt(b)).map((level, index) => {
                  const levelData = summary[level];
                  // Sum only clear lamps (ASSIST to FC)
                  const clearLamps = ['ASSIST CLEAR', 'EASY CLEAR', 'CLEAR', 'HARD', 'EX-HARD', 'FULLCOMBO'];
                  const totalCleared = clearLamps.reduce((acc, lamp) => acc + (levelData[lamp] || 0), 0);
                  const isEven = index % 2 === 0;
                  return (
                    <tr key={level} className={`border-b border-white/5 transition-none ${!isEven ? 'bg-white/5 hover:bg-white/5' : 'hover:bg-transparent'}`}>
                      <td className="p-2 sm:p-4 font-bold text-sm sm:text-lg font-heading text-primary border-r border-white/5 text-center sticky left-0 bg-background/80 dark:bg-black/60 backdrop-blur-md z-10">☆{level}</td>
                      {sortedLamps.map(lamp => (
                        <td key={`${level}-${lamp}`} className="p-1 sm:p-4 font-medium text-center border-r border-white/5">
                          <span
                            className={`inline-block px-1 sm:px-3 py-0.5 sm:py-1 font-heading font-bold text-xs sm:text-lg ${levelData[lamp] > 0 ? getLampClass(lamp) : 'text-white/20'} !bg-transparent !shadow-none`}
                            style={levelData[lamp] > 0 ? { textShadow: '0 0 5px currentColor' } : {}}
                          >
                            {levelData[lamp] || 0}
                          </span>
                        </td>
                      ))}
                      <td className="p-2 sm:p-4 font-bold text-sm sm:text-lg font-heading text-center text-accent">{totalCleared}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;
