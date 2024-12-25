import React, { useMemo } from 'react';
import { ResponsiveLine } from '@nivo/line';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { PerformanceMetrics } from '../../types';

interface WeeklyProgressChartProps {
  data: PerformanceMetrics;
}

const WeeklyProgressChart: React.FC<WeeklyProgressChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    if (!data?.quizScores || !Array.isArray(data.quizScores) || data.quizScores.length === 0) {
      return [{
        id: 'Weekly Progress',
        data: [
          { x: format(new Date(), 'ww'), y: 0 }
        ]
      }];
    }

    // Group scores by week
    const weeklyScores = data.quizScores.reduce((acc: { [key: string]: number[] }, score) => {
      const week = format(new Date(score.date), 'ww');
      if (!acc[week]) {
        acc[week] = [];
      }
      acc[week].push(score.score);
      return acc;
    }, {});

    // Calculate average score for each week
    const weeklyAverages = Object.entries(weeklyScores).map(([week, scores]) => ({
      x: `Week ${week}`,
      y: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    }));

    return [{
      id: 'Weekly Progress',
      data: weeklyAverages.sort((a, b) => parseInt(a.x.split(' ')[1]) - parseInt(b.x.split(' ')[1]))
    }];
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg p-6 shadow-lg h-[300px] border border-gray-700/50"
    >
      {/* Glowing effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 rounded-lg blur-xl" />
      
      {/* Cybersecurity-themed header */}
      <div className="relative flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
          <h3 className="text-lg font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-transparent bg-clip-text">
            Weekly Progress
          </h3>
        </div>
        <div className="text-xs text-gray-400">
          Average Performance
        </div>
      </div>

      {/* Chart container with cyber effect border */}
      <div className="relative h-[230px] rounded border border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
        <ResponsiveLine
          data={chartData}
          margin={{ top: 30, right: 30, bottom: 50, left: 50 }}
          xScale={{
            type: 'point',
          }}
          yScale={{
            type: 'linear',
            min: 0,
            max: 100,
            stacked: false,
          }}
          curve="natural"
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
            legend: 'Week',
            legendOffset: 40,
            legendPosition: 'middle'
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Score %',
            legendOffset: -40,
            legendPosition: 'middle'
          }}
          enablePoints={true}
          pointSize={8}
          pointColor="#111827"
          pointBorderWidth={2}
          pointBorderColor={{ from: 'serieColor' }}
          pointLabelYOffset={-12}
          enableArea={true}
          areaBaselineValue={0}
          areaOpacity={0.15}
          areaBlendMode="screen"
          useMesh={true}
          enableSlices="x"
          crosshairType="cross"
          colors={[
            'rgba(139, 92, 246, 0.8)', // purple-500
          ]}
          theme={{
            background: 'transparent',
            textColor: '#9CA3AF',
            fontSize: 11,
            axis: {
              domain: {
                line: {
                  stroke: '#374151',
                  strokeWidth: 1
                }
              },
              ticks: {
                line: {
                  stroke: '#374151',
                  strokeWidth: 1
                }
              }
            },
            grid: {
              line: {
                stroke: '#1F2937',
                strokeWidth: 1
              }
            },
            crosshair: {
              line: {
                stroke: '#60A5FA',
                strokeWidth: 1,
                strokeOpacity: 0.5
              }
            },
            tooltip: {
              container: {
                background: '#111827',
                color: '#F3F4F6',
                fontSize: '12px',
                borderRadius: '8px',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.25)',
                border: '1px solid #374151'
              }
            }
          }}
          motionConfig="gentle"
          legends={[
            {
              anchor: 'top',
              direction: 'row',
              justify: false,
              translateX: 0,
              translateY: -20,
              itemsSpacing: 0,
              itemDirection: 'left-to-right',
              itemWidth: 140,
              itemHeight: 20,
              symbolSize: 12,
              symbolShape: 'circle',
              itemTextColor: '#9CA3AF',
              effects: [
                {
                  on: 'hover',
                  style: {
                    itemTextColor: '#F3F4F6'
                  }
                }
              ]
            }
          ]}
        />
      </div>
    </motion.div>
  );
};

export default WeeklyProgressChart;
