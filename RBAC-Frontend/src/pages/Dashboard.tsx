import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { getAllUsers } from "../api/users";
import { getAllProducts } from "../api/products";
import { getAllBranches } from "../api/branches";
import { getAllRoles } from "../api/roles";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";

interface Stats {
  users: number;
  products: number;
  branches: number;
  roles: number;
}

const Dashboard = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    users: 0,
    products: 0,
    branches: 0,
    roles: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [users, products, branches, roles] = await Promise.all([
          getAllUsers(token!),
          getAllProducts(token!),
          getAllBranches(token!),
          getAllRoles(token!),
        ]);

        setStats({
          users: users.data?.length ?? 0,
          products: products.data?.length ?? 0,
          branches: branches.data?.length ?? 0,
          roles: roles.data?.length ?? 0,
        });
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  const cards = [
    {
      label: "Total Users",
      value: stats.users,
      color: "bg-blue-500",
      path: "/users",
    },
    {
      label: "Total Products",
      value: stats.products,
      color: "bg-green-500",
      path: "/products",
    },
    {
      label: "Total Branches",
      value: stats.branches,
      color: "bg-purple-500",
      path: "/branches",
    },
    {
      label: "Total Roles",
      value: stats.roles,
      color: "bg-yellow-500",
      path: "/roles",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Dashboard</h2>
          <p className="text-sm text-gray-500 mb-8">System overview</p>

          {loading ? (
            <p className="text-sm text-gray-400">Loading stats...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {cards.map((card) => (
                <div
                  key={card.label}
                  onClick={() => navigate(card.path)}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col gap-2 cursor-pointer hover:shadow-md hover:border-gray-300 transition"
                >
                  <div className={`w-3 h-3 rounded-full ${card.color}`} />
                  <p className="text-3xl font-bold text-gray-800">
                    {card.value}
                  </p>
                  <p className="text-sm text-gray-500">{card.label}</p>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
