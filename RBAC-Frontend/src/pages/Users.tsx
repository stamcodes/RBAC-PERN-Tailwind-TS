import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import {
  getAllUsers,
  updateUserRole,
  deleteUser,
  createUser,
} from "../api/users";
import { getAllRoles } from "../api/roles";
import type { User, Role } from "../types";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import Table from "../components/ui/Table";
import Badge from "../components/ui/Badge";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

const Users = () => {
  const { token, user: authUser } = useAuth();
  const navigate = useNavigate();

  const isSuperAdmin =
    !!token ||
    authUser?.roleId === 1 ||
    (authUser as any)?.role_id === 1 ||
    (authUser as any)?.user?.roleId === 1 ||
    (authUser as any)?.user?.role_id === 1;

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add user
  const [showAddUser, setShowAddUser] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRoleId, setNewRoleId] = useState<number | "">("");
  const [creating, setCreating] = useState(false);

  // Reset password
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [newResetPassword, setNewResetPassword] = useState("");
  const [confirmResetPassword, setConfirmResetPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, rolesRes] = await Promise.all([
          getAllUsers(token!),
          getAllRoles(token!),
        ]);
        setUsers(usersRes.data ?? []);
        setRoles(rolesRes.data ?? []);
      } catch (err) {
        setError("Failed to load users.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const handleRoleChange = async (userId: number, newRoleId: number) => {
    try {
      await updateUserRole(token!, userId, newRoleId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role_id: newRoleId } : u)),
      );
    } catch (err) {
      alert("Failed to update role.");
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteUser(token!, userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      alert("Failed to delete user.");
    }
  };

  const handleCreateUser = async () => {
    if (!newName || !newEmail || !newPassword || !newRoleId) {
      alert("All fields are required.");
      return;
    }
    try {
      setCreating(true);
      const res = await createUser(
        token!,
        newName,
        newEmail,
        newPassword,
        newRoleId as number,
      );
      const created = res?.data ?? res;
      setUsers((prev) => [...prev, created]);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRoleId("");
      setShowAddUser(false);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message;
      alert(`Failed to create user: ${message}`);
    } finally {
      setCreating(false);
    }
  };

  const openResetModal = (user: User) => {
    setResetTarget(user);
    setResetStep(1);
    setNewResetPassword("");
    setConfirmResetPassword("");
    setAdminPassword("");
    setResetError("");
  };

  const closeResetModal = () => {
    setResetTarget(null);
    setResetStep(1);
    setNewResetPassword("");
    setConfirmResetPassword("");
    setAdminPassword("");
    setResetError("");
  };

  const handleResetStep1 = () => {
    if (!newResetPassword || !confirmResetPassword) {
      setResetError("Both password fields are required.");
      return;
    }
    if (newResetPassword.length < 8) {
      setResetError("Password must be at least 8 characters.");
      return;
    }
    if (newResetPassword !== confirmResetPassword) {
      setResetError("Passwords do not match.");
      return;
    }
    setResetError("");
    setResetStep(2);
  };

  const handleResetConfirm = async () => {
    if (!adminPassword) {
      setResetError("Please enter your password to confirm.");
      return;
    }
    if (!resetTarget) return;
    try {
      setResetting(true);
      setResetError("");
      await axios.patch(
        `${BASE_URL}/api/users/${resetTarget.id}/password`,
        { newPassword: newResetPassword },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert(`Password for ${resetTarget.name} has been reset successfully.`);
      closeResetModal();
    } catch (err: any) {
      const message = err.response?.data?.message || err.message;
      setResetError(`Failed to reset password: ${message}`);
    } finally {
      setResetting(false);
    }
  };

  const columns = [
    { header: "ID", accessor: "id" as keyof User },
    { header: "Name", accessor: "name" as keyof User },
    { header: "Email", accessor: "email" as keyof User },
    {
      header: "Role",
      accessor: (row: User) => (
        <select
          value={row.role_id ?? ""}
          onChange={(e) => handleRoleChange(row.id, parseInt(e.target.value))}
          className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: "Status",
      accessor: (_row: User) => <Badge label="Active" variant="green" />,
    },
    {
      header: "Actions",
      accessor: (row: User) => (
        <div className="flex items-center gap-3">
          {isSuperAdmin && (
            <button
              onClick={() => openResetModal(row)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition"
            >
              Reset Password
            </button>
          )}
          <button
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:text-red-800 text-sm font-medium transition"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 bg-gray-50">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition mb-4"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </button>

          <div className="flex items-center justify-between mb-1">
            <h2 className="text-2xl font-bold text-gray-800">Users</h2>
            {isSuperAdmin && (
              <button
                onClick={() => setShowAddUser(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded transition"
              >
                + Add User
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-8">
            Manage system users and their roles
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded px-4 py-3 mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <p className="text-sm text-gray-400">Loading users...</p>
          ) : (
            <Table columns={columns} data={users} />
          )}

          {/* Add User Modal */}
          {showAddUser && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
                <h3 className="text-lg font-bold text-gray-800 mb-6">
                  Add New User
                </h3>
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="e.g. john@example.com"
                      className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">
                      Role
                    </label>
                    <select
                      value={newRoleId}
                      onChange={(e) => setNewRoleId(parseInt(e.target.value))}
                      className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowAddUser(false)}
                    className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateUser}
                    disabled={creating}
                    className={`px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition ${creating ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {creating ? "Creating..." : "Create User"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reset Password Modal */}
          {resetTarget && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
                {resetStep === 1 && (
                  <>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">
                      Reset Password
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                      Setting new password for{" "}
                      <span className="font-medium text-gray-700">
                        {resetTarget.name}
                      </span>
                    </p>

                    {resetError && (
                      <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded px-4 py-3 mb-4">
                        {resetError}
                      </div>
                    )}

                    <div className="flex flex-col gap-4 mb-6">
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newResetPassword}
                          onChange={(e) => setNewResetPassword(e.target.value)}
                          placeholder="Min 8 characters"
                          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={confirmResetPassword}
                          onChange={(e) =>
                            setConfirmResetPassword(e.target.value)
                          }
                          placeholder="Re-enter new password"
                          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={closeResetModal}
                        className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleResetStep1}
                        className="px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
                      >
                        Continue
                      </button>
                    </div>
                  </>
                )}

                {resetStep === 2 && (
                  <>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">
                      Confirm Override
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                      Enter your admin password to confirm this password reset
                      for{" "}
                      <span className="font-medium text-gray-700">
                        {resetTarget.name}
                      </span>
                    </p>

                    {resetError && (
                      <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded px-4 py-3 mb-4">
                        {resetError}
                      </div>
                    )}

                    <div className="flex flex-col gap-4 mb-6">
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">
                          Your Password
                        </label>
                        <input
                          type="password"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="Enter your admin password"
                          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => {
                          setResetStep(1);
                          setResetError("");
                        }}
                        className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleResetConfirm}
                        disabled={resetting}
                        className={`px-4 py-2 text-sm rounded bg-red-600 hover:bg-red-700 text-white font-medium transition ${resetting ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {resetting ? "Resetting..." : "Confirm Override"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Users;
