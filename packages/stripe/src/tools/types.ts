/** Stripe client interface for testability */
export interface StripeClient {
  listCustomers(params?: { limit?: number; email?: string }): Promise<StripeListResult>;
  getCustomer(id: string): Promise<StripeCustomer>;
  createCustomer(data: { name: string; email?: string; description?: string }): Promise<StripeCustomer>;
  listCharges(params?: { limit?: number; customer?: string }): Promise<StripeListResult>;
  createCharge(data: { amount: number; currency: string; customer?: string; description?: string }): Promise<StripeCharge>;
  listProducts(params?: { limit?: number }): Promise<StripeListResult>;
  createProduct(data: { name: string; description?: string; active?: boolean }): Promise<StripeProduct>;
  listSubscriptions(params?: { limit?: number; customer?: string; status?: string }): Promise<StripeListResult>;
}

export interface StripeListResult<T = unknown> {
  data: T[];
  has_more: boolean;
  total_count?: number;
}

export interface StripeCustomer {
  id: string;
  name?: string;
  email?: string;
  created: number;
  description?: string;
}

export interface StripeCharge {
  id: string;
  amount: number;
  currency: string;
  customer?: string;
  status: string;
  created: number;
}

export interface StripeProduct {
  id: string;
  name: string;
  active: boolean;
  description?: string;
  created: number;
}

export interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
}
