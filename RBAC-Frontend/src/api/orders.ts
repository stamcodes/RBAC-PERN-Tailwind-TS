import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
});

// Automatically append token to all order requests if it exists in storage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const orderApi = {
  getAllOrders: async () => {
    const response = await api.get("/orders");
    return response.data;
  },

  getOrderById: async (id: number | string) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  createOrder: async (payload: any) => {
    const response = await api.post("/orders", payload);
    return response.data;
  },

  updateOrderStatus: async (id: number | string, status: string) => {
    const response = await api.patch(`/orders/${id}/status`, { status });
    return response.data;
  },

  deleteOrder: async (id: number | string) => {
    const response = await api.delete(`/orders/${id}`);
    return response.data;
  },
};
