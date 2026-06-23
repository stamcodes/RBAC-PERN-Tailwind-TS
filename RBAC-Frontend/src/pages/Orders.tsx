import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { orderApi } from "../api/orders";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import CreateOrderModal from "../components/ui/CreateOrderModal"; // Adjust path as needed

interface Order {
  id: number;
  customer_name: string;
  status: "open" | "ready" | "completed" | "cancelled";
  branch_id: number;
}

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Fetch orders from backend
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderApi.getAllOrders();
      if (Array.isArray(res)) {
        setOrders(res);
      } else if (res?.success && Array.isArray(res.data)) {
        setOrders(res.data);
      } else {
        toast.error("Failed to sync order records properly.");
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to connect to server.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Handle Workflow Status Updates
  const handleStatusChange = async (
    id: number,
    nextStatus: "open" | "ready" | "completed" | "cancelled",
  ) => {
    try {
      await orderApi.updateOrderStatus(id, nextStatus);
      toast.success(`Order #${id} marked as ${nextStatus}`);
      fetchOrders(); // Silent background refresh
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not update status.");
    }
  };

  // Live client-side filters
  const filteredOrders = orders.filter((order) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      order.customer_name?.toLowerCase().includes(searchLower) ||
      order.id.toString().includes(searchLower)
    );
  });

  // Soft text-matching status badges based on light UI patterns
  const getStatusBadgeClass = (status: Order["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "ready":
        return "bg-blue-100 text-blue-800";
      case "open":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 bg-gray-50">
          {/* Back button link matching Branches component layout */}
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

          {/* Header Panel layout matching light reference component */}
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-2xl font-bold text-gray-800">Orders Ledger</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded transition shadow-sm"
              >
                + Add POS Order
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Monitor real-time active POS storefront orders and updates
          </p>

          {/* Search bar widget */}
          <div className="w-full max-w-sm mb-6">
            <input
              type="text"
              placeholder="Filter by customer name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
            />
          </div>

          {/* Master Table Display Container */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-6">
                <p className="text-sm text-gray-400">Loading orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-sm italic">
                No orders discovered matching the current filter criteria.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
                      Order ID
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Customer Name
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">
                      Status
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-64">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-gray-700 font-mono">
                        #{order.id}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {order.customer_name}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize ${getStatusBadgeClass(
                            order.status,
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {order.status === "open" && (
                          <button
                            onClick={() =>
                              handleStatusChange(order.id, "ready")
                            }
                            className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded text-xs font-medium transition"
                          >
                            Mark Ready
                          </button>
                        )}
                        {order.status === "ready" && (
                          <button
                            onClick={() =>
                              handleStatusChange(order.id, "completed")
                            }
                            className="bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 px-2.5 py-1 rounded text-xs font-medium transition"
                          >
                            Complete
                          </button>
                        )}
                        {order.status !== "completed" &&
                          order.status !== "cancelled" && (
                            <button
                              onClick={() =>
                                handleStatusChange(order.id, "cancelled")
                              }
                              className="text-gray-400 hover:text-red-600 px-2.5 py-1 rounded text-xs font-medium transition"
                            >
                              Cancel
                            </button>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {/* POS Order Overlaid Interface Modal */}
      <CreateOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchOrders(); // Sync view seamlessly
        }}
      />
    </div>
  );
};

export default Orders;
