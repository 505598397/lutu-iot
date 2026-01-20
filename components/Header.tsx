
import React, { useState, useRef, useEffect } from 'react';
import { Page } from '../types';

interface HeaderProps {
  activePage: Page;
  deviceCount: number;
  onlineCount: number;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

interface Notification {
  id: string;
  type: 'alarm' | 'info' | 'warning' | 'success';
  title: string;
  content: string;
  time: string;
  isRead: boolean;
}

const Header: React.FC<HeaderProps> = ({ activePage, deviceCount, onlineCount, isDarkMode, onToggleTheme }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', type: 'alarm', title: '设备离线告警', content: '北厅温度传感器 (DEV-001) 已失去连接超过 5 分钟。', time: '1分钟前', isRead: false },
    { id: '2', type: 'warning', title: '阈值预警', content: '智能空调控制器 (DEV-002) 功耗异常升高 (15.2 kWh)。', time: '12分钟前', isRead: false },
    { id: '3', type: 'success', title: '固件更新成功', content: '网关节点 G-88 的固件已成功升级至 v2.0.4。', time: '1小时前', isRead: true },
    { id: '4', type: 'info', title: '系统维护通知', content: '系统将于今晚 02:00 进行常规数据库维护，预计持续 10 分钟。', time: '3小时前', isRead: true },
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    switch (activePage) {
      case Page.Dashboard: return '仪表盘概览';
      case Page.Devices: return '设备资产列表';
      case Page.Templates: return '设备配置模板';
      case Page.Monitoring: return '实时监测中心';
      case Page.AIInsights: return 'AI 系统诊断';
      case Page.Settings: return '通用系统设置';
      case Page.Security: return '安全合规中心';
      default: return 'SmartLink';
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 防止触发整个通知项的点击事件
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  return (
    <header className="h-16 bg-[#001529] dark:bg-[#1f1f1f] border-b border-gray-700/30 dark:border-[#303030] flex items-center justify-between px-6 z-40 shrink-0 transition-colors duration-300">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 pr-6 border-r border-gray-700/30">
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center shadow-lg">
            <i className="fas fa-link text-white"></i>
          </div>
          <span className="font-bold text-lg tracking-tight text-white hidden sm:block">SmartLink IOT</span>
        </div>

        <div className="flex items-center gap-4">
          <h2 className="text-lg font-medium text-gray-200">{getPageTitle()}</h2>
          <div className="h-4 w-[1px] bg-gray-600 dark:bg-gray-700 mx-2"></div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/30">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-medium text-green-400">{onlineCount} 设备在线</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center bg-white/5 dark:bg-[#141414] border border-white/10 dark:border-[#434343] rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <i className="fas fa-search text-gray-500 dark:text-gray-600 text-sm"></i>
          <input 
            type="text" 
            placeholder="搜索设备、日志..." 
            className="bg-transparent border-none outline-none text-sm ml-2 w-48 text-gray-200 placeholder-gray-500"
          />
        </div>
        
        <div className="flex items-center gap-4 border-l pl-6 border-white/10 dark:border-gray-800">
          <button 
            onClick={onToggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 transition-colors"
            title="切换主题"
          >
            <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'} text-lg`}></i>
          </button>

          {/* Notification Bell Section */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors ${showNotifications ? 'bg-white/10 text-white' : 'text-gray-400'}`}
              title="通知中心"
            >
              <i className="far fa-bell text-lg"></i>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-[#001529] dark:border-[#1f1f1f] font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#1f1f1f] rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b dark:border-white/5 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">通知中心</h4>
                  <button 
                    onClick={markAllAsRead}
                    className="text-[11px] text-blue-500 hover:text-blue-600 font-medium"
                  >
                    全部已读
                  </button>
                </div>
                
                <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
                  {notifications.length > 0 ? (
                    <div className="divide-y dark:divide-white/5">
                      {notifications.map((n) => (
                        <div 
                          key={n.id} 
                          className={`p-4 flex gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer relative group/item ${!n.isRead ? 'bg-blue-500/5' : ''}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            n.type === 'alarm' ? 'bg-red-100 text-red-500 dark:bg-red-900/20' :
                            n.type === 'warning' ? 'bg-orange-100 text-orange-500 dark:bg-orange-900/20' :
                            n.type === 'success' ? 'bg-green-100 text-green-500 dark:bg-green-900/20' :
                            'bg-blue-100 text-blue-500 dark:bg-blue-900/20'
                          }`}>
                            <i className={`fas ${
                              n.type === 'alarm' ? 'fa-exclamation-circle' :
                              n.type === 'warning' ? 'fa-exclamation-triangle' :
                              n.type === 'success' ? 'fa-check-circle' : 'fa-info-circle'
                            } text-sm`}></i>
                          </div>
                          <div className="flex-1 min-w-0 pr-6">
                            <div className="flex justify-between items-start gap-2">
                              <h5 className={`text-xs font-bold truncate ${n.isRead ? 'text-gray-600 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                                {n.title}
                              </h5>
                              <span className="text-[9px] text-gray-400 whitespace-nowrap">{n.time}</span>
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                              {n.content}
                            </p>
                          </div>
                          
                          {/* Individual Mark as Read Button */}
                          {!n.isRead && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                              <button 
                                onClick={(e) => markAsRead(n.id, e)}
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 shadow-md transform hover:scale-110 transition-all"
                                title="标记为已读"
                              >
                                <i className="fas fa-check text-[10px]"></i>
                              </button>
                            </div>
                          )}

                          {!n.isRead && (
                            <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <i className="far fa-bell-slash text-3xl text-gray-200 dark:text-gray-700 mb-2"></i>
                      <p className="text-sm text-gray-400">暂无新通知</p>
                    </div>
                  )}
                </div>

                <button className="w-full py-2.5 text-xs text-gray-500 dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-white/5 border-t dark:border-white/5 transition-colors">
                  查看历史通知
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-200 leading-none">管理员</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Super Admin</p>
            </div>
            <div className="w-9 h-9 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm group-hover:ring-2 ring-white/20 transition-all">
              AD
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
