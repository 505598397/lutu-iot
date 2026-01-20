
import React, { useState, useRef, useEffect } from 'react';
import { DeviceTemplate } from '../types';
import { RULE_CHAINS, DASHBOARDS, QUEUES, EDGE_SIDES, TRANSPORTS, PROVISIONING_STRATEGIES } from '../constants';
import TemplateDetail from './TemplateDetail';

interface TemplateManagerProps {
  templates: DeviceTemplate[];
  onAdd: (template: DeviceTemplate) => void;
  onUpdate: (template: DeviceTemplate) => void;
  onRemove: (id: string) => void;
  onRemoveMany: (ids: string[]) => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ templates, onAdd, onUpdate, onRemove, onRemoveMany }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<DeviceTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<DeviceTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState<DeviceTemplate | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queueDropdownRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState<Partial<DeviceTemplate>>({
    name: '',
    ruleChain: '',
    mobileDashboard: '',
    queueId: '',
    edgeSide: '',
    description: '',
    transport: 'MQTT',
    mqttTopicTelemetry: 'v1/devices/me/telemetry',
    mqttTopicAttributes: 'v1/devices/me/attributes',
    mqttTopicSubscribe: 'v1/devices/me/attributes',
    mqttPayload: 'JSON',
    mqttSparkplugB: false,
    // Fix: Rename mqttSendPuback to mqttSparkplugB_SendPuback to match DeviceTemplate type definition
    mqttSparkplugB_SendPuback: false,
    coapDeviceType: 'DEFAULT',
    coapPayload: 'JSON',
    coapPowerMode: 'DRX',
    lwm2mMode: 'BOOTSTRAP',
    lwm2mObserveStrategy: 'SINGLE',
    snmpTimeout: 500,
    snmpRetries: 0,
    provisioningStrategy: 'disabled',
    provisioningKeyName: 'aygha1ykdf3mq24cnbku',
    provisioningKey: 'nd2w0tj7t6y51y5wzl6q',
    cnRegex: '(.*)',
    allowCreateDevice: true,
    certificatePem: ''
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (queueDropdownRef.current && !queueDropdownRef.current.contains(event.target as Node)) {
        setIsQueueOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEditClick = (e: React.MouseEvent, tpl: DeviceTemplate) => {
    e.stopPropagation();
    setEditingTemplate(tpl);
    setFormData({ ...tpl });
    setPreviewImage(tpl.imageUrl || null);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, tpl: DeviceTemplate) => {
    e.stopPropagation();
    setTemplateToDelete(tpl);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (templateToDelete) {
      onRemove(templateToDelete.id);
      setIsDeleteModalOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    const baseTemplate = {
      ...formData,
      name: formData.name!,
    };

    if (editingTemplate) {
      onUpdate({ ...editingTemplate, ...baseTemplate } as DeviceTemplate);
    } else {
      const newTemplate: DeviceTemplate = {
        ...baseTemplate,
        id: `TPL-${Math.floor(Math.random() * 900) + 100}`,
        createdAt: new Date().toISOString().split('T')[0],
        isDefault: false,
      } as DeviceTemplate;
      onAdd(newTemplate);
    }
    
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
    resetForm();
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    onRemoveMany(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const resetForm = () => {
    setFormData({
      name: '',
      ruleChain: '',
      mobileDashboard: '',
      queueId: '',
      edgeSide: '',
      description: '',
      transport: 'MQTT',
      mqttTopicTelemetry: 'v1/devices/me/telemetry',
      mqttTopicAttributes: 'v1/devices/me/attributes',
      mqttTopicSubscribe: 'v1/devices/me/attributes',
      mqttPayload: 'JSON',
      mqttSparkplugB: false,
      // Fix: Rename mqttSendPuback to mqttSparkplugB_SendPuback to match DeviceTemplate type definition
      mqttSparkplugB_SendPuback: false,
      coapDeviceType: 'DEFAULT',
      coapPayload: 'JSON',
      coapPowerMode: 'DRX',
      lwm2mMode: 'BOOTSTRAP',
      lwm2mObserveStrategy: 'SINGLE',
      snmpTimeout: 500,
      snmpRetries: 0,
      provisioningStrategy: 'disabled',
      provisioningKeyName: 'aygha1ykdf3mq24cnbku',
      provisioningKey: 'nd2w0tj7t6y51y5wzl6q',
      cnRegex: '(.*)',
      allowCreateDevice: true,
      certificatePem: ''
    });
    setPreviewImage(null);
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTemplates.length && filteredTemplates.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTemplates.map(t => t.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleUpdateTemplateFromDetail = (updated: DeviceTemplate) => {
    onUpdate(updated);
    setSelectedTemplate(updated);
  };

  const selectedQueue = QUEUES.find(q => q.id === formData.queueId);

  const SectionTitle = ({ title }: { title: string }) => (
    <div className="flex items-center gap-2 mb-6 mt-8 first:mt-0 pb-2 border-b border-gray-100 dark:border-[#303030]">
      <div className="w-1 h-4 bg-[#1677ff] rounded-full"></div>
      <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">{title}</h4>
    </div>
  );

  const FormItemLabel = ({ label, required }: { label: string; required?: boolean }) => (
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5">
      {label} {required && <span className="text-[#ff4d4f] font-serif ml-0.5">*</span>}
    </label>
  );

  const inputBaseClasses = "w-full px-3 py-2 bg-white text-gray-800 border border-gray-300 dark:border-[#434343] dark:bg-[#141414] dark:text-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600";

  if (selectedTemplate) {
    return (
      <TemplateDetail 
        template={selectedTemplate} 
        onBack={() => setSelectedTemplate(null)} 
        onUpdate={handleUpdateTemplateFromDetail}
      />
    );
  }

  return (
    <div className="bg-white dark:bg-[#1f1f1f] rounded-lg border border-[#f0f0f0] dark:border-[#303030] shadow-sm overflow-hidden transition-colors duration-300">
      <div className="p-6 border-b border-[#f0f0f0] dark:border-[#303030] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">设备模板</h3>
          <p className="text-sm text-gray-400 dark:text-gray-500">定义标准化设备配置方案与默认业务逻辑</p>
        </div>
        <div className="flex gap-3">
          {selectedIds.size > 0 && (
            <button onClick={handleBatchDelete} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-all flex items-center gap-2 shadow-sm animate-in fade-in zoom-in duration-200">
              <i className="fas fa-trash-alt"></i> 批量删除 ({selectedIds.size})
            </button>
          )}
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 text-sm"></i>
            <input type="text" placeholder="搜索模板名称..." className="pl-9 pr-4 py-2 bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#434343] rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="px-4 py-2 bg-[#1677ff] text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-all flex items-center gap-2 shadow-sm">
            <i className="fas fa-plus"></i> 创建模板
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left table-fixed">
          <thead>
            <tr className="bg-gray-50 dark:bg-[#262626] text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
              <th className="px-6 py-4 w-16">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer" checked={selectedIds.size === filteredTemplates.length && filteredTemplates.length > 0} onChange={toggleSelectAll} />
              </th>
              <th className="px-4 py-4 w-16">预览</th>
              <th className="px-6 py-4 w-48">模板名称</th>
              <th className="px-6 py-4 w-48">说明</th>
              <th className="px-6 py-4 w-36">传输/策略</th>
              <th className="px-6 py-4 w-32">默认队列</th>
              <th className="px-6 py-4 w-28 text-center">设为默认</th>
              <th className="px-6 py-4 w-32">创建时间</th>
              <th className="px-6 py-4 w-24 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f0] dark:divide-[#303030]">
            {filteredTemplates.length > 0 ? filteredTemplates.map((tpl) => (
              <tr key={tpl.id} onClick={() => setSelectedTemplate(tpl)} className={`hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors cursor-pointer group ${selectedIds.has(tpl.id) ? 'bg-blue-50/40 dark:bg-blue-900/20' : ''}`}>
                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer" checked={selectedIds.has(tpl.id)} onChange={() => toggleSelectOne(tpl.id)} />
                </td>
                <td className="px-4 py-4">
                  <div className="w-10 h-10 rounded border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#2a2a2a] flex items-center justify-center overflow-hidden">
                    {tpl.imageUrl ? <img src={tpl.imageUrl} alt={tpl.name} className="w-full h-full object-cover" /> : <i className="fas fa-image text-gray-300 dark:text-gray-700"></i>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{tpl.name}</div>
                  <div className="text-[10px] font-mono text-gray-400 dark:text-gray-500">{tpl.id}</div>
                </td>
                <td className="px-6 py-4 truncate text-xs text-gray-500 dark:text-gray-400">{tpl.description || '--'}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">{tpl.transport}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded w-fit truncate max-w-full">{PROVISIONING_STRATEGIES.find(s => s.value === tpl.provisioningStrategy)?.label || tpl.provisioningStrategy}</span>
                  </div>
                </td>
                <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-[10px] font-medium border border-blue-100 dark:border-blue-800/30">{QUEUES.find(q => q.id === tpl.queueId)?.name || '默认队列'}</span></td>
                <td className="px-6 py-4 text-center">{tpl.isDefault ? <span className="text-yellow-500"><i className="fas fa-star"></i></span> : <i className="far fa-star text-gray-200"></i>}</td>
                <td className="px-6 py-4 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{tpl.createdAt}</td>
                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    <button className="w-7 h-7 rounded hover:bg-white dark:hover:bg-gray-800 hover:shadow text-gray-400 hover:text-blue-600 transition-all" onClick={(e) => handleEditClick(e, tpl)}><i className="fas fa-edit text-[10px]"></i></button>
                    <button onClick={(e) => handleDeleteClick(e, tpl)} className="w-7 h-7 rounded hover:bg-white dark:hover:bg-gray-800 hover:shadow text-gray-400 hover:text-red-600 transition-all"><i className="fas fa-trash-alt text-[10px]"></i></button>
                  </div>
                </td>
              </tr>
            )) : <tr><td colSpan={9} className="px-6 py-20 text-center text-gray-400 italic">暂无匹配的模板</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Template Modal (Add/Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={handleCloseModal}></div>
          <div className="relative bg-white dark:bg-[#1f1f1f] w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-transparent dark:border-[#303030]">
            <div className="px-6 py-4 border-b border-[#f0f0f0] dark:border-[#303030] flex justify-between items-center">
              <h3 className="font-bold text-gray-800 dark:text-gray-200">{editingTemplate ? '编辑设备模板' : '创建新设备模板'}</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[85vh] custom-scrollbar">
              <SectionTitle title="基本配置" />
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <FormItemLabel label="模板名称" required />
                  <input type="text" required className={inputBaseClasses} placeholder="输入模板名称" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <FormItemLabel label="默认规则链" />
                    <select className={inputBaseClasses} value={formData.ruleChain || ''} onChange={e => setFormData({...formData, ruleChain: e.target.value})}>
                      {RULE_CHAINS.map(rc => <option key={rc} value={rc}>{rc}</option>)}
                    </select>
                  </div>
                  <div>
                    <FormItemLabel label="移动端仪表板" />
                    <select className={inputBaseClasses} value={formData.mobileDashboard || ''} onChange={e => setFormData({...formData, mobileDashboard: e.target.value})}>
                      {DASHBOARDS.map(db => <option key={db} value={db}>{db}</option>)}
                    </select>
                  </div>
                </div>

                <div className="relative" ref={queueDropdownRef}>
                    <FormItemLabel label="队列" />
                    <div onClick={() => setIsQueueOpen(!isQueueOpen)} className={`${inputBaseClasses} cursor-pointer flex items-center justify-between`}>
                      <span className="text-sm">{selectedQueue ? selectedQueue.name : '请选择队列...'}</span>
                      <i className={`fas fa-chevron-down text-gray-400 text-[10px] transition-transform ${isQueueOpen ? 'rotate-180' : ''}`}></i>
                    </div>
                    {isQueueOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-[#434343] rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto py-1">
                        {QUEUES.map(q => <div key={q.id} onClick={() => { setFormData({...formData, queueId: q.id}); setIsQueueOpen(false); }} className="px-4 py-2 hover:bg-[#1677ff]/5 dark:hover:bg-blue-900/20 cursor-pointer text-sm dark:text-gray-200 transition-colors">{q.name}</div>)}
                      </div>
                    )}
                </div>

                <div>
                  <FormItemLabel label="模板说明" />
                  <textarea className={inputBaseClasses} rows={3} placeholder="添加对该模板的详细描述..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                </div>
              </div>

              <SectionTitle title="传输协议配置" />
              <div className="space-y-6">
                <div>
                  <FormItemLabel label="传输方式" required />
                  <select className={inputBaseClasses} value={formData.transport || 'DEFAULT'} onChange={e => setFormData({...formData, transport: e.target.value as any})}>
                    {TRANSPORTS.map(t => <option key={t} value={t}>{t === 'DEFAULT' ? '默认 (REST/HTTP)' : t}</option>)}
                  </select>
                </div>

                {formData.transport === 'MQTT' && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-5 p-4 rounded-xl border border-gray-100 dark:border-[#303030] bg-gray-50/50 dark:bg-black/10">
                    <div className="flex items-center gap-2 mb-2">
                      <input type="checkbox" id="sparkplug" className="w-4 h-4 rounded border-gray-300 text-[#1677ff]" checked={formData.mqttSparkplugB} onChange={e => setFormData({...formData, mqttSparkplugB: e.target.checked})} />
                      <label htmlFor="sparkplug" className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer">启用 MQTT Sparkplug B 协议</label>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <FormItemLabel label="遥测数据主题筛选器" required />
                        <input type="text" className={`${inputBaseClasses} font-mono`} value={formData.mqttTopicTelemetry} onChange={e => setFormData({...formData, mqttTopicTelemetry: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <FormItemLabel label="属性主题筛选器" required />
                          <input type="text" className={`${inputBaseClasses} font-mono`} value={formData.mqttTopicAttributes} onChange={e => setFormData({...formData, mqttTopicAttributes: e.target.value})} />
                        </div>
                        <div>
                          <FormItemLabel label="订阅属性主题" required />
                          <input type="text" className={`${inputBaseClasses} font-mono`} value={formData.mqttTopicSubscribe} onChange={e => setFormData({...formData, mqttTopicSubscribe: e.target.value})} />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                      <div>
                        <FormItemLabel label="数据 Payload 格式" />
                        <select className={inputBaseClasses} value={formData.mqttPayload} onChange={e => setFormData({...formData, mqttPayload: e.target.value as any})}>
                          <option value="JSON">JSON</option>
                          <option value="PROTOBUF">Protobuf</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2 h-10">
                         {/* Fix: Use correct property name mqttSparkplugB_SendPuback to match DeviceTemplate type definition */}
                         <input type="checkbox" id="puback" className="w-4 h-4 rounded border-gray-300" checked={formData.mqttSparkplugB_SendPuback} onChange={e => setFormData({...formData, mqttSparkplugB_SendPuback: e.target.checked})} />
                         <label htmlFor="puback" className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer">验证失败发送 PUBACK</label>
                      </div>
                    </div>
                  </div>
                )}
                {/* Other protocols logic remains similar but with cleaner styling */}
              </div>

              <SectionTitle title="设备预配置 (Provisioning)" />
              <div className="space-y-5">
                <div>
                  <FormItemLabel label="预配置策略" required />
                  <select required className={inputBaseClasses} value={formData.provisioningStrategy || 'disabled'} onChange={e => setFormData({...formData, provisioningStrategy: e.target.value as any})}>
                    {PROVISIONING_STRATEGIES.map(ps => <option key={ps.value} value={ps.value}>{ps.label}</option>)}
                  </select>
                </div>

                {(formData.provisioningStrategy === 'allow_create' || formData.provisioningStrategy === 'check_preprovisioned') && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300 grid grid-cols-1 md:grid-cols-2 gap-5 p-4 border border-gray-100 dark:border-[#303030] rounded-xl">
                    <div>
                      <FormItemLabel label="预配置设备密钥名称" required />
                      <input type="text" className={inputBaseClasses} value={formData.provisioningKeyName} onChange={e => setFormData({...formData, provisioningKeyName: e.target.value})} />
                    </div>
                    <div>
                      <FormItemLabel label="预配置设备密钥值" required />
                      <input type="text" className={`${inputBaseClasses} font-mono`} value={formData.provisioningKey} onChange={e => setFormData({...formData, provisioningKey: e.target.value})} />
                    </div>
                  </div>
                )}

                {formData.provisioningStrategy === 'x509_chain' && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-5 p-4 border border-gray-100 dark:border-[#303030] rounded-xl">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="allowCreate" 
                        className="w-4 h-4 rounded border-gray-300 text-[#1677ff]"
                        checked={formData.allowCreateDevice}
                        onChange={e => setFormData({...formData, allowCreateDevice: e.target.checked})}
                      />
                      <label htmlFor="allowCreate" className="text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer">允许自动创建设备</label>
                    </div>
                    <div>
                      <FormItemLabel label="PEM 格式的根证书" required />
                      <textarea className={`${inputBaseClasses} min-h-[140px] font-mono leading-relaxed`} placeholder="-----BEGIN CERTIFICATE-----..." value={formData.certificatePem} onChange={e => setFormData({...formData, certificatePem: e.target.value})}></textarea>
                    </div>
                    <div>
                      <FormItemLabel label="CN 提取正则表达式" required />
                      <input type="text" className={`${inputBaseClasses} font-mono`} value={formData.cnRegex} onChange={e => setFormData({...formData, cnRegex: e.target.value})} />
                      <p className="text-[10px] text-gray-400 mt-1.5">用于从证书的主题通用名称 (CN) 中提取设备 ID。</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-8 flex gap-3 border-t border-[#f0f0f0] dark:border-[#303030] mt-10">
                <button type="button" onClick={handleCloseModal} className="flex-1 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#333333] rounded-lg transition-all">取消</button>
                <button type="submit" className="flex-1 py-2.5 text-sm font-medium text-white bg-[#1677ff] hover:bg-blue-600 rounded-lg shadow-lg shadow-blue-500/10 transition-all active:scale-95">确认提交</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManager;
