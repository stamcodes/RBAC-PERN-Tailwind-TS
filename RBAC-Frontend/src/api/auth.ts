import axios from "axios";

// Fallback to local port 5000 if the VITE_API_URL environment variable is missing
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const loginUser = async (email: string, password: string) => {
  const response = await axios.post(`${BASE_URL}/api/auth/login`, {
    email,
    password,
  });
  return response.data;
};

export const getMe = async (token: string) => {
  const response = await axios.get(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const resetPassword = async (token: string, newPassword: string) => {
  const response = await axios.post(
    `${BASE_URL}/api/auth/reset-password`,
    { newPassword },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return response.data;
};

export const deactivateAccount = async (token: string) => {
  const response = await axios.patch(
    `${BASE_URL}/api/auth/deactivate`,
    {},
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return response.data;
};
