import { useEffect, useState } from "react";
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

const Users = () => {
  const { token, user: authUser } = useAuth();
  const isSuperAdmin = authUser?.roleId === 1;

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add user modal
  const [showAddUser, setShowAddUser] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRoleId, setNewRoleId] = useState<number | "">("");
  const [creating, setCreating] = useState(false);

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
              {role.role_name}
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
        <button
          onClick={() => handleDelete(row.id)}
          className="text-red-600 hover:text-red-800 text-sm font-medium transition"
        >
          Delete
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 bg-gray-50">
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
                          {role.role_name}
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
                    className={`px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition ${
                      creating ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {creating ? "Creating..." : "Create User"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Users;
