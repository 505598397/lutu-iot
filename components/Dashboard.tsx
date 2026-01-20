
import React from 'react';
import { Device } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: '00:00', power: 400, temp: 24 },
  { name: '04:00', power: 300, temp: 22 },
  { name: '08:00', power: 1200, temp: 23 },
  { name: '12:00', power: 1500, temp: 26 },
  { name: '16:00', power: 1100, temp: 25 },
  { name: '20:00', power: 800, temp: 24 },
  { name: '23:59', power: 500, temp: 23 },
];

interface DashboardProps {
  devices: Device[];
  isDarkMode?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ devices, isDarkMode }) => {
  const stats = [
    { title: '已连接设备', value: devices.length, icon: 'fa-microchip', color: 'bg-blue-500', trend: '+2%' },
    { title: '离线警报', value: devices.filter(d => d.status === 'offline').length, icon: 'fa-exclamation-triangle', color: 'bg-red-500', trend: '-5%' },
    { title: '平均电量', value: '78%', icon: 'fa-battery-three-quarters', color: 'bg-green-500', trend: '+1%' },
    { title: '总功耗', value: '452 kWh', icon: 'fa-bolt', color: 'bg-orange-500', trend: '+12%' },
  ];

  const gridColor = isDarkMode ? '#303030' : '#f0f0f0';
  const textColor = isDarkMode ? '#8c8c8c' : '#8c8c8c';

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-[#1f1f1f] p-6 rounded-lg border border-[#f0f0f0] dark:border-[#303030] shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{stat.title}</p>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">{stat.value}</h3>
              </div>
              <div className={`${stat.color} w-10 h-10 rounded-lg flex items-center justify-center text-white`}>
                <i className={`fas ${stat.icon}`}></i>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${stat.trend.startsWith('+') ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                {stat.trend}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">对比昨日</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1f1f1f] p-6 rounded-lg border border-[#f0f0f0] dark:border-[#303030] shadow-sm transition-all">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">能耗趋势图</h3>
            <div className="flex gap-2">
              <button className="text-xs px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded border border-blue-100 dark:border-blue-800/30">每小时</button>
              <button className="text-xs px-3 py-1 bg-white dark:bg-[#2a2a2a] text-gray-500 dark:text-gray-400 rounded border border-gray-200 dark:border-gray-700">每周</button>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1677ff" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#1677ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: textColor}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: textColor}} />
                <Tooltip 
                  contentStyle={{
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    backgroundColor: isDarkMode ? '#1f1f1f' : '#ffffff',
                    color: isDarkMode ? '#ffffff' : '#000000'
                  }}
                  itemStyle={{ color: '#1677ff' }}
                  formatter={(value) => [`${value} kWh`, '功耗']}
                />
                <Area type="monotone" dataKey="power" stroke="#1677ff" strokeWidth={2} fillOpacity={1} fill="url(#colorPower)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-[#1f1f1f] p-6 rounded-lg border border-[#f0f0f0] dark:border-[#303030] shadow-sm transition-all">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-6">最近设备警报</h3>
          <div className="space-y-4">
            {[
              { type: 'error', msg: 'DEV-004 连接超时', time: '5分钟前' },
              { type: 'warning', msg: 'DEV-003 低电量 (15%)', time: '22分钟前' },
              { type: 'info', msg: 'DEV-001 高温警报 (29°C)', time: '1小时前' },
              { type: 'success', msg: '系统备份完成', time: '3小时前' },
              { type: 'warning', msg: '检测到新设备 "Node-X"', time: '4小时前' },
            ].map((alert, i) => (
              <div key={i} className="flex gap-4 group cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 p-2 rounded-lg transition-colors">
                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                  alert.type === 'error' ? 'bg-red-500' : 
                  alert.type === 'warning' ? 'bg-orange-500' : 
                  alert.type === 'info' ? 'bg-blue-500' : 'bg-green-500'
                }`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate font-medium">{alert.msg}</p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">{alert.time}</p>
                </div>
                <i className="fas fa-chevron-right text-gray-200 dark:text-gray-700 text-xs self-center opacity-0 group-hover:opacity-100"></i>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 text-sm text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg border border-transparent hover:border-blue-100 dark:hover:border-blue-900/50 transition-all">
            查看全部日志
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
