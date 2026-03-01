import Dexie, { type EntityTable } from 'dexie';

export interface Product {
  id: number;
  name: string;
  barcode: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
  supplierId?: number;
  expiryDate?: Date;
  image?: string;
  description?: string;
}

export interface Category {
  id: number;
  name: string;
  color?: string;
}

export interface SaleItem {
  productId: number;
  name: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
}

export interface Sale {
  id: number;
  date: Date;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'qr' | 'other';
  customerId?: number;
  status: 'completed' | 'hold' | 'refunded';
  employeeId?: number;
}

export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  points: number;
  address?: string;
  notes?: string;
}

export interface Supplier {
  id: number;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface Employee {
  id: number;
  name: string;
  role: 'admin' | 'manager' | 'cashier';
  pin: string; // Simple PIN for login
  active: boolean;
}

export interface AuditLog {
  id: number;
  date: Date;
  action: string;
  details: string;
  employeeId?: number;
}

export interface Setting {
  key: string;
  value: any;
}

const db = new Dexie('SmartPOSDatabase') as Dexie & {
  products: EntityTable<Product, 'id'>;
  categories: EntityTable<Category, 'id'>;
  sales: EntityTable<Sale, 'id'>;
  customers: EntityTable<Customer, 'id'>;
  suppliers: EntityTable<Supplier, 'id'>;
  employees: EntityTable<Employee, 'id'>;
  auditLogs: EntityTable<AuditLog, 'id'>;
  settings: EntityTable<Setting, 'key'>;
};

// Schema declaration:
db.version(1).stores({
  products: '++id, name, barcode, category, supplierId',
  categories: '++id, name',
  sales: '++id, date, customerId, status, employeeId',
  customers: '++id, name, phone, email',
  suppliers: '++id, name',
  employees: '++id, name, role',
  auditLogs: '++id, date, action',
  settings: 'key'
});

// Seed initial data if empty
db.on('populate', async () => {
  await db.categories.bulkAdd([
    { name: 'Beverages', color: '#3b82f6' },
    { name: 'Snacks', color: '#f59e0b' },
    { name: 'Electronics', color: '#10b981' },
    { name: 'Clothing', color: '#8b5cf6' },
  ]);

  await db.products.bulkAdd([
    { name: 'Cola Can', barcode: '123456789', price: 1.50, cost: 0.80, stock: 100, category: 'Beverages', expiryDate: new Date('2025-12-31') },
    { name: 'Potato Chips', barcode: '987654321', price: 2.00, cost: 1.20, stock: 50, category: 'Snacks', expiryDate: new Date('2025-06-30') },
    { name: 'USB Cable', barcode: '11223344', price: 5.99, cost: 2.50, stock: 30, category: 'Electronics' },
    { name: 'T-Shirt', barcode: '55667788', price: 15.00, cost: 8.00, stock: 20, category: 'Clothing' },
  ]);

  await db.employees.add({
    name: 'Admin User',
    role: 'admin',
    pin: '1234',
    active: true
  });

  await db.settings.bulkAdd([
    { key: 'currency', value: 'USD' },
    { key: 'taxRate', value: 0.1 }, // 10%
    { key: 'storeName', value: 'My Smart Store' },
  ]);
});

export { db };
