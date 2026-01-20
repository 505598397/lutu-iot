
import React, { useState, useRef, useEffect } from 'react';
import { DeviceTemplate, AlarmRule, AuditLog, TemplateVersion } from '../types';
import { QUEUES, PROVISIONING_STRATEGIES, RULE_CHAINS, DASHBOARDS, EDGE_SIDES, TRANSPORTS } from '../constants';

interface TemplateDetailProps {
  template: DeviceTemplate;
  onBack: () => void;
  onUpdate: (template: DeviceTemplate) => void;
}

// 模拟 Ant Design 的 Descriptions.Item 组件，确保与设备详情页风格一致
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

const TemplateDetail: React.FC<TemplateDetailProps> = ({ template, onBack, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queueDropdownRef = useRef<HTMLDivElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(template.imageUrl || null);
  
  const [formData, setFormData] = useState<Partial<DeviceTemplate>>({ ...template });

  useEffect(() => {
    setFormData({ ...template });
    setPreviewImage(template.imageUrl || null);
  }, [template]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (queueDropdownRef.current && !queueDropdownRef.current.contains(event.target as Node)) {
        setIsQueueOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    const updatedTemplate: DeviceTemplate = {
      ...template,
      ...formData,
      name: formData.name!,
    } as DeviceTemplate;
    
    onUpdate(updatedTemplate);
    setIsModalOpen(false);
  };

  const selectedQueue = QUEUES.find(q => q.id === formData.queueId);

  const SectionTitle = ({ title, icon }: { title: string; icon?: string }) => (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-1 h-4 bg-[#1677ff] rounded-full"></div>
      <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
        {icon && <i className={`fas ${icon} text-blue-500/80`}></i>}
        {title}
      </h4>
    </div>
  );

  const FormItemLabel = ({ label, required }: { label: string; required?: boolean }) => (
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5">
      {label} {required && <span className="text-[#ff4d4f] font-serif ml-0.5">*</span>}
    </label>
  );

  const inputBaseClasses = "w-full px-3 py-2 bg-white text-gray-800 border border-gray-300 dark:border-[#434343] dark:bg-[#141414] dark:text-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600";

  const tabs = [
    { id: 'details', label: '详情', icon: 'fa-info-circle' },
    { id: 'calculated', label: '计算字段', icon: 'fa-calculator' },
    { id: 'alarms', label: '告警规则', icon: 'fa-bell' },
    { id: 'audit', label: '审计日志', icon: 'fa-history' },
    { id: 'versions', label: '版本控制', icon: 'fa-code-branch' },
  ];

  const MOCK_ALARMS: AlarmRule[] = [
    { id: 'AL-001', name: '电池电量过低', severity: 'CRITICAL', condition: 'battery < 10', enabled: true },
    { id: 'AL-002', name: '温度异常升高', severity: 'MAJOR', condition: 'temperature > 45', enabled: true },
    { id: 'AL-003', name: '设备离线超时', severity: 'WARNING', condition: 'status == offline', enabled: false },
  ];

  const MOCK_AUDIT: AuditLog[] = [
    { id: 'L-001', time: '2023-11-20 14:20:01', user: 'admin', type: 'UPDATE_TEMPLATE', status: 'SUCCESS', details: '修改了传输协议配置' },
    { id: 'L-002', time: '2023-11-18 09:15:44', user: 'dev_user', type: 'CREATE_ALARM', status: 'SUCCESS', details: '新增告警规则：电池电量过低' },
    { id: 'L-003', time: '2023-11-15 11:30:22', user: 'admin', type: 'UPDATE_PROVISIONING', status: 'FAILURE', details: '尝试修改预配置策略失败：权限不足' },
  ];

  const MOCK_VERSIONS: TemplateVersion[] = [
    { id: 'V-001', version: 'v1.2.0', creator: 'admin', createdAt: '2023-11-20', remark: '正式发布版，优化了 MQTT 重连机制', active: true },
    { id: 'V-002', version: 'v1.1.5', creator: 'dev_user', createdAt: '2023-10-15', remark: '测试版，增加 LWM2M 支持', active: false },
    { id: 'V-003', version: 'v1.0.0', creator: 'system', createdAt: '2023-09-01', remark: '初始版本', active: false },
  ];

  const renderProvisioningDetails = () => {
    const strategy = PROVISIONING_STRATEGIES.find(s => s.value === template.provisioningStrategy);
    
    return (
      <div className="border border-[#f0f0f0] dark:border-[#303030] rounded-lg overflow-hidden">
        <DescriptionsItem label="策略方案">
          <div className="flex items-center gap-2">
            <i className="fas fa-shield-halved text-indigo-500 text-xs"></i>
            <span className="font-bold">{strategy?.label || '未配置'}</span>
          </div>
        </DescriptionsItem>
        
        {(template.provisioningStrategy === 'allow_create' || template.provisioningStrategy === 'check_preprovisioned') && (
          <>
            <DescriptionsItem label="密钥名称" mono>
              <div className="flex justify-between w-full items-center">
                <span className="truncate">{template.provisioningKeyName || '--'}</span>
                <button onClick={() => navigator.clipboard.writeText(template.provisioningKeyName || '')} className="text-blue-500 hover:text-blue-700 ml-2">
                  <i className="far fa-copy"></i>
                </button>
              </div>
            </DescriptionsItem>
            <DescriptionsItem label="预配置密钥" mono>
              <div className="flex justify-between w-full items-center">
                <span className="truncate">{template.provisioningKey || '--'}</span>
                <button onClick={() => navigator.clipboard.writeText(template.provisioningKey || '')} className="text-blue-500 hover:text-blue-700 ml-2">
                  <i className="far fa-copy"></i>
                </button>
              </div>
            </DescriptionsItem>
          </>
        )}

        {template.provisioningStrategy === 'x509_chain' && (
          <>
            <DescriptionsItem label="自动创建设备">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${template.allowCreateDevice ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                {template.allowCreateDevice ? '已启用' : '已禁用'}
              </span>
            </DescriptionsItem>
            <DescriptionsItem label="正则筛选 (CN)" mono>{template.cnRegex || '(.*)'}</DescriptionsItem>
          </>
        )}

        {template.provisioningStrategy === 'disabled' && (
          <DescriptionsItem label="详情">
            <span className="text-gray-400 italic">自动预配置功能当前处于禁用状态</span>
          </DescriptionsItem>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'details':
        return (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 p-8">
            <div className="xl:col-span-2 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* 基础属性配置 - Descriptions 风格 */}
              <section>
                <SectionTitle title="基础属性配置" />
                <div className="border border-[#f0f0f0] dark:border-[#303030] rounded-lg overflow-hidden grid grid-cols-1 sm:grid-cols-2">
                  <DescriptionsItem label="模板 ID" mono>{template.id}</DescriptionsItem>
                  <DescriptionsItem label="创建日期">{template.createdAt}</DescriptionsItem>
                  <DescriptionsItem label="关联规则链">{template.ruleChain}</DescriptionsItem>
                  <DescriptionsItem label="消息队列">{QUEUES.find(q => q.id === template.queueId)?.name || 'Main'}</DescriptionsItem>
                  <DescriptionsItem label="默认模板">{template.isDefault ? '是' : '否'}</DescriptionsItem>
                  <DescriptionsItem label="移动端仪表板">{template.mobileDashboard || '--'}</DescriptionsItem>
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section>
                  <SectionTitle title="协议与传输" />
                  <div className="border border-[#f0f0f0] dark:border-[#303030] rounded-lg overflow-hidden">
                    <DescriptionsItem label="传输协议">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-network-wired text-blue-500 text-xs"></i>
                        <span className="font-bold">{template.transport}</span>
                      </div>
                    </DescriptionsItem>
                    
                    {template.transport === 'MQTT' && (
                      <>
                        <DescriptionsItem label="遥测主题" mono>{template.mqttTopicTelemetry}</DescriptionsItem>
                        <DescriptionsItem label="属性主题" mono>{template.mqttTopicAttributes}</DescriptionsItem>
                        <DescriptionsItem label="Payload 格式">
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-bold">
                            {template.mqttPayload || 'JSON'}
                          </span>
                        </DescriptionsItem>
                      </>
                    )}
                    {template.transport === 'DEFAULT' && (
                       <DescriptionsItem label="协议详情">
                         <span className="text-xs text-gray-500 italic">使用 SmartLink 标准 Restful API。</span>
                       </DescriptionsItem>
                    )}
                  </div>
                </section>

                <section>
                  <SectionTitle title="预配置详情" />
                  {renderProvisioningDetails()}
                </section>
              </div>
            </div>

            <div className="space-y-8">
              <section>
                <SectionTitle title="业务说明" />
                <div className="bg-[#fafafa] dark:bg-[#1d1d1d] p-5 rounded-xl border border-[#f0f0f0] dark:border-[#303030] shadow-inner">
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic">
                    {template.description || "该模板尚未定义任何业务描述信息。"}
                  </p>
                </div>
              </section>
              
              {template.imageUrl && (
                <section>
                   <SectionTitle title="设备预览" />
                   <div className="rounded-xl overflow-hidden border dark:border-white/5 shadow-md bg-white dark:bg-black/20">
                      <img src={template.imageUrl} alt="preview" className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity" />
                   </div>
                </section>
              )}

              {/* AI 诊断助手卡片 */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
                <i className="fas fa-layer-group absolute -right-6 -bottom-6 text-8xl opacity-10 group-hover:scale-110 transition-transform duration-700"></i>
                <h5 className="font-bold mb-4 flex items-center gap-2"><i className="fas fa-magic"></i> AI 模板校验</h5>
                <p className="text-xs text-blue-100 leading-relaxed mb-6">
                  Gemini 已完成对该模板的合规性扫描。当前配置符合工业级标准，建议在 MQTT 负载过重时考虑启用 Sparkplug B 协议。
                </p>
                <button className="w-full py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-all border border-white/20 backdrop-blur-sm">查看完整校验报告</button>
              </div>
            </div>
          </div>
        );
      case 'calculated': return <div className="p-24 text-center flex flex-col items-center">
        <i className="fas fa-calculator text-5xl text-gray-100 dark:text-gray-800 mb-4"></i>
        <h3 className="text-lg font-bold text-gray-400">模块开发中</h3>
        <p className="text-sm text-gray-400 mt-2">计算字段模块正在紧锣密鼓地开发中...</p>
      </div>;
      case 'alarms': return (
        <div className="p-8">
           <div className="flex items-center gap-2 mb-6">
             <div className="w-1 h-4 bg-red-500 rounded-full"></div>
             <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">告警规则列表</h4>
           </div>
           <table className="w-full text-left">
             <thead>
               <tr className="text-xs font-bold text-gray-400 uppercase border-b dark:border-white/10 pb-4"><th className="pb-4">规则名称</th><th className="pb-4">严重等级</th><th className="pb-4">条件</th><th className="pb-4 text-right">状态</th></tr>
             </thead>
             <tbody className="divide-y dark:divide-white/10">{MOCK_ALARMS.map(a => <tr key={a.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"><td className="py-4 text-sm font-bold dark:text-gray-200">{a.name}</td><td className="py-4"><span className={`text-[10px] px-2 py-0.5 rounded font-bold ${a.severity === 'CRITICAL' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>{a.severity}</span></td><td className="py-4 text-xs font-mono text-gray-400">{a.condition}</td><td className="py-4 text-right"><span className={`w-2 h-2 rounded-full inline-block ${a.enabled ? 'bg-green-500' : 'bg-gray-300'}`}></span></td></tr>)}</tbody>
           </table>
        </div>
      );
      case 'audit': return (
        <div className="p-8 space-y-4 max-w-4xl">
           <div className="flex items-center gap-2 mb-6">
             <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
             <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">模板变更审计</h4>
           </div>
          {MOCK_AUDIT.map(l => <div key={l.id} className="p-4 border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 rounded-xl"><div className="flex justify-between items-center mb-2"><span className="text-sm font-bold dark:text-gray-200">{l.type}</span><span className="text-[10px] text-gray-400 font-mono">{l.time}</span></div><p className="text-xs text-gray-500 leading-relaxed">{l.details}</p><div className="mt-3 text-[10px] text-gray-400">操作人: <span className="font-bold text-blue-500">{l.user}</span></div></div>)}
        </div>
      );
      case 'versions': return (
        <div className="p-8 space-y-4 max-w-4xl">
           <div className="flex items-center gap-2 mb-6">
             <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
             <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">模板历史版本</h4>
           </div>
          {MOCK_VERSIONS.map(v => <div key={v.id} className={`p-6 rounded-2xl border transition-all ${v.active ? 'border-[#1677ff] bg-[#1677ff]/5' : 'border-gray-100 dark:border-white/5 bg-white dark:bg-[#1f1f1f] shadow-sm'}`}><div className="flex justify-between items-center"><div className="flex items-center gap-3"><h6 className="font-bold text-lg dark:text-gray-100">{v.version}</h6>{v.active && <span className="text-[10px] px-2 py-0.5 bg-[#52c41a] text-white rounded-full font-bold">运行中</span>}</div><span className="text-xs text-gray-400">{v.createdAt}</span></div><p className="text-sm text-gray-500 mt-3 leading-relaxed">{v.remark}</p><div className="mt-4 flex gap-3"><button className="text-xs text-[#1677ff] font-bold">对比差异</button>{!v.active && <button className="text-xs text-gray-400 font-bold">恢复此版本</button>}</div></div>)}
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-white dark:bg-[#1f1f1f] border-b border-[#f0f0f0] dark:border-white/10 px-8 py-6 rounded-t-xl transition-colors shadow-sm relative z-10">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-all border border-gray-100 dark:border-[#303030] group">
            <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{template.name}</h3>
              {template.isDefault && <span className="px-2 py-0.5 bg-yellow-400 text-black text-[10px] font-bold rounded shadow-sm">DEFAULT</span>}
            </div>
            <p className="text-sm text-gray-400 mt-1 font-mono uppercase tracking-tighter">ID: {template.id} · 版本 v1.2.0</p>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-2.5 bg-white dark:bg-[#262626] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm">导出模板</button>
            <button onClick={() => setIsModalOpen(true)} className="px-5 py-2.5 bg-[#1677ff] text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2">
              <i className="fas fa-edit text-xs"></i>
              编辑配置
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1f1f1f] px-8 transition-colors">
        <div className="flex border-b border-[#f0f0f0] dark:border-white/10 overflow-x-auto no-scrollbar scroll-smooth">
          {tabs.map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)} 
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 -mb-[1px] ${
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

      <div className="bg-white dark:bg-[#1f1f1f] min-h-[500px] transition-colors rounded-b-xl overflow-hidden pb-12 shadow-inner">
        {renderContent()}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-[#1f1f1f] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-transparent dark:border-[#303030]">
            <div className="px-6 py-4 border-b dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
              <h3 className="font-bold dark:text-gray-200">更新模板配置</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times"></i></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[85vh] custom-scrollbar space-y-6">
              <section>
                <div className="flex items-center gap-2 pb-2 border-b dark:border-white/5 mb-4">
                  <i className="fas fa-info-circle text-blue-500 text-sm"></i>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">核心信息</h4>
                </div>
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <FormItemLabel label="模板名称" required />
                    <input type="text" required className={inputBaseClasses} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
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
                  <div>
                    <FormItemLabel label="业务备注" />
                    <textarea className={inputBaseClasses} rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 pb-2 border-b dark:border-white/5 mb-4">
                  <i className="fas fa-network-wired text-blue-500 text-sm"></i>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">传输层设置</h4>
                </div>
                <div className="space-y-5">
                  <div>
                    <FormItemLabel label="传输协议" required />
                    <select className={inputBaseClasses} value={formData.transport || 'DEFAULT'} onChange={e => setFormData({...formData, transport: e.target.value as any})}>
                      {TRANSPORTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  {formData.transport === 'MQTT' && (
                    <div className="p-4 rounded-xl border border-gray-100 dark:border-[#303030] bg-gray-50/50 dark:bg-black/10 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <FormItemLabel label="遥测主题" required />
                          <input type="text" className={`${inputBaseClasses} font-mono`} value={formData.mqttTopicTelemetry} onChange={e => setFormData({...formData, mqttTopicTelemetry: e.target.value})} />
                        </div>
                        <div>
                          <FormItemLabel label="属性主题" required />
                          <input type="text" className={`${inputBaseClasses} font-mono`} value={formData.mqttTopicAttributes} onChange={e => setFormData({...formData, mqttTopicAttributes: e.target.value})} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <div className="pt-8 flex gap-3 border-t border-[#f0f0f0] dark:border-[#303030] mt-10 sticky bottom-0 bg-white dark:bg-[#1f1f1f] pb-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#333333] rounded-lg transition-all">取消</button>
                <button type="submit" className="flex-1 py-2.5 text-sm font-medium text-white bg-[#1677ff] hover:bg-blue-600 rounded-lg shadow-lg shadow-blue-500/10 transition-all active:scale-95">提交更改</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateDetail;
