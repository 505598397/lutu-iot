
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Device, DeviceTemplate, DeviceStatus, CredentialType, DeviceAttribute, AttributeScope, TelemetryItem } from '../types';
import { CUSTOMERS } from '../constants';
import LocationPicker from './LocationPicker';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface DeviceDetailProps {
  device: Device;
  templates: DeviceTemplate[];
  onBack: () => void;
  onUpdate: (device: Device) => void;
}

// Internal TagInput component to match DeviceManager
const TagInput: React.FC<{
  tags: string[];
  onChange: (tags: string[]) => void;
}> = ({ tags, onChange }) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = inputValue.trim();
      if (val && !tags.includes(val)) {
        onChange([...tags, val]);
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(t => t !== tagToRemove));
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-1.5 border border-gray-300 dark:border-[#434343] dark:bg-[#141414] rounded-lg min-h-[42px] focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
      {tags.map((tag, index) => (
        <span 
          key={index} 
          className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium rounded border border-gray-200 dark:border-white/5"
        >
          {tag}
          <button 
            type="button" 
            onClick={() => removeTag(tag)}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <i className="fas fa-times scale-75"></i>
          </button>
        </span>
      ))}
      <input
        type="text"
        className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 dark:text-gray-200 min-w-[100px] py-1"
        placeholder={tags.length === 0 ? "输入标签并回车..." : ""}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

// Ant Design Descriptions style
const DescriptionsItem: React.FC<{
  label: string;
  children: React.ReactNode;
  span?: number;
  mono?: boolean;
}> = ({ label, children, span = 1, mono = false }) => (
  <div className={`flex flex-col border-[#f0f0f0] dark:border-[#303030] border-b last:border-b-0 sm:flex-row ${span === 2 ? 'sm:col-span-2' : ''}`}>
    <div className="w-full sm:w-1/3 bg-[#fafafa] dark:bg-[#1d1d1d] px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center border-r border-[#f0f0f0] dark:border-[#303030]">
      {label}
    </div>
    <div className={`w-full sm:w-2/3 px-4 py-3 text-sm text-gray-800 dark:text-gray-200 flex items-center bg-white dark:bg-[#141414] ${mono ? 'font-mono' : ''}`}>
      {children}
    </div>
  </div>
);

type ValueType = 'string' | 'integer' | 'double' | 'boolean' | 'json';

const DeviceDetail: React.FC<DeviceDetailProps> = ({ device, templates, onBack, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Time filtering state
  const [startTime, setStartTime] = useState<string>(() => {
    const d = new Date();
    d.setHours(d.getHours() - 24);
    return d.toISOString().slice(0, 16);
  });
  const [endTime, setEndTime] = useState<string>(() => new Date().toISOString().slice(0, 16));

  // Telemetry filtering state
  const [telemetrySearch, setTelemetrySearch] = useState('');
  const [telemetryTypeFilter, setTelemetryTypeFilter] = useState('all');
  const [telemetryStatusFilter, setTelemetryStatusFilter] = useState('all');

  // 属性管理状态
  const [attributes, setAttributes] = useState<DeviceAttribute[]>(device.attributes || [
    { key: 'active', value: true, scope: 'client', lastUpdate: '2023-10-27 10:00:00' },
    { key: 'firmware_version', value: '1.2.5-stable', scope: 'client', lastUpdate: '2023-10-25 09:20:11' },
    { key: 'upload_interval', value: 60, scope: 'shared', lastUpdate: '2023-10-26 11:45:30' },
    { key: 'region', value: 'CN-North-1', scope: 'server', lastUpdate: '2023-10-20 15:30:00' },
  ]);
  const [selectedAttrKeys, setSelectedAttrKeys] = useState<Set<string>>(new Set());
  const [isAttrModalOpen, setIsAttrModalOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState<DeviceAttribute | null>(null);
  const [attrFormData, setAttrFormData] = useState<Partial<DeviceAttribute>>({ key: '', value: '', scope: 'client' });
  const [attrValueType, setAttrValueType] = useState<ValueType>('string');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [attrToDelete, setAttrToDelete] = useState<string[]>([]);

  // 遥测数据
  const [telemetry, setTelemetry] = useState<TelemetryItem[]>(device.telemetry || [
    { key: 'temp', label: '环境温度', type: 'Double', unit: '°C', lastUpdate: '2023-10-27 14:45:01', currentValue: 24.5 },
    { key: 'humi', label: '环境湿度', type: 'Double', unit: '%', lastUpdate: '2023-10-27 14:45:01', currentValue: 62.1 },
    { key: 'battery', label: '剩余电量', type: 'Integer', unit: '%', lastUpdate: '2023-10-27 14:30:12', currentValue: 85 },
    { key: 'voltage', label: '输入电压', type: 'Double', unit: 'V', lastUpdate: '2023-10-27 14:45:01', currentValue: 3.6 },
    { key: 'signal', label: '信号强度', type: 'Integer', unit: 'dBm', lastUpdate: '2023-10-27 14:45:05', currentValue: -42 },
  ]);
  
  const filteredTelemetry = useMemo(() => {
    return telemetry.filter(item => {
      const matchSearch = item.label.toLowerCase().includes(telemetrySearch.toLowerCase()) || item.key.toLowerCase().includes(telemetrySearch.toLowerCase());
      const matchType = telemetryTypeFilter === 'all' || item.type.toLowerCase() === telemetryTypeFilter.toLowerCase();
      // Mock status filter: 'active' if updated in the last 24 hours (for demo)
      const isRecent = new Date(item.lastUpdate).getTime() > new Date().getTime() - 86400000;
      const matchStatus = telemetryStatusFilter === 'all' || (telemetryStatusFilter === 'active' && isRecent) || (telemetryStatusFilter === 'inactive' && !isRecent);
      return matchSearch && matchType && matchStatus;
    });
  }, [telemetry, telemetrySearch, telemetryTypeFilter, telemetryStatusFilter]);

  const [selectedTelemetry, setSelectedTelemetry] = useState<TelemetryItem | null>(telemetry[0] || null);
  const [isCollecting, setIsCollecting] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Device>>({ ...device });

  useEffect(() => {
    if (isEditModalOpen) {
      setFormData({ ...device });
    }
  }, [isEditModalOpen, device]);

  const historyData = useMemo(() => {
    if (!selectedTelemetry) return [];
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const steps = 24;
    const stepMs = diffMs / steps;

    return Array.from({ length: steps + 1 }).map((_, i) => {
      const d = new Date(start.getTime() + i * stepMs);
      const hourStr = d.getHours().toString().padStart(2, '0');
      const minStr = d.getMinutes().toString().padStart(2, '0');
      const monthDay = `${d.getMonth() + 1}/${d.getDate()}`;
      
      return {
        time: `${monthDay} ${hourStr}:${minStr}`,
        value: (selectedTelemetry.currentValue as number) + (Math.random() * 4 - 2)
      };
    });
  }, [selectedTelemetry, startTime, endTime]);

  const detailMapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);

  useEffect(() => {
    if (activeTab === 'details' && detailMapRef.current && device.latitude && device.longitude && !leafletMapRef.current) {
      // @ts-ignore
      const L = window.L;
      if (!L) return;
      const map = L.map(detailMapRef.current, {
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false
      }).setView([device.latitude, device.longitude], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      L.marker([device.latitude, device.longitude]).addTo(map);
      leafletMapRef.current = map;
    }
    return () => { if (leafletMapRef.current) { leafletMapRef.current.remove(); leafletMapRef.current = null; } };
  }, [activeTab, device.latitude, device.longitude]);

  const tabs = [
    { id: 'details', label: '详情', icon: 'fa-info-circle' },
    { id: 'attributes', label: '属性', icon: 'fa-list-ul' },
    { id: 'telemetry', label: '遥测数据', icon: 'fa-chart-line' },
    { id: 'calculated', label: '计算字段', icon: 'fa-calculator' },
    { id: 'alarms', label: '告警', icon: 'fa-exclamation-triangle' },
    { id: 'events', label: '事件', icon: 'fa-clock' },
    { id: 'audit', label: '审计日志', icon: 'fa-history' },
  ];

  const handleActiveCollect = (e: React.MouseEvent, item: TelemetryItem) => {
    e.stopPropagation();
    setIsCollecting(item.key);
    setTimeout(() => {
      const newVal = (item.currentValue as number) + (Math.random() * 2 - 1);
      const updated = telemetry.map(t => t.key === item.key ? {
        ...t, 
        currentValue: parseFloat(newVal.toFixed(2)),
        lastUpdate: new Date().toISOString().replace('T', ' ').split('.')[0]
      } : t);
      setTelemetry(updated);
      setIsCollecting(null);
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    onUpdate({ ...device, ...formData, attributes } as Device);
    setIsEditModalOpen(false);
  };

  // --- 属性相关逻辑 ---
  const handleOpenAttrModal = (attr?: DeviceAttribute) => {
    if (attr) {
      setEditingAttr(attr);
      setAttrFormData({ ...attr });
      
      // 推断类型
      const val = attr.value;
      if (typeof val === 'boolean') setAttrValueType('boolean');
      else if (typeof val === 'number') {
        setAttrValueType(Number.isInteger(val) ? 'integer' : 'double');
      } else if (typeof val === 'object' && val !== null) {
        setAttrValueType('json');
        setAttrFormData({ ...attr, value: JSON.stringify(val, null, 2) });
      } else {
        setAttrValueType('string');
      }
    } else {
      setEditingAttr(null);
      setAttrFormData({ key: '', value: '', scope: 'client' });
      setAttrValueType('string');
    }
    setIsAttrModalOpen(true);
  };

  const handleAttrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attrFormData.key) return;

    let finalValue: any = attrFormData.value;
    try {
      if (attrValueType === 'integer') finalValue = parseInt(attrFormData.value as string, 10);
      else if (attrValueType === 'double') finalValue = parseFloat(attrFormData.value as string);
      else if (attrValueType === 'boolean') finalValue = attrFormData.value === 'true' || attrFormData.value === true;
      else if (attrValueType === 'json') finalValue = typeof attrFormData.value === 'string' ? JSON.parse(attrFormData.value) : attrFormData.value;
      
      if (attrValueType === 'integer' || attrValueType === 'double') {
        if (isNaN(finalValue)) throw new Error('数值无效');
      }
    } catch (err) {
      alert('属性值格式不正确');
      return;
    }

    const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
    const newAttr = { ...attrFormData, value: finalValue, lastUpdate: timestamp } as DeviceAttribute;

    if (editingAttr) {
      setAttributes(prev => prev.map(a => a.key === editingAttr.key ? newAttr : a));
    } else {
      setAttributes(prev => [...prev, newAttr]);
    }
    setIsAttrModalOpen(false);
  };

  const triggerDeleteConfirm = (keys: string[]) => {
    setAttrToDelete(keys);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteAttributes = () => {
    setAttributes(prev => prev.filter(a => !attrToDelete.includes(a.key)));
    setSelectedAttrKeys(prev => {
      const next = new Set(prev);
      attrToDelete.forEach(k => next.delete(k));
      return next;
    });
    setIsDeleteConfirmOpen(false);
    setAttrToDelete([]);
  };

  const toggleAttrSelectAll = () => {
    if (selectedAttrKeys.size === attributes.length) {
      setSelectedAttrKeys(new Set());
    } else {
      setSelectedAttrKeys(new Set(attributes.map(a => a.key)));
    }
  };

  const toggleAttrSelectOne = (key: string) => {
    const next = new Set(selectedAttrKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedAttrKeys(next);
  };

  const generateRandomToken = (len: number) => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let res = '';
    for(let i=0; i<len; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
    return res;
  };

  const inputClasses = "w-full px-3 py-2.5 bg-white text-gray-800 border border-gray-300 dark:border-[#434343] dark:bg-[#141414] dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all";

  const renderContent = () => {
    const associatedTemplate = templates.find(t => t.id === device.templateId);

    switch (activeTab) {
      case 'details':
        return (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 p-8">
            <div className="xl:col-span-2 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">基础配置</h4>
                </div>
                <div className="border border-[#f0f0f0] dark:border-[#303030] rounded-lg overflow-hidden grid grid-cols-1 sm:grid-cols-2">
                  <DescriptionsItem label="设备名称">{device.name}</DescriptionsItem>
                  <DescriptionsItem label="资源类型">{device.isPublic ? '公开资源' : '私有资源'}</DescriptionsItem>
                  <DescriptionsItem label="设备配置模板">{associatedTemplate?.name || '默认配置'}</DescriptionsItem>
                  <DescriptionsItem label="所属客户">{device.customer}</DescriptionsItem>
                  <DescriptionsItem label="网关模式">{device.isGateway ? '是' : '否'}</DescriptionsItem>
                  <DescriptionsItem label="覆盖活动时间">{device.overwriteActivityTime ? '已启用' : '已禁用'}</DescriptionsItem>
                  <DescriptionsItem label="描述信息" span={2}>
                    <span className="text-gray-500 italic">{device.description || "该设备暂无业务说明。"}</span>
                  </DescriptionsItem>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 bg-green-500 rounded-full"></div>
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">部署地理位置</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-[#f0f0f0] dark:border-[#303030] rounded-lg overflow-hidden grid grid-cols-1">
                    <DescriptionsItem label="位置名称">{device.locationName || '--'}</DescriptionsItem>
                    <DescriptionsItem label="经度 (Lng)" mono>{device.longitude?.toFixed(6) || '--'}</DescriptionsItem>
                    <DescriptionsItem label="纬度 (Lat)" mono>{device.latitude?.toFixed(6) || '--'}</DescriptionsItem>
                  </div>
                  <div className="h-[148px] rounded-lg border border-[#f0f0f0] dark:border-[#303030] overflow-hidden shadow-sm bg-gray-50 dark:bg-black/20">
                    {device.latitude && device.longitude ? (
                      <div ref={detailMapRef} className="w-full h-full"></div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 italic text-xs gap-2">
                        <i className="fas fa-map-marked-alt text-2xl"></i>
                        <span>暂无位置信息</span>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">安全与凭据</h4>
                </div>
                <div className="border border-[#f0f0f0] dark:border-[#303030] rounded-lg overflow-hidden grid grid-cols-1 sm:grid-cols-2">
                  <DescriptionsItem label="认证方式">
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {device.credentialType === 'access_token' ? 'Access Token 认证' : 
                       device.credentialType === 'mqtt_basic' ? 'MQTT 基础认证' : 
                       device.credentialType === 'x509' ? 'X.509 证书认证' : '未配置认证'}
                    </span>
                  </DescriptionsItem>
                  
                  {device.credentialType === 'access_token' && (
                    <DescriptionsItem label="访问令牌" mono>
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate max-w-[150px]">{device.accessToken || '--'}</span>
                        <button 
                          onClick={() => device.accessToken && navigator.clipboard.writeText(device.accessToken)}
                          className="text-gray-400 hover:text-blue-500 transition-colors ml-2"
                          title="复制"
                        >
                          <i className="far fa-copy text-xs"></i>
                        </button>
                      </div>
                    </DescriptionsItem>
                  )}

                  {device.credentialType === 'mqtt_basic' && (
                    <>
                      <DescriptionsItem label="Client ID" mono>{device.mqttClientId || '--'}</DescriptionsItem>
                      <DescriptionsItem label="用户名" mono>{device.mqttUsername || '--'}</DescriptionsItem>
                      <DescriptionsItem label="密码" mono>********</DescriptionsItem>
                    </>
                  )}

                  {device.credentialType === 'x509' && (
                    <DescriptionsItem label="证书状态" span={2}>
                      <div className="flex items-center gap-2">
                        <i className="fas fa-shield-check text-green-500"></i>
                        <span className="text-green-600 font-bold">已安装有效的双向 TLS 客户端证书</span>
                      </div>
                    </DescriptionsItem>
                  )}
                </div>
              </section>
            </div>
            
            <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
                  <i className="fas fa-microchip absolute -right-6 -bottom-6 text-8xl opacity-10 group-hover:scale-110 transition-transform duration-700"></i>
                  <h5 className="font-bold mb-4 flex items-center gap-2"><i className="fas fa-magic"></i> AI 智能概况</h5>
                  <p className="text-xs text-blue-100 leading-relaxed mb-6">
                    当前设备运行在“节能模式”，平均电池消耗率为 0.2%/h。基于环境温度 24.5°C，系统稳定性处于优异状态。
                  </p>
                  <button className="w-full py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-all border border-white/20 backdrop-blur-sm">查看完整诊断</button>
                </div>
            </div>
          </div>
        );

      case 'attributes':
        return (
          <div className="p-8 space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">设备属性管理</h4>
                </div>
                {selectedAttrKeys.size > 0 && (
                  <button 
                    onClick={() => triggerDeleteConfirm(Array.from(selectedAttrKeys))}
                    className="px-4 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-all flex items-center gap-2 shadow-sm animate-in zoom-in duration-200"
                  >
                    <i className="fas fa-trash-alt"></i> 批量删除 ({selectedAttrKeys.size})
                  </button>
                )}
              </div>
              <button 
                onClick={() => handleOpenAttrModal()}
                className="px-4 py-2 bg-[#1677ff] text-white rounded-lg text-xs font-bold hover:bg-blue-600 transition-all flex items-center gap-2"
              >
                <i className="fas fa-plus"></i> 添加属性
              </button>
            </div>

            <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-white/5 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-4 w-12">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                        checked={attributes.length > 0 && selectedAttrKeys.size === attributes.length}
                        onChange={toggleAttrSelectAll}
                      />
                    </th>
                    <th className="px-4 py-4">属性键 (Key)</th>
                    <th className="px-6 py-4">值 (Value)</th>
                    <th className="px-6 py-4">作用域 (Scope)</th>
                    <th className="px-6 py-4">最后更新时间</th>
                    <th className="px-6 py-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {attributes.map((attr, idx) => (
                    <tr key={attr.key} className={`hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group ${selectedAttrKeys.has(attr.key) ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                          checked={selectedAttrKeys.has(attr.key)}
                          onChange={() => toggleAttrSelectOne(attr.key)}
                        />
                      </td>
                      <td className="px-4 py-4 text-xs font-mono font-bold text-gray-700 dark:text-gray-300 group-hover:text-blue-500 transition-colors">{attr.key}</td>
                      <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-200">
                        {typeof attr.value === 'boolean' ? (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${attr.value ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-red-100 text-red-700 dark:bg-red-900/30'}`}>
                            {attr.value ? 'TRUE' : 'FALSE'}
                          </span>
                        ) : typeof attr.value === 'object' ? (
                          <span className="text-gray-400 italic text-[11px] font-mono">JSON Object</span>
                        ) : attr.value.toString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          attr.scope === 'client' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          attr.scope === 'shared' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                          'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                        }`}>
                          {attr.scope === 'client' ? '客户端' : attr.scope === 'shared' ? '共享' : '服务端'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[10px] text-gray-400 font-mono">{attr.lastUpdate}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleOpenAttrModal(attr)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                          >
                            <i className="fas fa-edit text-xs"></i>
                          </button>
                          <button 
                            onClick={() => triggerDeleteConfirm([attr.key])}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                          >
                            <i className="fas fa-trash-alt text-xs"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {attributes.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-gray-400 italic text-sm">暂无设备属性数据</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'telemetry':
        return (
          <div className="p-8 space-y-8 animate-in fade-in duration-500">
             <div className="flex flex-col xl:flex-row gap-8">
                {/* 遥测列表 */}
                <div className="flex-1 min-w-0 space-y-5">
                   <div className="flex justify-between items-center bg-white dark:bg-[#1f1f1f] p-4 rounded-xl border dark:border-white/5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600">
                          <i className="fas fa-stream"></i>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 dark:text-gray-200">实时遥测流 (Telemetry)</h4>
                          <p className="text-[10px] text-gray-400">查看并筛选设备实时上报的遥测变量</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-bold rounded-full border border-green-100 dark:border-green-800/20">
                         <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                         LIVE STREAMING
                      </div>
                   </div>

                   {/* 筛选工具栏 */}
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 dark:bg-white/5 p-4 rounded-xl border dark:border-white/5">
                      <div className="relative">
                        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                        <input 
                          type="text" 
                          placeholder="搜索变量名或键值..." 
                          className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#434343] rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                          value={telemetrySearch}
                          onChange={(e) => setTelemetrySearch(e.target.value)}
                        />
                      </div>
                      <select 
                        className="w-full px-3 py-2 bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#434343] rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={telemetryTypeFilter}
                        onChange={(e) => setTelemetryTypeFilter(e.target.value)}
                      >
                        <option value="all">所有变量类型</option>
                        <option value="double">双精度 (Double)</option>
                        <option value="integer">整数 (Integer)</option>
                        <option value="boolean">布尔 (Boolean)</option>
                        <option value="string">字符串 (String)</option>
                      </select>
                      <select 
                        className="w-full px-3 py-2 bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#434343] rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={telemetryStatusFilter}
                        onChange={(e) => setTelemetryStatusFilter(e.target.value)}
                      >
                        <option value="all">所有活跃状态</option>
                        <option value="active">最近活跃 (24h)</option>
                        <option value="inactive">非活跃</option>
                      </select>
                   </div>

                   <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
                      <table className="w-full text-left">
                         <thead>
                            <tr className="bg-gray-50 dark:bg-white/5 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                               <th className="px-6 py-4">键名 (Key)</th>
                               <th className="px-4 py-4">变量名称</th>
                               <th className="px-4 py-4">变量类型</th>
                               <th className="px-4 py-4">更新时间</th>
                               <th className="px-4 py-4">当前值</th>
                               <th className="px-6 py-4 text-right">操作</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {filteredTelemetry.map((item) => (
                              <tr 
                                key={item.key} 
                                onClick={() => setSelectedTelemetry(item)}
                                className={`hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors cursor-pointer group ${selectedTelemetry?.key === item.key ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                              >
                                 <td className="px-6 py-4 text-xs font-mono font-bold text-gray-400 group-hover:text-blue-500">{item.key}</td>
                                 <td className="px-4 py-4 text-sm font-semibold dark:text-gray-200">{item.label}</td>
                                 <td className="px-4 py-4">
                                    <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-white/10 text-gray-500 rounded uppercase font-bold">{item.type}</span>
                                 </td>
                                 <td className="px-4 py-4 text-[10px] text-gray-400 font-mono">{item.lastUpdate}</td>
                                 <td className="px-4 py-4">
                                    <span className="text-sm font-black text-blue-600 dark:text-blue-400">{item.currentValue}{item.unit}</span>
                                 </td>
                                 <td className="px-6 py-4 text-right">
                                    <button 
                                      onClick={(e) => handleActiveCollect(e, item)}
                                      disabled={isCollecting === item.key}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ml-auto ${
                                        isCollecting === item.key 
                                        ? 'bg-gray-100 text-gray-400 dark:bg-white/5' 
                                        : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                      }`}
                                    >
                                      {isCollecting === item.key ? (
                                        <><i className="fas fa-spinner animate-spin"></i> 采集... </>
                                      ) : (
                                        <><i className="fas fa-sync-alt"></i> 主动采集</>
                                      )}
                                    </button>
                                 </td>
                              </tr>
                            ))}
                            {filteredTelemetry.length === 0 && (
                              <tr>
                                <td colSpan={6} className="py-20 text-center text-gray-400 italic text-sm">未搜索到匹配的遥测变量</td>
                              </tr>
                            )}
                         </tbody>
                      </table>
                   </div>
                </div>

                {/* 趋势图表 - 布局优化 */}
                <div className="w-full xl:w-[420px] shrink-0 space-y-6">
                   <div className="bg-white dark:bg-[#141414] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm h-full flex flex-col">
                      <div className="flex items-center gap-4 mb-6">
                         <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center text-xl shadow-inner">
                            <i className="fas fa-chart-area"></i>
                         </div>
                         <div className="flex-1">
                            <h5 className="text-sm font-bold dark:text-gray-100 leading-tight">{selectedTelemetry?.label} 历史趋势</h5>
                            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">Historical Analysis</p>
                         </div>
                      </div>

                      {/* 时间范围筛选 - 紧凑排版 */}
                      <div className="space-y-4 mb-8 bg-gray-50/50 dark:bg-white/5 p-4 rounded-2xl border dark:border-white/5 shadow-inner">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">START TIME</label>
                            <input 
                              type="datetime-local" 
                              className="w-full px-2.5 py-2 bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#434343] rounded-xl text-[11px] outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm" 
                              value={startTime}
                              onChange={(e) => setStartTime(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">END TIME</label>
                            <input 
                              type="datetime-local" 
                              className="w-full px-2.5 py-2 bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#434343] rounded-xl text-[11px] outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm" 
                              value={endTime}
                              onChange={(e) => setEndTime(e.target.value)}
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-400 italic text-center px-4">“筛选指定时间区间的数据采样分析趋势曲线”</p>
                      </div>

                      <div className="flex-1 min-h-[320px] relative">
                         <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={historyData}>
                               <defs>
                                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                     <stop offset="5%" stopColor="#1677ff" stopOpacity={0.3}/>
                                     <stop offset="95%" stopColor="#1677ff" stopOpacity={0}/>
                                  </linearGradient>
                               </defs>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                               <XAxis dataKey="time" hide />
                               <YAxis 
                                 hide 
                                 domain={['auto', 'auto']}
                               />
                               <Tooltip 
                                 contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 12px 40px rgba(0,0,0,0.15)', background: 'rgba(255,255,255,0.95)' }}
                                 itemStyle={{ color: '#1677ff', fontWeight: 'bold' }}
                                 labelStyle={{ fontSize: '11px', color: '#8c8c8c', marginBottom: '4px' }}
                               />
                               <Area 
                                 type="monotone" 
                                 dataKey="value" 
                                 stroke="#1677ff" 
                                 strokeWidth={3} 
                                 fillOpacity={1} 
                                 fill="url(#colorVal)" 
                                 animationDuration={600}
                               />
                            </AreaChart>
                         </ResponsiveContainer>
                      </div>

                      <div className="mt-8 grid grid-cols-2 gap-4">
                         <div className="p-4 bg-gray-50 dark:bg-black/20 rounded-2xl border dark:border-white/5 shadow-sm">
                            <span className="text-[9px] text-gray-400 uppercase font-black tracking-widest block mb-1">Peak Recorded</span>
                            <span className="text-sm font-black text-gray-800 dark:text-gray-200">
                              {(Math.max(...historyData.map(d => d.value))).toFixed(2)}{selectedTelemetry?.unit}
                            </span>
                         </div>
                         <div className="p-4 bg-gray-50 dark:bg-black/20 rounded-2xl border dark:border-white/5 shadow-sm">
                            <span className="text-[9px] text-gray-400 uppercase font-black tracking-widest block mb-1">Volatility</span>
                            <span className="text-sm font-black text-green-500">STABLE (±1.2%)</span>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        );

      case 'calculated':
      case 'alarms':
      case 'events':
      case 'audit':
        return (
          <div className="p-24 text-center flex flex-col items-center animate-in fade-in duration-300">
            <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 border border-gray-100 dark:border-white/5">
              <i className={`fas ${tabs.find(t => t.id === activeTab)?.icon} text-3xl text-gray-300 dark:text-gray-600`}></i>
            </div>
            <h3 className="text-lg font-bold text-gray-400">模块内容正在紧锣密鼓地开发中...</h3>
            <p className="text-xs text-gray-400 mt-2 italic">敬请期待更多精彩功能</p>
          </div>
        );

      default:
        return <div className="p-24 text-center flex flex-col items-center text-gray-400 italic">模块内容加载中...</div>;
    }
  };

  const getStatusBadge = (status: DeviceStatus) => {
    const colors = {
      online: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      warning: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      offline: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    const labels = { online: '在线', warning: '警告', offline: '离线' };
    return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${colors[status]}`}>{labels[status]}</span>;
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-[#1f1f1f] border-b border-[#f0f0f0] dark:border-[#303030] px-8 py-6 rounded-t-xl shadow-sm transition-colors">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-all border border-gray-100 dark:border-[#303030] group">
            <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{device.name}</h3>
              {getStatusBadge(device.status)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-400 font-mono font-bold tracking-tight">{device.id}</span>
              <span className="text-gray-300 dark:text-gray-700">|</span>
              <span className="text-xs text-blue-500 font-bold uppercase">{device.type}</span>
              <span className="text-gray-300 dark:text-gray-700">|</span>
              <span className="text-xs text-gray-400">{device.customer}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-[#434343] text-gray-600 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-white/10 transition-all shadow-sm">远程重启</button>
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="px-5 py-2.5 bg-[#1677ff] text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-2"
            >
              <i className="fas fa-edit text-xs"></i> 编辑配置
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-[#1f1f1f] px-8 border-b border-[#f0f0f0] dark:border-[#303030] overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex gap-8 min-w-max">
          {tabs.map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)} 
              className={`flex items-center gap-2 py-5 text-sm font-bold transition-all border-b-2 -mb-[1px] relative ${
                activeTab === tab.id 
                  ? 'text-[#1677ff] border-[#1677ff]' 
                  : 'text-gray-400 border-transparent hover:text-gray-600 dark:hover:text-gray-200'
              }`}
            >
              <i className={`fas ${tab.icon} text-xs`}></i>
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-[#1f1f1f] min-h-[500px] transition-colors rounded-b-xl overflow-hidden pb-12 shadow-inner">
        {renderContent()}
      </div>

      {/* Attribute Add/Edit Modal */}
      {isAttrModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setIsAttrModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-[#1f1f1f] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border dark:border-[#303030]">
            <div className="px-6 py-4 border-b dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
              <h3 className="font-bold dark:text-gray-200">{editingAttr ? '编辑属性' : '添加属性'}</h3>
              <button onClick={() => setIsAttrModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleAttrSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">属性键 (Key) <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required 
                  disabled={!!editingAttr}
                  className={`${inputClasses} font-mono ${editingAttr ? 'bg-gray-50 dark:bg-black/20 opacity-60' : ''}`}
                  placeholder="例如: upload_interval"
                  value={attrFormData.key} 
                  onChange={e => setAttrFormData({...attrFormData, key: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">作用域 (Scope)</label>
                <select 
                  className={inputClasses} 
                  value={attrFormData.scope} 
                  onChange={e => setAttrFormData({...attrFormData, scope: e.target.value as AttributeScope})}
                >
                  <option value="client">客户端属性 (Client)</option>
                  <option value="shared">共享属性 (Shared)</option>
                  <option value="server">服务端属性 (Server)</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">值类型 (Value Type)</label>
                  <select 
                    className={inputClasses} 
                    value={attrValueType} 
                    onChange={e => {
                      const newType = e.target.value as ValueType;
                      setAttrValueType(newType);
                      // 重置或转换默认值
                      if (newType === 'boolean') setAttrFormData({...attrFormData, value: true});
                      else if (newType === 'json') setAttrFormData({...attrFormData, value: '{}'});
                      else setAttrFormData({...attrFormData, value: ''});
                    }}
                  >
                    <option value="string">字符串 (String)</option>
                    <option value="integer">整数 (Integer)</option>
                    <option value="double">双精度 (Double)</option>
                    <option value="boolean">布尔值 (Boolean)</option>
                    <option value="json">JSON 对象</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">属性值 (Value)</label>
                  {attrValueType === 'boolean' ? (
                    <select 
                      className={inputClasses} 
                      value={attrFormData.value.toString()} 
                      onChange={e => setAttrFormData({...attrFormData, value: e.target.value === 'true'})}
                    >
                      <option value="true">TRUE</option>
                      <option value="false">FALSE</option>
                    </select>
                  ) : attrValueType === 'json' ? (
                    <textarea 
                      className={`${inputClasses} font-mono text-[11px] leading-tight h-24`} 
                      placeholder='输入有效 JSON...'
                      value={attrFormData.value} 
                      onChange={e => setAttrFormData({...attrFormData, value: e.target.value})}
                    />
                  ) : (
                    <input 
                      type={attrValueType === 'integer' || attrValueType === 'double' ? 'number' : 'text'} 
                      step={attrValueType === 'double' ? 'any' : '1'}
                      className={inputClasses}
                      placeholder="输入属性值"
                      value={attrFormData.value} 
                      onChange={e => setAttrFormData({...attrFormData, value: e.target.value})} 
                    />
                  )}
                </div>
              </div>
              <p className="mt-1 text-[10px] text-gray-400 italic">支持字符串、数值、布尔值或 JSON 对象格式</p>

              <div className="pt-6 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsAttrModalOpen(false)} 
                  className="flex-1 py-3 text-sm font-bold text-gray-500 bg-gray-100 dark:bg-white/5 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95"
                >
                  确认
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-md" onClick={() => setIsDeleteConfirmOpen(false)}></div>
          <div className="relative bg-white dark:bg-[#1f1f1f] w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border dark:border-[#303030] p-8 text-center">
             <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
                <i className="fas fa-exclamation-triangle"></i>
             </div>
             <h3 className="text-xl font-black text-gray-800 dark:text-gray-100 mb-2">确认删除属性?</h3>
             <p className="text-sm text-gray-400 dark:text-gray-500 mb-8 leading-relaxed">
               您正在尝试删除 <span className="text-red-500 font-bold">{attrToDelete.length}</span> 个设备属性。此操作不可撤销，且可能会影响依赖这些参数的业务逻辑。
             </p>
             <div className="flex gap-4">
                <button 
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="flex-1 py-3.5 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-bold rounded-2xl hover:bg-gray-200 transition-all"
                >
                  放弃
                </button>
                <button 
                  onClick={confirmDeleteAttributes}
                  className="flex-1 py-3.5 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 shadow-xl shadow-red-500/30 transition-all active:scale-95"
                >
                  确定删除
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Edit Device Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-[#1f1f1f] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-transparent dark:border-[#303030]">
            <div className="px-6 py-4 border-b dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
              <h3 className="font-bold dark:text-gray-200">更新设备配置</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b dark:border-white/5">
                  <i className="fas fa-info-circle text-blue-500 text-sm"></i>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">基础设置</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">名称 <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required 
                      className={inputClasses} 
                      value={formData.name || ''} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      placeholder="输入设备名称"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">标签管理</label>
                    <TagInput 
                      tags={formData.labels || []} 
                      onChange={tags => setFormData({...formData, labels: tags})} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">配置模板</label>
                    <select className={inputClasses} value={formData.templateId || ''} onChange={e => setFormData({...formData, templateId: e.target.value})}>
                      <option value="">(空) 默认配置</option>
                      {templates.map(tpl => <option key={tpl.id} value={tpl.id}>{tpl.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">所属客户</label>
                    <select className={inputClasses} value={formData.customer} onChange={e => setFormData({...formData, customer: e.target.value})}>
                      {CUSTOMERS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-xl space-y-4 border dark:border-white/5">
                   <div className="flex flex-wrap gap-x-8 gap-y-3">
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id="edit-isGateway-detail" 
                          className="w-4 h-4 rounded text-[#1677ff] focus:ring-0" 
                          checked={formData.isGateway || false} 
                          onChange={e => setFormData({...formData, isGateway: e.target.checked})} 
                        />
                        <label htmlFor="edit-isGateway-detail" className="text-sm font-medium dark:text-gray-300 cursor-pointer">作为网关 (Gateway)</label>
                      </div>
                      <div className={`flex items-center gap-2 transition-opacity ${!formData.isGateway ? 'opacity-30' : 'opacity-100'}`}>
                        <input 
                          type="checkbox" 
                          id="edit-overwrite-detail" 
                          disabled={!formData.isGateway} 
                          className="w-4 h-4 rounded text-[#1677ff] focus:ring-0" 
                          checked={formData.overwriteActivityTime || false} 
                          onChange={e => setFormData({...formData, overwriteActivityTime: e.target.checked})} 
                        />
                        <label htmlFor="edit-overwrite-detail" className="text-sm font-medium dark:text-gray-300 cursor-pointer">覆盖级联节点活跃时间</label>
                      </div>
                   </div>
                   <div className="pt-3 border-t dark:border-white/5">
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id="edit-isPublic-detail" 
                          className="w-4 h-4 rounded text-[#1677ff] focus:ring-0" 
                          checked={formData.isPublic || false} 
                          onChange={e => setFormData({...formData, isPublic: e.target.checked})} 
                        />
                        <label htmlFor="edit-isPublic-detail" className="text-sm font-medium dark:text-gray-300 cursor-pointer">设置为公开资源</label>
                      </div>
                   </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">业务备注</label>
                  <textarea rows={2} className={inputClasses} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="输入设备业务描述..."></textarea>
                </div>

                <div className="space-y-4 pt-4 border-t dark:border-white/5">
                   <div className="flex items-center gap-2 pb-2">
                      <i className="fas fa-map-marker-alt text-green-500 text-sm"></i>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">地理位置部署</h4>
                   </div>
                   <LocationPicker 
                      lat={formData.latitude}
                      lng={formData.longitude}
                      locationName={formData.locationName}
                      onChange={(lat, lng, name) => setFormData({
                        ...formData,
                        latitude: lat,
                        longitude: lng,
                        locationName: name || formData.locationName
                      })}
                   />
                </div>
              </div>

              {/* Security Credentials */}
              <div className="space-y-4 pt-4 border-t dark:border-white/10">
                <div className="flex items-center gap-2 pb-2">
                  <i className="fas fa-shield-alt text-orange-500 text-sm"></i>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">安全与认证凭据</h4>
                </div>

                <div className="flex bg-gray-100 dark:bg-black/30 p-1 rounded-full border dark:border-white/10 mb-4">
                   {[
                      { id: 'access_token', label: 'Access Token' },
                      { id: 'x509', label: 'X.509' },
                      { id: 'mqtt_basic', label: 'MQTT Basic' },
                   ].map(type => (
                     <button
                       key={type.id}
                       type="button"
                       onClick={() => setFormData({...formData, credentialType: type.id as CredentialType})}
                       className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all ${
                         formData.credentialType === type.id 
                           ? 'bg-blue-600 text-white shadow-lg' 
                           : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                       }`}
                     >
                       {type.label}
                     </button>
                   ))}
                </div>

                <div className="space-y-4">
                  {formData.credentialType === 'access_token' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">访问令牌 <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <input 
                          type="text" 
                          className={`${inputClasses} font-mono pr-12`} 
                          value={formData.accessToken || ''} 
                          onChange={e => setFormData({...formData, accessToken: e.target.value})} 
                        />
                        <button 
                          type="button" 
                          onClick={() => setFormData({...formData, accessToken: generateRandomToken(16)})} 
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
                        >
                           <i className="fas fa-sync-alt text-xs"></i>
                        </button>
                      </div>
                    </div>
                  )}

                  {formData.credentialType === 'x509' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">PEM 格式证书数据</label>
                      <textarea rows={5} className={`${inputClasses} font-mono text-[11px] leading-tight`} value={formData.pemCertificate || ''} onChange={e => setFormData({...formData, pemCertificate: e.target.value})} placeholder="-----BEGIN CERTIFICATE-----"></textarea>
                    </div>
                  )}

                  {formData.credentialType === 'mqtt_basic' && (
                    <div className="space-y-4 bg-gray-50 dark:bg-black/10 p-4 rounded-xl border dark:border-white/5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1.5">Client ID</label>
                          <input type="text" className={`${inputClasses} font-mono`} value={formData.mqttClientId || ''} onChange={e => setFormData({...formData, mqttClientId: e.target.value})} placeholder="ClientID" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1.5">用户名</label>
                          <input type="text" className={`${inputClasses} font-mono`} value={formData.mqttUsername || ''} onChange={e => setFormData({...formData, mqttUsername: e.target.value})} placeholder="Username" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">密码</label>
                        <div className="relative">
                          <input 
                            type={showPassword ? 'text' : 'password'} 
                            className={`${inputClasses} font-mono pr-12`} 
                            value={formData.mqttPassword || ''} 
                            onChange={e => setFormData({...formData, mqttPassword: e.target.value})} 
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                             <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 flex gap-3 border-t dark:border-white/10 sticky bottom-0 bg-white dark:bg-[#1f1f1f] pb-2 mt-8">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)} 
                  className="flex-1 py-3 text-sm font-bold text-gray-500 bg-gray-100 dark:bg-white/5 rounded-xl hover:bg-gray-200"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all active:scale-95"
                >
                  提交保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceDetail;
