import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

const authHeader = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const getAllRoles = async (token: string) => {
  const response = await axios.get(`${BASE_URL}/api/roles`, authHeader(token));
  return response.data;
};

export const getAllPermissions = async (token: string) => {
  const response = await axios.get(
    `${BASE_URL}/api/permissions`,
    authHeader(token),
  );
  return response.data;
};

export const assignPermissionsToRole = async (
  token: string,
  roleId: number,
  permissionIds: number[],
) => {
  const response = await axios.post(
    `${BASE_URL}/api/roles/${roleId}/permissions`,
    { permissionIds },
    authHeader(token),
  );
  return response.data;
};
