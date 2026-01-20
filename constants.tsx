
import { Device, DeviceTemplate, Queue } from './types';

export const CUSTOMERS = [
  '未分配',
  '阿里巴巴集团',
  '腾讯科技',
  '华为技术',
  '美团外卖',
  '字节跳动',
  '小米通讯',
  '京东物流'
];

export const INITIAL_DEVICES: Device[] = [
  {
    id: 'DEV-001',
    name: '北厅温度传感器',
    type: 'Sensor',
    status: 'online',
    customer: '阿里巴巴集团',
    lastActive: '2023-10-27 14:30:00',
    createdAt: '2023-10-01 08:00:00',
    isPublic: false,
    labels: ['环境监控', '北厅'],
    templateId: 'TPL-001',
    battery: 85,
    temperature: 24.5,
    // 添加凭据信息
    credentialType: 'access_token',
    accessToken: 'akz178nboyv4xinrvsbd',
    latitude: 39.9042,
    longitude: 116.4074,
    locationName: '北京阿里巴巴总部'
  },
  {
    id: 'DEV-002',
    name: '智能空调控制器',
    type: 'Actuator',
    status: 'online',
    customer: '华为技术',
    lastActive: '2023-10-27 14:35:00',
    createdAt: '2023-10-05 10:20:00',
    isPublic: true,
    isGateway: true,
    labels: ['能耗管理', '智能楼宇'],
    consumption: 12.4,
    // 添加凭据信息
    credentialType: 'mqtt_basic',
    mqttClientId: 'gateway-002-main',
    mqttUsername: 'admin_iot',
    mqttPassword: 'securepassword123',
    latitude: 22.5431,
    longitude: 114.0579,
    locationName: '深圳华为坂田基地'
  },
  {
    id: 'DEV-003',
    name: '正门安全监控',
    type: 'Camera',
    status: 'warning',
    customer: '腾讯科技',
    lastActive: '2023-10-27 14:20:00',
    createdAt: '2023-10-10 16:45:00',
    isPublic: false,
    labels: ['安防', '视频流'],
    battery: 15,
    // 添加凭据信息
    credentialType: 'x509',
    pemCertificate: '-----BEGIN CERTIFICATE-----\nMIIC/zCCAeegAwIBAgIJAJ6G9vP8N8+SMA0GCSqGSIb3DQEBCwUAMBMxETAPBgNV\nBAMMCFNNQVJUTElOSzAeFw0yMzEwMDEwODAwMDBaFw0zMzEwMDEwODAwMDBaMBMx\nETAPBgNVBAMMCFNNQVJUTElOSzCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC\nggEBAMV8z...\n-----END CERTIFICATE-----',
    latitude: 22.5407,
    longitude: 113.9344,
    locationName: '深圳腾讯滨海大厦'
  }
];

export const INITIAL_TEMPLATES: DeviceTemplate[] = [
  {
    id: 'TPL-001',
    name: '标准环境传感器模板',
    ruleChain: 'RC-ENV-STANDARD',
    description: '适用于温湿度计、气压计等标准环境监测设备',
    transport: 'MQTT',
    provisioningStrategy: 'allow_create',
    createdAt: '2023-09-01',
    isDefault: true
  },
  {
    id: 'TPL-002',
    name: '工业级网关模板',
    ruleChain: 'RC-GW-INDUSTRIAL',
    description: '支持多协议转换与边缘计算的网关专用模板',
    transport: 'CoAP',
    provisioningStrategy: 'check_preprovisioned',
    createdAt: '2023-09-15',
    isDefault: false
  }
];

export const RULE_CHAINS = ['RC-MAIN-001', 'RC-ENV-STANDARD', 'RC-GW-INDUSTRIAL', 'RC-SECURITY-CORE'];
export const DASHBOARDS = ['移动端默认视图', '工业监控仪表盘', '智能家居控制台'];

export const QUEUES: Queue[] = [
  { id: 'q1', name: 'HighPriority', submitStrategy: 'BURST', processingStrategy: 'RETRY_FAILED_AND_TIMED_OUT' },
  { id: 'q2', name: 'Main', submitStrategy: 'SEQUENTIAL', processingStrategy: 'SKIP_ALL_FAILURES' },
  { id: 'q3', name: 'SequentialByOriginator', submitStrategy: 'SEQUENTIAL_BY_ORIGINATOR', processingStrategy: 'RETRY_ALL_ERRORS' },
];

export const EDGE_SIDES = ['边缘节点 A', '边缘节点 B', '默认边缘服务'];
export const TRANSPORTS = ['DEFAULT', 'MQTT', 'CoAP', 'LWM2M', 'SNMP'] as const;
export const PROVISIONING_STRATEGIES = [
  { value: 'disabled', label: '禁用' },
  { value: 'allow_create', label: '允许创建设备' },
  { value: 'check_preprovisioned', label: '检查预配置的设备' },
  { value: 'x509_chain', label: 'X509证书链' }
] as const;

export const COLORS = {
  primary: '#1677ff',
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#1677ff',
  text: '#262626',
  textSecondary: '#8c8c8c',
  border: '#f0f0f0',
  background: '#f5f5f5'
};
