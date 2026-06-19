import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

const authHeader = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const getAllUsers = async (token: string) => {
  const response = await axios.get(`${BASE_URL}/api/users`, authHeader(token));
  return response.data;
};

export const getUserById = async (token: string, id: number) => {
  const response = await axios.get(
    `${BASE_URL}/api/users/${id}`,
    authHeader(token),
  );
  return response.data;
};

export const createUser = async (
  token: string,
  name: string,
  email: string,
  password: string,
  role_id: number,
) => {
  const response = await axios.post(
    `${BASE_URL}/api/users`,
    { name, email, password, role_id },
    authHeader(token),
  );
  return response.data;
};

export const updateUserRole = async (
  token: string,
  id: number,
  roleId: number,
) => {
  const response = await axios.patch(
    `${BASE_URL}/api/users/${id}/role`,
    { role_id: roleId },
    authHeader(token),
  );
  return response.data;
};

export const deleteUser = async (token: string, id: number) => {
  const response = await axios.delete(
    `${BASE_URL}/api/users/${id}`,
    authHeader(token),
  );
  return response.data;
};
