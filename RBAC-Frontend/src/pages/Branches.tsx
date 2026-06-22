import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import {
  getAllBranches,
  createBranch,
  assignUserToBranch,
  getBranchUsers,
} from "../api/branches";
import { getAllUsers } from "../api/users";
import type { Branch, User } from "../types";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import Table from "../components/ui/Table";

interface BranchUser {
  id: number;
  name: string;
  email: string;
  role_name: string;
}

interface BranchWithUsers extends Branch {
  assignedUsers: BranchUser[];
}

const Branches = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [branches, setBranches] = useState<BranchWithUsers[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create branch form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [creating, setCreating] = useState(false);

  // Assign user form
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignBranchId, setAssignBranchId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const fetchBranchUsers = async (branchId: number): Promise<BranchUser[]> => {
    try {
      const res = await getBranchUsers(token!, branchId);
      return res.success ? res.data : [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [branchesRes, usersRes] = await Promise.all([
          getAllBranches(token!),
          getAllUsers(token!),
        ]);

        const branchesData: Branch[] = branchesRes.data ?? [];
        setUsers(usersRes.data ?? []);

        const branchesWithUsers: BranchWithUsers[] = await Promise.all(
          branchesData.map(async (branch) => {
            const assignedUsers = await fetchBranchUsers(branch.id);
            return { ...branch, assignedUsers };
          }),
        );

        setBranches(branchesWithUsers);
      } catch (err) {
        setError("Failed to load branches.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleCreateBranch = async () => {
    if (!newName || !newLocation) {
      alert("Name and location are required.");
      return;
    }
    try {
      setCreating(true);
      const res = await createBranch(token!, newName, newLocation);
      setBranches((prev) => [...prev, { ...res.data, assignedUsers: [] }]);
      setNewName("");
      setNewLocation("");
      setShowCreateForm(false);
    } catch (err) {
      alert("Failed to create branch.");
    } finally {
      setCreating(false);
    }
  };

  const handleAssignUser = async () => {
    if (!assignUserId || !assignBranchId) {
      alert("Please select both a user and a branch.");
      return;
    }
    try {
      setAssigning(true);
      await assignUserToBranch(
        token!,
        parseInt(assignUserId),
        parseInt(assignBranchId),
      );

      const updatedUsers = await fetchBranchUsers(parseInt(assignBranchId));
      setBranches((prev) =>
        prev.map((b) =>
          b.id === parseInt(assignBranchId)
            ? { ...b, assignedUsers: updatedUsers }
            : b,
        ),
      );

      setAssignUserId("");
      setAssignBranchId("");
      setShowAssignForm(false);
    } catch (err) {
      alert("Failed to assign user.");
    } finally {
      setAssigning(false);
    }
  };

  const getStrengthSummary = (assignedUsers: BranchUser[]) => {
    const counts: Record<string, number> = {};
    assignedUsers.forEach((u) => {
      const role = u.role_name.toLowerCase();
      counts[role] = (counts[role] ?? 0) + 1;
    });
    if (Object.keys(counts).length === 0) return "No users assigned";
    return Object.entries(counts)
      .map(([role, count]) => `${count} ${role}`)
      .join(", ");
  };

  const branchColumns = [
    { header: "ID", accessor: "id" as keyof Branch },
    { header: "Branch Name", accessor: "name" as keyof Branch },
    { header: "Location", accessor: "location" as keyof Branch },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 bg-gray-50">
          {/* Back button */}
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
            <h2 className="text-2xl font-bold text-gray-800">Branches</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAssignForm(true)}
                className="bg-gray-700 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded transition"
              >
                Assign User
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded transition"
              >
                + New Branch
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-8">
            Manage branches and user assignments
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded px-4 py-3 mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <p className="text-sm text-gray-400">Loading branches...</p>
          ) : (
            <>
              {/* Branches Table */}
              <Table columns={branchColumns} data={branches} />

              {/* Branch Assignments Table */}
              <h2 className="text-2xl font-bold text-gray-800 mt-12 mb-1">
                Branches Assigned
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Users currently assigned to each branch
              </p>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">
                        Branch ID
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">
                        Branch Name
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Assigned To
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-56">
                        Total Strength
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {branches.map((branch) => (
                      <tr
                        key={branch.id}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="px-6 py-4 text-gray-700">{branch.id}</td>
                        <td className="px-6 py-4 font-medium text-gray-800">
                          {branch.name}
                        </td>
                        <td className="px-6 py-4">
                          {branch.assignedUsers.length === 0 ? (
                            <span className="text-xs text-gray-400 italic">
                              No users assigned
                            </span>
                          ) : (
                            <div className="flex flex-col gap-1">
                              {branch.assignedUsers.map((u) => (
                                <span
                                  key={u.id}
                                  className="text-xs text-gray-700"
                                >
                                  {u.name}
                                  <span className="text-gray-400 ml-1">
                                    ({u.role_name})
                                  </span>
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-600">
                          {getStrengthSummary(branch.assignedUsers)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Create Branch Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
                <h3 className="text-lg font-bold text-gray-800 mb-6">
                  Create New Branch
                </h3>
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">
                      Branch Name
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Lahore Main Branch"
                      className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">
                      Location
                    </label>
                    <input
                      type="text"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      placeholder="e.g. Lahore, Pakistan"
                      className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateBranch}
                    disabled={creating}
                    className={`px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition ${creating ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {creating ? "Creating..." : "Create Branch"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Assign User Modal */}
          {showAssignForm && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
                <h3 className="text-lg font-bold text-gray-800 mb-6">
                  Assign User to Branch
                </h3>
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">
                      Select User
                    </label>
                    <select
                      value={assignUserId}
                      onChange={(e) => setAssignUserId(e.target.value)}
                      className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select a user --</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">
                      Select Branch
                    </label>
                    <select
                      value={assignBranchId}
                      onChange={(e) => setAssignBranchId(e.target.value)}
                      className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select a branch --</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} — {b.location}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowAssignForm(false)}
                    className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignUser}
                    disabled={assigning}
                    className={`px-4 py-2 text-sm rounded bg-gray-700 hover:bg-gray-800 text-white font-medium transition ${assigning ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {assigning ? "Assigning..." : "Assign User"}
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

export default Branches;
