import { getElectronAPI, restRequest } from './apiClient';
import { Customer } from '../types';

export interface CustomerFilter {
  search?: string;
  hasOutstanding?: boolean;
}

export interface CustomerInput {
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  gstin?: string;
  state?: string;
  stateCode?: string;
  creditLimit?: number;
  whatsappConsent?: number;
}

export const customerApi = {
  // Get all customers with search/filter
  async getCustomers(filter?: CustomerFilter): Promise<Customer[]> {
    const electron = getElectronAPI();
    if (electron) {
      return await electron.getCustomers(filter);
    }
    const params = new URLSearchParams();
    if (filter?.search) params.append('search', filter.search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return await restRequest<Customer[]>(`/customers${query}`);
  },

  // Get customer by ID
  async getCustomerById(id: string): Promise<Customer | null> {
    const electron = getElectronAPI();
    if (electron) {
      return await electron.getCustomerById(id);
    }
    return await restRequest<Customer>(`/customers/${id}`);
  },

  // Create customer
  async createCustomer(input: CustomerInput): Promise<Customer> {
    const electron = getElectronAPI();
    if (electron) {
      return await electron.createCustomer(input);
    }
    return await restRequest<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  // Update customer
  async updateCustomer(id: string, input: Partial<CustomerInput>): Promise<Customer> {
    const electron = getElectronAPI();
    if (electron) {
      return await electron.updateCustomer(id, input);
    }
    return await restRequest<Customer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  // Delete customer
  async deleteCustomer(id: string): Promise<boolean> {
    const electron = getElectronAPI();
    if (electron) {
      return await electron.deleteCustomer(id);
    }
    await restRequest(`/customers/${id}`, {
      method: 'DELETE',
    });
    return true;
  },
};
