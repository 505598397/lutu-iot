
export type DeviceStatus = 'online' | 'offline' | 'warning';
export type DeviceType = 'Sensor' | 'Actuator' | 'Gateway' | 'Camera';
export type CredentialType = 'access_token' | 'x509' | 'mqtt_basic';
export type AttributeScope = 'client' | 'server' | 'shared';

export interface DeviceAttribute {
  key: string;
  value: any;
  lastUpdate: string;
  scope: AttributeScope;
}

export interface TelemetryItem {
  key: string;
  label: string;
  type: 'Double' | 'Integer' | 'Boolean' | 'String' | 'JSON';
  lastUpdate: string;
  currentValue: any;
  unit?: string;
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  customer: string;
  lastActive: string;
  createdAt: string; 
  isPublic: boolean; 
  battery?: number;
  consumption?: number;
  temperature?: number;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  attributes?: DeviceAttribute[];
  telemetry?: TelemetryItem[];
  labels?: string[];
  templateId?: string;
  isGateway?: boolean;
  overwriteActivityTime?: boolean;
  description?: string;
  credentialType?: CredentialType;
  accessToken?: string;
  pemCertificate?: string;
  mqttClientId?: string;
  mqttUsername?: string;
  mqttPassword?: string;
}

export interface DeviceTemplate {
  id: string;
  name: string;
  ruleChain: string;
  mobileDashboard?: string;
  queueId?: string; 
  edgeSide?: string;
  imageUrl?: string;
  description: string;
  transport: 'DEFAULT' | 'MQTT' | 'CoAP' | 'LWM2M' | 'SNMP';
  provisioningStrategy: 'disabled' | 'allow_create' | 'check_preprovisioned' | 'x509_chain';
  createdAt: string;
  isDefault?: boolean;
  // Configuration fields for different transport protocols
  mqttTopicTelemetry?: string;
  mqttTopicAttributes?: string;
  mqttTopicSubscribe?: string;
  mqttPayload?: string;
  mqttSparkplugB?: boolean;
  mqttSparkplugB_SendPuback?: boolean;
  coapDeviceType?: string;
  coapPayload?: string;
  coapPowerMode?: string;
  lwm2mMode?: string;
  lwm2mObserveStrategy?: string;
  snmpTimeout?: number;
  snmpRetries?: number;
  // Provisioning configuration fields
  provisioningKeyName?: string;
  provisioningKey?: string;
  cnRegex?: string;
  allowCreateDevice?: boolean;
  certificatePem?: string;
}

export enum Page {
  Dashboard = 'dashboard',
  Devices = 'devices-list',
  Templates = 'devices-templates',
  Monitoring = 'ops-monitoring',
  AIInsights = 'ops-ai',
  Settings = 'settings-general',
  Security = 'settings-security'
}

export interface Queue {
  id: string;
  name: string;
  submitStrategy: string;
  processingStrategy: string;
}

export interface AlarmRule {
  id: string;
  name: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'WARNING' | 'INDETERMINATE';
  condition: string;
  enabled: boolean;
}

export interface AuditLog {
  id: string;
  time: string;
  user: string;
  type: string;
  status: 'SUCCESS' | 'FAILURE';
  details: string;
}

export interface TemplateVersion {
  id: string;
  version: string;
  creator: string;
  createdAt: string;
  remark: string;
  active: boolean;
}
