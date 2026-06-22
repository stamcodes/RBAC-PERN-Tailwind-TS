import { useEffect, useState } from "react";
import { useAuth } from "../context/authContext";
import {
  getAllRoles,
  getAllPermissions,
  assignPermissionsToRole,
} from "../api/roles";
import type { Role, Permission } from "../types";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

interface RoleWithPermissions extends Role {
  currentPermissions: Permission[];
}

const Roles = () => {
  const { token } = useAuth();
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(
    null,
  );
  const [selectedPermIds, setSelectedPermIds] = useState<number[]>([]);
  const [assigning, setAssigning] = useState(false);

  const fetchRolePermissions = async (
    roleId: number,
  ): Promise<Permission[]> => {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/roles/${roleId}/permissions`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return res.data.success ? res.data.data : [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesRes, permsRes] = await Promise.all([
          getAllRoles(token!),
          getAllPermissions(token!),
        ]);

        const rolesData: Role[] = rolesRes.data ?? [];
        const permsData: Permission[] = permsRes.data ?? [];
        setAllPermissions(permsData);

        const rolesWithPerms: RoleWithPermissions[] = await Promise.all(
          rolesData.map(async (role) => {
            const currentPermissions = await fetchRolePermissions(role.id);
            return { ...role, currentPermissions };
          }),
        );

        setRoles(rolesWithPerms);
      } catch (err) {
        setError("Failed to load roles.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleOpenAssign = (role: RoleWithPermissions) => {
    setSelectedRole(role);
    setSelectedPermIds(role.currentPermissions.map((p) => p.id));
  };

  const handleTogglePerm = (permId: number) => {
    setSelectedPermIds((prev) =>
      prev.includes(permId)
        ? prev.filter((id) => id !== permId)
        : [...prev, permId],
    );
  };

  const handleAssign = async () => {
    if (!selectedRole) return;
    try {
      setAssigning(true);
      await assignPermissionsToRole(token!, selectedRole.id, selectedPermIds);

      const updated = await fetchRolePermissions(selectedRole.id);
      setRoles((prev) =>
        prev.map((r) =>
          r.id === selectedRole.id ? { ...r, currentPermissions: updated } : r,
        ),
      );

      setSelectedRole(null);
      setSelectedPermIds([]);
    } catch (err) {
      alert("Failed to assign permissions.");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Roles</h2>
          <p className="text-sm text-gray-500 mb-8">
            View roles and assign permissions
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded px-4 py-3 mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <p className="text-sm text-gray-400">Loading roles...</p>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">
                      ID
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">
                      Role Name
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Current Permissions
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-44">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {roles.map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-gray-700">{role.id}</td>
                      <td className="px-6 py-4 font-medium text-gray-800 capitalize">
                        {role.name}
                      </td>
                      <td className="px-6 py-4">
                        {role.currentPermissions.length === 0 ? (
                          <span className="text-xs text-gray-400 italic">
                            No permissions assigned
                          </span>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            {role.currentPermissions.map((perm) => (
                              <span
                                key={perm.id}
                                className="inline-flex items-center gap-1.5 text-xs text-gray-700"
                              >
                                <span className="w-3.5 h-3.5 rounded-sm bg-blue-500 flex items-center justify-center flex-shrink-0">
                                  <svg
                                    className="w-2 h-2 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={3}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </span>
                                {perm.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleOpenAssign(role)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium transition"
                        >
                          Assign Permissions
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Assign Permissions Modal */}
          {selectedRole && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  Assign Permissions
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Role:{" "}
                  <span className="font-medium text-gray-700 capitalize">
                    {selectedRole.name}
                  </span>
                </p>

                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto mb-6">
                  {allPermissions.map((perm) => (
                    <label
                      key={perm.id}
                      className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermIds.includes(perm.id)}
                        onChange={() => handleTogglePerm(perm.id)}
                        className="accent-blue-600"
                      />
                      <span>
                        <span className="font-medium">{perm.name}</span>
                        <span className="text-gray-400 ml-2 text-xs">
                          — {perm.description ?? ""}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setSelectedRole(null);
                      setSelectedPermIds([]);
                    }}
                    className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssign}
                    disabled={assigning}
                    className={`px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition ${
                      assigning ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {assigning ? "Saving..." : "Save Permissions"}
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

export default Roles;
