import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { orderApi } from "../../api/orders";
import axios from "axios";

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ProductVariantCatalogItem {
  id: number;
  sku: string;
  price: string | number;
  stock_quantity: number;
  product_name: string;
}

interface SelectedItem {
  product_variant_id: number;
  sku: string;
  product_name: string;
  price: number;
  quantity: number;
  maxStock: number;
}

const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [customerName, setCustomerName] = useState("");
  const [branchId, setBranchId] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [catalog, setCatalog] = useState<ProductVariantCatalogItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [cashReceived, setCashReceived] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchCatalog = async () => {
        try {
          const API_URL = import.meta.env.VITE_API_URL + "/api";
          const token = localStorage.getItem("token");

          const res = await axios.get(`${API_URL}/variants`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });

          setCatalog(res.data?.data || []);
        } catch (err) {
          console.error("Failed fetching catalog:", err);
          toast.error("Failed to load inventory product catalog.");
        }
      };
      fetchCatalog();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Running Mathematical Calculations
  const totalAmount = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const parsedCash = parseFloat(cashReceived) || 0;
  const changeDue = cashReceived ? parsedCash - totalAmount : 0;
  const isShortfall = parsedCash < totalAmount;

  const handleAddItem = (variant: ProductVariantCatalogItem) => {
    const existing = selectedItems.find(
      (i) => i.product_variant_id === variant.id,
    );
    if (existing) {
      if (existing.quantity >= variant.stock_quantity) {
        toast.error(`Limit reached for SKU ${variant.sku}.`);
        return;
      }
      setSelectedItems(
        selectedItems.map((i) =>
          i.product_variant_id === variant.id
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        ),
      );
    } else {
      if (variant.stock_quantity < 1) {
        toast.error("Variant inventory is depleted.");
        return;
      }
      setSelectedItems([
        ...selectedItems,
        {
          product_variant_id: variant.id,
          sku: variant.sku,
          product_name: variant.product_name,
          price: Number(variant.price),
          quantity: 1,
          maxStock: variant.stock_quantity,
        },
      ]);
    }
  };

  const handleQuantityChange = (variantId: number, val: number) => {
    setSelectedItems(
      selectedItems.map((item) =>
        item.product_variant_id === variantId
          ? { ...item, quantity: Math.min(Math.max(1, val), item.maxStock) }
          : item,
      ),
    );
  };

  const handleRemoveItem = (variantId: number) => {
    setSelectedItems(
      selectedItems.filter((i) => i.product_variant_id !== variantId),
    );
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return toast.error("Customer name is required.");
    if (selectedItems.length === 0) return toast.error("Invoice is empty.");
    if (isShortfall) return toast.error("Insufficient cash tendered payment.");

    try {
      setSubmitting(true);
      const payload = {
        customer_name: customerName,
        branch_id: branchId,
        items: selectedItems.map((i) => ({
          product_variant_id: i.product_variant_id,
          quantity: i.quantity,
        })),
      };

      const res = await orderApi.createOrder(payload);
      if (res.success || res.id) {
        toast.success("Transaction committed successfully!");
        setCustomerName("");
        setSelectedItems([]);
        setCashReceived("");
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to finalize order.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCatalog = catalog.filter(
    (item) =>
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              New POS Checkout Point
            </h3>
            <p className="text-xs text-gray-500">
              Create high-throughput atomic ledger entries
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition text-2xl"
          >
            &times;
          </button>
        </div>

        {/* The Split-View Matrix Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* LEFT ZONE: Product Search & Active Item Tray Menu (7 Columns) */}
          <div className="lg:col-span-7 p-6 overflow-y-auto border-r border-gray-200 flex flex-col gap-5">
            {/* Realtime Filter Catalog Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Catalog Quick Search
              </label>
              <input
                type="text"
                placeholder="Scan SKU barcode or type product variant name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
            </div>

            {/* Quick Filter Search Results dropdown/tray */}
            {searchQuery && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg max-h-40 overflow-y-auto divide-y divide-gray-200 shadow-inner">
                {filteredCatalog.length === 0 ? (
                  <div className="p-3 text-xs text-gray-400 italic">
                    No inventory matches found
                  </div>
                ) : (
                  filteredCatalog.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleAddItem(item)}
                      className="p-3 flex items-center justify-between cursor-pointer hover:bg-blue-50 transition text-sm text-gray-700"
                    >
                      <div>
                        <span className="font-semibold text-gray-900">
                          {item.product_name}
                        </span>
                        <span className="text-xs text-gray-400 ml-2 font-mono">
                          ({item.sku})
                        </span>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <span className="font-medium text-gray-900">
                          ${Number(item.price).toFixed(2)}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.stock_quantity > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                        >
                          Stock: {item.stock_quantity}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Active Invoice Tray Table Grid */}
            <div className="flex-1 flex flex-col min-h-[250px]">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Active Invoice Matrix
              </span>
              <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden bg-white overflow-y-auto">
                {selectedItems.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm italic p-6 text-center">
                    Invoice tray is currently empty. Search and tap items above
                    to add them to the ledger.
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Item Details
                        </th>
                        <th className="text-center px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
                          Qty
                        </th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
                          Subtotal
                        </th>
                        <th className="px-4 py-2 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedItems.map((item) => (
                        <tr
                          key={item.product_variant_id}
                          className="hover:bg-gray-50/50"
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-800">
                              {item.product_name}
                            </div>
                            <div className="text-xs text-gray-400 font-mono">
                              {item.sku} &middot; ${item.price.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              min="1"
                              max={item.maxStock}
                              value={item.quantity}
                              onChange={(e) =>
                                handleQuantityChange(
                                  item.product_variant_id,
                                  parseInt(e.target.value) || 1,
                                )
                              }
                              className="w-16 text-center border border-gray-300 rounded px-1.5 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-800">
                            ${(item.price * item.quantity).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() =>
                                handleRemoveItem(item.product_variant_id)
                              }
                              className="text-gray-400 hover:text-red-500 transition text-lg"
                            >
                              &times;
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT ZONE: Customer & Financial Commitment Drawer (5 Columns) */}
          <form
            onSubmit={handleSubmitOrder}
            className="lg:col-span-5 bg-gray-50 p-6 flex flex-col justify-between overflow-y-auto"
          >
            {/* Top Core Inputs Structure Section */}
            <div className="space-y-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Customer Entity Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Input consumer name details..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
              </div>

              {/* Hardcoded Branch context identifier mirror */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Operating Ledger Branch ID
                </label>
                <input
                  type="text"
                  disabled
                  value={`Branch Workspace context #${branchId}`}
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded text-sm text-gray-400 font-medium select-none cursor-not-allowed"
                />
              </div>

              <hr className="border-gray-200 my-2" />

              {/* Total Financial Invoice Summary Blocks */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Gross Matrix Total:</span>
                  <span className="font-medium text-gray-900">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 pt-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Cash Tendered Payment
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 text-sm font-medium">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-gray-300 rounded text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
                  </div>
                </div>

                {/* Balance Output Logic Display rows */}
                {cashReceived && (
                  <div
                    className={`p-3 rounded-lg border flex justify-between items-center text-sm transition ${isShortfall ? "bg-red-50 border-red-100 text-red-700" : "bg-green-50 border-green-100 text-green-700"}`}
                  >
                    <span className="font-medium">
                      {isShortfall
                        ? "Shortfall Deficit:"
                        : "Change Balance Due:"}
                    </span>
                    <span className="font-bold text-base">
                      ${Math.abs(changeDue).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Form Action Buttons Footers */}
            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-sm rounded border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 font-medium transition text-center"
              >
                Cancel View
              </button>
              <button
                type="submit"
                disabled={
                  submitting ||
                  selectedItems.length === 0 ||
                  !customerName.trim() ||
                  isShortfall
                }
                className={`flex-1 px-4 py-2.5 text-sm rounded text-white font-medium shadow-sm transition text-center ${
                  submitting ||
                  selectedItems.length === 0 ||
                  !customerName.trim() ||
                  isShortfall
                    ? "bg-gray-300 cursor-not-allowed text-gray-500"
                    : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/10"
                }`}
              >
                {submitting ? "Committing Entry..." : "Commit POS Order"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateOrderModal;
