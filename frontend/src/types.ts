export type Role = 'STAFF' | 'ADMIN';
export type InquiryStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Inquiry {
  id: string;
  customerName: string;
  customerContact: string;
  subject: string;
  description: string;
  status: InquiryStatus;
  priority: Priority;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
}