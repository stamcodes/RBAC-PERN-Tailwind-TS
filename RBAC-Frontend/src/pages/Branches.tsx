import { useEffect, useState } from "react";
import { useAuth } from "../context/authContext";
import {
  getAllBranches,
  createBranch,
  assignUserToBranch,
} from "../api/branches";
import { getAllUsers } from "../api/users";
import type { Branch, User } from "../types";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import Table from "../components/ui/Table";

const Branches = () => {
  const { token } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [branchesRes, usersRes] = await Promise.all([
          getAllBranches(token!),
          getAllUsers(token!),
        ]);
        setBranches(branchesRes.data ?? []);
        setUsers(usersRes.data ?? []);
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
      setBranches((prev) => [...prev, res.data]);
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
      alert("User assigned to branch successfully.");
      setAssignUserId("");
      setAssignBranchId("");
      setShowAssignForm(false);
    } catch (err) {
      alert("Failed to assign user.");
    } finally {
      setAssigning(false);
    }
  };

  const columns = [
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
            <Table columns={columns} data={branches} />
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
                    className={`px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition ${
                      creating ? "opacity-50 cursor-not-allowed" : ""
                    }`}
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
                    className={`px-4 py-2 text-sm rounded bg-gray-700 hover:bg-gray-800 text-white font-medium transition ${
                      assigning ? "opacity-50 cursor-not-allowed" : ""
                    }`}
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
