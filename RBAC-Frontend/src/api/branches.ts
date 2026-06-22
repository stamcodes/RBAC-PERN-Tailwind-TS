import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

const authHeader = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const getAllBranches = async (token: string) => {
  const response = await axios.get(
    `${BASE_URL}/api/branches`,
    authHeader(token),
  );
  return response.data;
};

export const getBranchUsers = async (token: string, branchId: number) => {
  const response = await axios.get(
    `${BASE_URL}/api/branches/${branchId}/users`,
    authHeader(token),
  );
  return response.data;
};

export const createBranch = async (
  token: string,
  name: string,
  location: string,
) => {
  const response = await axios.post(
    `${BASE_URL}/api/branches`,
    { name, location },
    authHeader(token),
  );
  return response.data;
};

export const assignUserToBranch = async (
  token: string,
  userId: number,
  branchId: number,
) => {
  const response = await axios.post(
    `${BASE_URL}/api/branches/assign`,
    { userId, branchId },
    authHeader(token),
  );
  return response.data;
};
