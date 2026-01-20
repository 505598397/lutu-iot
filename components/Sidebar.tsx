
import React, { useState, useEffect } from 'react';
import { Page } from '../types';

interface MenuItem {
  id: string;
  icon: string;
  label: string;
  children?: { id: Page; label: string }[];
}

interface SidebarProps {
  activePage: Page;
  onPageChange: (page: Page) => void;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onPageChange, collapsed, setCollapsed }) => {
  // 维护一级菜单的展开状态
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['assets', 'ops']);

  const menuGroups: MenuItem[] = [
    { 
      id: 'overview', 
      icon: 'fa-chart-pie', 
      label: '系统概览', 
      children: [{ id: Page.Dashboard, label: '控制面板' }] 
    },
    { 
      id: 'assets', 
      icon: 'fa-microchip', 
      label: '资产管理', 
      children: [
        { id: Page.Devices, label: '设备列表' },
        { id: Page.Templates, label: '配置模板' }
      ] 
    },
    { 
      id: 'ops', 
      icon: 'fa-tools', 
      label: '运维中心', 
      children: [
        { id: Page.Monitoring, label: '实时监控' },
        { id: Page.AIInsights, label: 'AI 诊断分析' }
      ] 
    },
    { 
      id: 'settings', 
      icon: 'fa-cog', 
      label: '系统设置', 
      children: [
        { id: Page.Settings, label: '通用设置' },
        { id: Page.Security, label: '安全中心' }
      ] 
    },
  ];

  const toggleGroup = (groupId: string) => {
    if (collapsed) {
      setCollapsed(false);
      setExpandedGroups([groupId]);
      return;
    }
    setExpandedGroups(prev => 
      prev.includes(groupId) ? prev.filter(g => g !== groupId) : [...prev, groupId]
    );
  };

  const isParentActive = (group: MenuItem) => {
    return group.children?.some(child => child.id === activePage);
  };

  return (
    <div className={`bg-[#001529] dark:bg-[#1f1f1f] text-white flex flex-col transition-all duration-300 border-r border-gray-700/30 dark:border-white/5 shadow-xl z-30 ${collapsed ? 'w-20' : 'w-64'}`}>
      <nav className="flex-1 mt-4 overflow-y-auto no-scrollbar py-2">
        {menuGroups.map((group) => {
          const isOpen = expandedGroups.includes(group.id) && !collapsed;
          const hasActiveChild = isParentActive(group);

          return (
            <div key={group.id} className="mb-1">
              {/* Parent Item */}
              <button
                onClick={() => toggleGroup(group.id)}
                className={`w-full flex items-center px-6 py-3.5 transition-all group relative ${
                  hasActiveChild && collapsed ? 'bg-[#1677ff] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <i className={`fas ${group.icon} w-6 text-center text-lg ${hasActiveChild ? 'text-white' : 'group-hover:text-white'}`}></i>
                {!collapsed && (
                  <>
                    <span className={`ml-3 font-medium flex-1 text-left ${hasActiveChild ? 'text-white' : ''}`}>{group.label}</span>
                    <i className={`fas fa-chevron-down text-[10px] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}></i>
                  </>
                )}

                {/* Collapsed Tooltip/Popover */}
                {collapsed && (
                  <div className="absolute left-20 bg-[#001529] dark:bg-[#1f1f1f] rounded-r-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none min-w-[160px] border border-white/5">
                    <div className="px-4 py-3 border-b border-white/5 font-bold text-sm bg-white/5">{group.label}</div>
                    <div className="py-2">
                      {group.children?.map(child => (
                        <div key={child.id} className={`px-4 py-2 text-xs ${activePage === child.id ? 'text-[#1677ff]' : 'text-gray-400'}`}>
                          {child.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </button>

              {/* Children Submenu */}
              {!collapsed && isOpen && (
                <div className="bg-[#000c17]/50 dark:bg-black/20 overflow-hidden animate-in slide-in-from-top-1 duration-200">
                  {group.children?.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => onPageChange(child.id)}
                      className={`w-full flex items-center pl-14 pr-6 py-3 transition-all text-sm relative ${
                        activePage === child.id 
                          ? 'bg-[#1677ff] text-white' 
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className="font-medium">{child.label}</span>
                      {activePage === child.id && (
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-white"></div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="h-12 border-t border-gray-700/30 dark:border-white/10 flex items-center justify-center hover:bg-white/5 text-gray-400 transition-colors"
      >
        <i className={`fas fa-chevron-${collapsed ? 'right' : 'left'}`}></i>
      </button>
    </div>
  );
};

export default Sidebar;
