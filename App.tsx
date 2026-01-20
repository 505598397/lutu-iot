
import React, { useState, useEffect } from 'react';
import { Page, Device, DeviceTemplate } from './types';
import { INITIAL_DEVICES, INITIAL_TEMPLATES } from './constants';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import DeviceManager from './components/DeviceManager';
import AIInsights from './components/AIInsights';
import TemplateManager from './components/TemplateManager';
import Monitoring from './components/Monitoring';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>(Page.Dashboard);
  const [devices, setDevices] = useState<Device[]>(INITIAL_DEVICES);
  const [templates, setTemplates] = useState<DeviceTemplate[]>(INITIAL_TEMPLATES);
  const [collapsed, setCollapsed] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('iot_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
      localStorage.setItem('iot_theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
      localStorage.setItem('iot_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const savedDevices = localStorage.getItem('iot_devices');
    if (savedDevices) {
      try { setDevices(JSON.parse(savedDevices)); } catch (e) {}
    }
    const savedTemplates = localStorage.getItem('iot_templates');
    if (savedTemplates) {
      try { setTemplates(JSON.parse(savedTemplates)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('iot_devices', JSON.stringify(devices));
  }, [devices]);

  useEffect(() => {
    localStorage.setItem('iot_templates', JSON.stringify(templates));
  }, [templates]);

  const addDevice = (newDevice: Device) => setDevices(prev => [...prev, newDevice]);
  const removeDevice = (id: string) => {
    if (window.confirm('您确定要移除该设备吗？')) {
      setDevices(prev => prev.filter(d => d.id !== id));
    }
  };
  const removeManyDevices = (ids: string[]) => {
    if (window.confirm(`确定要批量删除选中的 ${ids.length} 个设备吗？`)) {
      setDevices(prev => prev.filter(d => !ids.includes(d.id)));
    }
  };
  const updateDevice = (updated: Device) => setDevices(prev => prev.map(d => d.id === updated.id ? updated : d));

  const addTemplate = (newTemplate: DeviceTemplate) => setTemplates(prev => [...prev, newTemplate]);
  const updateTemplate = (updated: DeviceTemplate) => setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
  const removeTemplate = (id: string) => setTemplates(prev => prev.filter(t => t.id !== id));

  const renderPage = () => {
    switch (activePage) {
      case Page.Dashboard:
        return <Dashboard devices={devices} isDarkMode={isDarkMode} />;
      case Page.Devices:
        return (
          <DeviceManager 
            devices={devices} 
            templates={templates}
            onAdd={addDevice} 
            onRemove={removeDevice} 
            onRemoveMany={removeManyDevices}
            onUpdate={updateDevice} 
          />
        );
      case Page.Templates:
        return (
          <TemplateManager 
            templates={templates} 
            onAdd={addTemplate}
            onUpdate={updateTemplate}
            onRemove={removeTemplate} 
            onRemoveMany={() => {}} 
          />
        );
      case Page.Monitoring:
        return <Monitoring devices={devices} />;
      case Page.AIInsights:
        return <AIInsights devices={devices} />;
      case Page.Settings:
      case Page.Security:
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
             <i className="fas fa-tools text-6xl mb-4 opacity-20"></i>
             <p className="text-xl">“{activePage === Page.Settings ? '通用设置' : '安全配置'}” 正在开发中...</p>
          </div>
        );
      default:
        return <Dashboard devices={devices} />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#f5f5f5] dark:bg-[#141414] text-[#262626] dark:text-gray-200 transition-colors duration-300">
      <Header 
        activePage={activePage} 
        deviceCount={devices.length}
        onlineCount={devices.filter(d => d.status === 'online').length}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(prev => !prev)}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          activePage={activePage} 
          onPageChange={setActivePage} 
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
        
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth bg-inherit custom-scrollbar">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default App;
