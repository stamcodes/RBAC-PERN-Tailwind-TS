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
import Table from "../components/ui/Table";

const Roles = () => {
  const { token } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermIds, setSelectedPermIds] = useState<number[]>([]);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesRes, permsRes] = await Promise.all([
          getAllRoles(token!),
          getAllPermissions(token!),
        ]);
        setRoles(rolesRes.data ?? []);
        setPermissions(permsRes.data ?? []);
      } catch (err) {
        setError("Failed to load roles.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleOpenAssign = (role: Role) => {
    setSelectedRole(role);
    setSelectedPermIds([]);
  };

  const handleTogglePerm = (permId: number) => {
    setSelectedPermIds((prev) =>
      prev.includes(permId)
        ? prev.filter((id) => id !== permId)
        : [...prev, permId],
    );
  };

  const handleAssign = async () => {
    if (!selectedRole || selectedPermIds.length === 0) return;
    try {
      setAssigning(true);
      await assignPermissionsToRole(token!, selectedRole.id, selectedPermIds);
      alert(`Permissions assigned to ${selectedRole.name} successfully.`);
      setSelectedRole(null);
      setSelectedPermIds([]);
    } catch (err) {
      alert("Failed to assign permissions.");
    } finally {
      setAssigning(false);
    }
  };

  const columns = [
    { header: "ID", accessor: "id" as keyof Role },
    { header: "Role Name", accessor: "name" as keyof Role },
    {
      header: "Actions",
      accessor: (row: Role) => (
        <button
          onClick={() => handleOpenAssign(row)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium transition"
        >
          Assign Permissions
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
            <Table columns={columns} data={roles} />
          )}

          {/* Assign Permissions Panel */}
          {selectedRole && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  Assign Permissions
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Role:{" "}
                  <span className="font-medium text-gray-700">
                    {selectedRole.name}
                  </span>
                </p>

                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto mb-6">
                  {permissions.map((perm) => (
                    <label
                      key={perm.id}
                      className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermIds.includes(perm.id)}
                        onChange={() => handleTogglePerm(perm.id)}
                        className="accent-blue-600"
                      />
                      {perm.name}
                    </label>
                  ))}
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setSelectedRole(null)}
                    className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssign}
                    disabled={assigning || selectedPermIds.length === 0}
                    className={`px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition ${
                      assigning || selectedPermIds.length === 0
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {assigning ? "Assigning..." : "Assign"}
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
