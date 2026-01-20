
import React, { useState } from 'react';
import { Device, DeviceType, DeviceStatus, DeviceTemplate, CredentialType } from '../types';
import { CUSTOMERS } from '../constants';
import DeviceDetail from './DeviceDetail';
import LocationPicker from './LocationPicker';

interface DeviceManagerProps {
  devices: Device[];
  templates: DeviceTemplate[];
  onAdd: (device: Device) => void;
  onRemove: (id: string) => void;
  onRemoveMany: (ids: string[]) => void;
  onUpdate: (device: Device) => void;
}

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

const DeviceManager: React.FC<DeviceManagerProps> = ({ devices, templates, onAdd, onRemove, onRemoveMany, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Device>>({
    name: '',
    labels: [],
    templateId: '',
    type: 'Sensor',
    isGateway: false,
    isPublic: false,
    overwriteActivityTime: false,
    description: '',
    customer: '未分配',
    status: 'online',
    credentialType: 'access_token',
    accessToken: '',
    pemCertificate: '',
    mqttClientId: '',
    mqttUsername: '',
    mqttPassword: '',
    latitude: 39.9042,
    longitude: 116.4074,
    locationName: ''
  });

  const resetForm = () => {
    setEditingDevice(null);
    setFormData({ 
      name: '', 
      labels: [], 
      templateId: '', 
      type: 'Sensor', 
      isGateway: false, 
      isPublic: false,
      overwriteActivityTime: false, 
      description: '', 
      customer: '未分配', 
      status: 'online', 
      credentialType: 'access_token',
      accessToken: generateRandomToken(16),
      pemCertificate: '',
      mqttClientId: '',
      mqttUsername: '',
      mqttPassword: '',
      latitude: 39.9042,
      longitude: 116.4074,
      locationName: ''
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  function generateRandomToken(len: number) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let res = '';
    for(let i=0; i<len; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
    return res;
  }

  const handleEditClick = (e: React.MouseEvent, device: Device) => {
    e.stopPropagation();
    setEditingDevice(device);
    setFormData({ 
      ...device,
      credentialType: device.credentialType || 'access_token',
      accessToken: device.accessToken || (device.credentialType === 'access_token' || !device.credentialType ? generateRandomToken(16) : '')
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingDevice) {
      const updated = {
        ...editingDevice,
        ...formData,
        type: formData.isGateway ? 'Gateway' : (formData.type === 'Gateway' ? 'Sensor' : formData.type),
        lastActive: new Date().toISOString().replace('T', ' ').split('.')[0],
      } as Device;
      onUpdate(updated);
      if (selectedDevice?.id === updated.id) {
        setSelectedDevice(updated);
      }
    } else {
      const newDevice: Device = {
        id: `DEV-${Math.floor(Math.random() * 900) + 100}`,
        name: formData.name!,
        labels: formData.labels || [],
        templateId: formData.templateId,
        type: (formData.isGateway ? 'Gateway' : formData.type as DeviceType || 'Sensor'),
        isGateway: formData.isGateway,
        isPublic: formData.isPublic || false,
        overwriteActivityTime: formData.overwriteActivityTime,
        description: formData.description,
        customer: formData.customer || '未分配',
        status: 'online',
        credentialType: (formData.credentialType as CredentialType) || 'access_token',
        accessToken: formData.accessToken || generateRandomToken(16),
        pemCertificate: formData.pemCertificate,
        mqttClientId: formData.mqttClientId,
        mqttUsername: formData.mqttUsername,
        mqttPassword: formData.mqttPassword,
        latitude: formData.latitude,
        longitude: formData.longitude,
        locationName: formData.locationName,
        lastActive: new Date().toISOString().replace('T', ' ').split('.')[0],
        createdAt: new Date().toISOString().replace('T', ' ').split('.')[0],
        battery: 100
      };
      onAdd(newDevice);
    }
    handleCloseModal();
  };

  const filteredDevices = devices.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusText = (status: DeviceStatus) => {
    switch(status) {
      case 'online': return '在线';
      case 'warning': return '警告';
      case 'offline': return '离线';
      default: return status;
    }
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedIds.size === filteredDevices.length && filteredDevices.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDevices.map(d => d.id)));
    }
  };

  const toggleSelectOne = (e: React.MouseEvent | React.ChangeEvent, id: string) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  if (selectedDevice) {
    return (
      <DeviceDetail 
        device={selectedDevice} 
        templates={templates}
        onBack={() => setSelectedDevice(null)} 
        onUpdate={(updated) => {
          onUpdate(updated);
          setSelectedDevice(updated);
        }}
      />
    );
  }

  const inputClasses = "w-full px-3 py-2.5 bg-white text-gray-800 border border-gray-300 dark:border-[#434343] dark:bg-[#141414] dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all";

  return (
    <div className="bg-white dark:bg-[#1f1f1f] rounded-lg border border-[#f0f0f0] dark:border-[#303030] shadow-sm overflow-hidden transition-colors duration-300">
      <div className="p-6 border-b border-[#f0f0f0] dark:border-[#303030] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">设备管理</h3>
          <p className="text-sm text-gray-400 dark:text-gray-500">管理并配置您的所有物联网设备资产</p>
        </div>
        <div className="flex gap-3">
          {selectedIds.size > 0 && (
            <button 
              onClick={() => onRemoveMany(Array.from(selectedIds))}
              className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-all flex items-center gap-2 shadow-sm animate-in fade-in zoom-in duration-200"
            >
              <i className="fas fa-trash-alt"></i> 批量删除 ({selectedIds.size})
            </button>
          )}
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 text-sm"></i>
            <input 
              type="text" 
              placeholder="搜索 ID 或名称..."
              className="pl-9 pr-4 py-2 bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#434343] rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => { 
              resetForm();
              setIsModalOpen(true); 
            }}
            className="px-4 py-2 bg-[#1677ff] text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-all flex items-center gap-2 shadow-sm"
          >
            <i className="fas fa-plus"></i> 添加设备
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 dark:bg-[#262626] text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
              <th className="px-6 py-4 w-12">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                  checked={selectedIds.size === filteredDevices.length && filteredDevices.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-4 py-4 min-w-[150px]">名称</th>
              <th className="px-4 py-4 min-w-[150px]">设备配置</th>
              <th className="px-4 py-4 min-w-[120px]">标签</th>
              <th className="px-4 py-4 min-w-[100px]">状态</th>
              <th className="px-4 py-4 min-w-[150px]">客户</th>
              <th className="px-4 py-4 min-w-[80px] text-center">公开</th>
              <th className="px-4 py-4 min-w-[100px] text-center">是否网关</th>
              <th className="px-4 py-4 min-w-[160px]">创建时间</th>
              <th className="px-6 py-4 w-32 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f0] dark:divide-[#303030]">
            {filteredDevices.map((device) => (
              <tr 
                key={device.id} 
                className={`hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group cursor-pointer ${selectedIds.has(device.id) ? 'bg-blue-50/40 dark:bg-blue-900/20' : ''}`}
                onClick={() => setSelectedDevice(device)}
              >
                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                    checked={selectedIds.has(device.id)}
                    onChange={(e) => toggleSelectOne(e, device.id)}
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 transition-colors">{device.name}</div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">{device.id}</div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                    {templates.find(t => t.id === device.templateId)?.name || '默认配置'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-1">
                    {device.labels && device.labels.length > 0 ? (
                      device.labels.slice(0, 2).map((label, idx) => (
                        <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-400 rounded">
                          {label}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">--</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      device.status === 'online' ? 'bg-green-500' : 
                      device.status === 'warning' ? 'bg-orange-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-xs text-gray-700 dark:text-gray-300">{getStatusText(device.status)}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-xs text-gray-600 dark:text-gray-400">{device.customer}</span>
                </td>
                <td className="px-4 py-4 text-center">
                  <div className="flex justify-center">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      device.isPublic 
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                    }`}>
                      {device.isPublic ? '公开' : '私有'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 text-center">
                  <div className="flex justify-center">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      device.isGateway 
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' 
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                    }`}>
                      {device.isGateway ? '网关' : '设备'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 text-[11px] text-gray-400 dark:text-gray-500">
                  {device.createdAt || '--'}
                </td>
                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={(e) => handleEditClick(e, device)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 text-gray-400 hover:text-blue-600 transition-all border border-transparent hover:border-gray-200"
                    >
                      <i className="fas fa-edit text-xs"></i>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onRemove(device.id); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 text-gray-400 hover:text-red-600 transition-all border border-transparent hover:border-gray-200"
                    >
                      <i className="fas fa-trash-alt text-xs"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Device Modal - 统一为 DeviceDetail 编辑配置风格 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={handleCloseModal}></div>
          <div className="relative bg-white dark:bg-[#1f1f1f] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-transparent dark:border-[#303030]">
            <div className="px-6 py-4 border-b dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
              <h3 className="font-bold dark:text-gray-200">{editingDevice ? '更新设备信息' : '添加新设备'}</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
              {/* 基础信息区 */}
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
                      value={formData.name} 
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
                          id="edit-isGateway" 
                          className="w-4 h-4 rounded text-[#1677ff] focus:ring-0" 
                          checked={formData.isGateway || false} 
                          onChange={e => {
                            const checked = e.target.checked;
                            setFormData({
                              ...formData, 
                              isGateway: checked,
                              type: checked ? 'Gateway' : (formData.type === 'Gateway' ? 'Sensor' : formData.type)
                            });
                          }} 
                        />
                        <label htmlFor="edit-isGateway" className="text-sm font-medium dark:text-gray-300 cursor-pointer">作为网关 (Gateway)</label>
                      </div>
                      <div className={`flex items-center gap-2 transition-opacity ${!formData.isGateway ? 'opacity-30' : 'opacity-100'}`}>
                        <input 
                          type="checkbox" 
                          id="edit-overwrite" 
                          disabled={!formData.isGateway} 
                          className="w-4 h-4 rounded text-[#1677ff] focus:ring-0" 
                          checked={formData.overwriteActivityTime || false} 
                          onChange={e => setFormData({...formData, overwriteActivityTime: e.target.checked})} 
                        />
                        <label htmlFor="edit-overwrite" className="text-sm font-medium dark:text-gray-300 cursor-pointer">覆盖级联节点活跃时间</label>
                      </div>
                   </div>
                   <div className="pt-3 border-t dark:border-white/5">
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id="edit-isPublic" 
                          className="w-4 h-4 rounded text-[#1677ff] focus:ring-0" 
                          checked={formData.isPublic || false} 
                          onChange={e => setFormData({...formData, isPublic: e.target.checked})} 
                        />
                        <label htmlFor="edit-isPublic" className="text-sm font-medium dark:text-gray-300 cursor-pointer">设置为公开资源</label>
                      </div>
                   </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">业务备注</label>
                  <textarea rows={2} className={inputClasses} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="输入设备业务描述..."></textarea>
                </div>

                {/* 地理位置分节 */}
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

              {/* 凭据管理分节 */}
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

                <div className="space-y-4 animate-in fade-in duration-300">
                  {formData.credentialType === 'access_token' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">访问令牌 <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <input 
                          type="text" 
                          className={`${inputClasses} font-mono pr-12`} 
                          value={formData.accessToken} 
                          onChange={e => setFormData({...formData, accessToken: e.target.value})} 
                        />
                        <button 
                          type="button" 
                          onClick={() => setFormData({...formData, accessToken: generateRandomToken(16)})} 
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
                          title="重置令牌"
                        >
                           <i className="fas fa-sync-alt text-xs"></i>
                        </button>
                      </div>
                    </div>
                  )}

                  {formData.credentialType === 'x509' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">PEM 格式证书数据</label>
                      <textarea rows={5} className={`${inputClasses} font-mono text-[11px] leading-tight`} value={formData.pemCertificate} onChange={e => setFormData({...formData, pemCertificate: e.target.value})} placeholder="-----BEGIN CERTIFICATE-----"></textarea>
                    </div>
                  )}

                  {formData.credentialType === 'mqtt_basic' && (
                    <div className="space-y-4 bg-gray-50 dark:bg-black/10 p-4 rounded-xl border dark:border-white/5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1.5">Client ID</label>
                          <input type="text" className={`${inputClasses} font-mono`} value={formData.mqttClientId} onChange={e => setFormData({...formData, mqttClientId: e.target.value})} placeholder="ClientID" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1.5">用户名</label>
                          <input type="text" className={`${inputClasses} font-mono`} value={formData.mqttUsername} onChange={e => setFormData({...formData, mqttUsername: e.target.value})} placeholder="Username" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">密码</label>
                        <div className="relative">
                          <input 
                            type={showPassword ? 'text' : 'password'} 
                            className={`${inputClasses} font-mono pr-12`} 
                            value={formData.mqttPassword} 
                            onChange={e => setFormData({...formData, mqttPassword: e.target.value})} 
                            placeholder="Password"
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)} 
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                          >
                             <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 底部操作区 */}
              <div className="pt-6 flex gap-3 border-t dark:border-white/10 sticky bottom-0 bg-white dark:bg-[#1f1f1f] pb-2 mt-8">
                <button 
                  type="button" 
                  onClick={handleCloseModal} 
                  className="flex-1 py-3 text-sm font-bold text-gray-500 bg-gray-100 dark:bg-white/5 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all active:scale-95"
                >
                  {editingDevice ? '提交保存' : '确认添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceManager;
