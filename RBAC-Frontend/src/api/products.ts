import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

const authHeader = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const getAllProducts = async (token: string) => {
  const response = await axios.get(
    `${BASE_URL}/api/products`,
    authHeader(token),
  );
  return response.data;
};

export const createProduct = async (
  token: string,
  name: string,
  description: string,
  price: number,
  is_active: boolean,
  categoryIds?: number[],
) => {
  const response = await axios.post(
    `${BASE_URL}/api/products`,
    { name, description, price, is_active, categoryIds },
    authHeader(token),
  );
  return response.data;
};

export const getProductVariants = async (token: string, productId: number) => {
  const response = await axios.get(
    `${BASE_URL}/api/products/${productId}/variants`,
    authHeader(token),
  );
  return response.data;
};

export const createProductVariant = async (
  token: string,
  productId: number,
  sku: string,
  price: number,
  stock_quantity: number,
  variantValueIds?: number[],
  color?: string,
  weight?: string,
) => {
  const response = await axios.post(
    `${BASE_URL}/api/products/${productId}/variants`,
    { sku, price, stock_quantity, variantValueIds, color, weight },
    authHeader(token),
  );
  return response.data;
};

export const updateProductVariant = async (
  token: string,
  variantId: number,
  updates: {
    sku?: string;
    price?: number;
    stock_quantity?: number;
    variantValueIds?: number[];
    color?: string;
    weight?: string;
  },
) => {
  const response = await axios.put(
    `${BASE_URL}/api/products/variants/${variantId}`,
    updates,
    authHeader(token),
  );
  return response.data;
};
