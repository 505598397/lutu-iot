
import React, { useState, useEffect } from 'react';
import { Device } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MonitoringProps {
  devices: Device[];
}

const Monitoring: React.FC<MonitoringProps> = ({ devices }) => {
  const [data, setData] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(devices[0] || null);

  useEffect(() => {
    // Generate initial history
    const initial = Array.from({ length: 20 }).map((_, i) => ({
      time: i,
      value: Math.floor(Math.random() * 30) + 10
    }));
    setData(initial);

    // Mock live data stream
    const interval = setInterval(() => {
      setData(prev => {
        const lastTime = prev[prev.length - 1].time;
        const newVal = Math.max(0, prev[prev.length - 1].value + (Math.random() * 10 - 5));
        return [...prev.slice(1), { time: lastTime + 1, value: newVal }];
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedDevice]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Device Picker */}
      <div className="lg:col-span-1 space-y-3 h-fit max-h-[calc(100vh-140px)] overflow-y-auto pr-2 custom-scrollbar">
        <h3 className="text-sm font-semibold text-gray-500 uppercase px-2 mb-4">选择监控节点</h3>
        {devices.map((device) => (
          <button
            key={device.id}
            onClick={() => setSelectedDevice(device)}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              selectedDevice?.id === device.id 
                ? 'bg-white border-blue-500 shadow-lg ring-1 ring-blue-500' 
                : 'bg-white/50 border-transparent hover:bg-white hover:border-gray-200 shadow-sm'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-mono font-bold text-gray-400">{device.id}</span>
              <div className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-green-500' : 'bg-red-400 animate-pulse'}`}></div>
            </div>
            <p className="text-sm font-semibold text-gray-800 truncate">{device.name}</p>
            <p className="text-[10px] text-gray-400 mt-1">{device.customer}</p>
          </button>
        ))}
      </div>

      {/* Main Monitoring Screen */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white p-8 rounded-2xl border border-[#f0f0f0] shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">{selectedDevice?.name || '实时视图'}</h3>
              <p className="text-sm text-gray-400">实时遥测流：{selectedDevice?.type === 'Sensor' ? '温度 (°C)' : '功耗 (kW)'}</p>
            </div>
            <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">当前数值</p>
                <p className="text-xl font-black text-blue-600">{data[data.length - 1]?.value.toFixed(1)}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-wave-square"></i>
              </div>
            </div>
          </div>

          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis dataKey="time" hide />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#bfbfbf'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)'}}
                  labelStyle={{display: 'none'}}
                  formatter={(value) => [`${value}`, '数值']}
                />
                <Line 
                  type="stepAfter" 
                  dataKey="value" 
                  stroke="#1677ff" 
                  strokeWidth={3} 
                  dot={false}
                  animationDuration={300}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-blue-600 p-6 rounded-2xl text-white">
             <div className="flex items-center gap-3 mb-4 opacity-80">
                <i className="fas fa-clock"></i>
                <span className="text-xs font-bold uppercase tracking-widest">运行时间</span>
             </div>
             <p className="text-3xl font-black">99.98%</p>
             <p className="text-xs mt-2 opacity-60">过去30天在线率</p>
           </div>
           
           <div className="bg-white p-6 rounded-2xl border border-[#f0f0f0] shadow-sm">
             <div className="flex items-center gap-3 mb-4 text-gray-400">
                <i className="fas fa-database"></i>
                <span className="text-xs font-bold uppercase tracking-widest">数据负载</span>
             </div>
             <p className="text-3xl font-black text-gray-800">14.2k</p>
             <p className="text-xs mt-2 text-gray-400">今日发送数据包</p>
           </div>

           <div className="bg-white p-6 rounded-2xl border border-[#f0f0f0] shadow-sm">
             <div className="flex items-center gap-3 mb-4 text-gray-400">
                <i className="fas fa-signal"></i>
                <span className="text-xs font-bold uppercase tracking-widest">信号强度</span>
             </div>
             <p className="text-3xl font-black text-green-500">-45 dBm</p>
             <p className="text-xs mt-2 text-gray-400">连接质量：极好</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Monitoring;
