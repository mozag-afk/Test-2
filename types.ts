
export type Role = 'ADMIN' | 'TECHNICIAN';

export type TaskType = 
  | 'Repair'
  | 'Install 0'
  | 'Install 1'
  | 'Install 2'
  | 'Install 3'
  | 'Proj unhappy'
  | 'Proj inhome large'
  | 'DIY support';

export type Outcome = 'OK' | 'NOK' | 'PP' | 'CANCEL' | '';

export interface ProductSelection {
  category: 'MODEM' | 'NIU' | 'TV BOX';
  model: string;
}

export interface TaskProduct {
  name: string;
  quantity: number;
}

export interface Task {
  id: string;
  technicianId: string;
  technicianName: string;
  customerNumber: string;
  type: TaskType;
  outcome: Outcome;
  date: string; // ISO string
  installProducts: ProductSelection[];
  otherProducts: TaskProduct[];
  photos: string[]; // base64 or url
  notes: string;
  status: 'DRAFT' | 'COMPLETED';
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  active: boolean;
  phone?: string;
  password?: string;
  createdAt: string;
}

export const TASK_TYPES: TaskType[] = [
  'Repair', 
  'Install 0', 
  'Install 1', 
  'Install 2', 
  'Install 3', 
  'Proj unhappy', 
  'Proj inhome large', 
  'DIY support'
];

export const OUTCOMES: Outcome[] = ['OK', 'NOK', 'PP', 'CANCEL'];

export const INSTALL_PRODUCT_OPTIONS = {
  MODEM: ['MV1', 'MV1 BASE', 'MV2', 'MV2+', 'MARAKELE'],
  NIU: ['WO', 'mampay', 'Teleste'],
  'TV BOX': ['apollo box', 'EOS TV box', 'apollo box base']
};

export const OTHER_PRODUCTS_LIST = [
  'Pods', 'MV2+', 'MV2', 'MV1', 'MV1 BASE', 'MARAKELE', 'TV BOX V2', 
  'CABLE KIT EOS', 'REMOTE EOS', 'WO NIU', 'NIU TYCO', 'NIU MAMEPAY', 
  'NIU TELESTE', 'APOLLO', 'APOLLO CABLE KIT', 'APOLLO REMOTE', 
  'APOLLO REMOTE BASE', 'WIFI PWL', 'PWL', 'HDDC', 'HDDB', 
  'SWITCH', 'LTE MODEM', 'AP', 'STEKKERBLOK'
];