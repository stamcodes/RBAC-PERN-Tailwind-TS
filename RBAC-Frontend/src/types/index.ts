export interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
}

export interface Role {
  id: number;
  name: string; // Matches backend database column
}
export interface Permission {
  id: number;
  name: string;
  description?: string;
}
export interface Branch {
  id: number;
  name: string;
  location: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  is_active: boolean;
  categories: string[];
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  price: string;
  stock_quantity: number;
  options: VariantOption[];
}

export interface VariantOption {
  type: string;
  value: string;
}

export interface AuthUser {
  userId: number;
  email: string;
  roleId: number;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: AuthUser;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
