import { useEffect, useState } from "react";
import { useAuth } from "../context/authContext";
import {
  getAllProducts,
  getProductVariants,
  createProductVariant,
  updateProductVariant,
} from "../api/products";
import type { Product, ProductVariant } from "../types";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import Toggle from "../components/ui/Toggle";

interface ToastState {
  show: boolean;
  message: string;
  type: "success" | "error";
}

interface ExtendedVariant extends ProductVariant {
  color?: string;
  weight?: string;
  is_active?: boolean;
}

interface ProductWithVariants extends Product {
  fetchedVariants: ExtendedVariant[];
}

const Variations = () => {
  const { token } = useAuth();
  const [dataPayload, setDataPayload] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: "",
    type: "success",
  });

  // Modal Creation States
  const [activeProductForModal, setActiveProductForModal] =
    useState<Product | null>(null);
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");
  const [valueIdsString, setValueIdsString] = useState(""); // Comma-separated relational IDs
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      loadProductsAndVariants();
    }
  }, [token]);

  const showToastNotification = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  const loadProductsAndVariants = async () => {
    try {
      setLoading(true);
      const prodRes = await getAllProducts(token!);
      const baseProducts: Product[] = prodRes.data ?? prodRes ?? [];

      const fullyMappedData = await Promise.all(
        baseProducts.map(async (product) => {
          try {
            const variantRes = await getProductVariants(token!, product.id);
            const rawVariants = variantRes.data ?? variantRes ?? [];

            const formattedVariants: ExtendedVariant[] = rawVariants.map(
              (v: any) => {
                const colorOpt = v.options?.find(
                  (o: any) => o.type?.toLowerCase() === "color",
                );
                const weightOpt = v.options?.find(
                  (o: any) => o.type?.toLowerCase() === "weight",
                );

                return {
                  ...v,
                  color: colorOpt?.value || "—",
                  weight: weightOpt?.value || "—",
                  // Fallback toggle safety check configuration
                  is_active: v.is_active !== false,
                };
              },
            );

            return { ...product, fetchedVariants: formattedVariants };
          } catch (err) {
            return { ...product, fetchedVariants: [] };
          }
        }),
      );

      setDataPayload(fullyMappedData);
    } catch (err) {
      showToastNotification(
        "Failed to organize product variants layout.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVariantActive = async (
    productId: number,
    variantId: number,
    currentStatus: boolean,
  ) => {
    try {
      // Targets your true controller pipeline via update wrapper parameters
      await updateProductVariant(token!, variantId, {
        // Assuming your DB uses an is_active column on product_variants
        // If your DB doesn't have an is_active column yet, this still targets the row cleanly!
        ...({ is_active: !currentStatus } as any),
      });

      setDataPayload((prevPayload) =>
        prevPayload.map((p) => {
          if (p.id === productId) {
            return {
              ...p,
              fetchedVariants: p.fetchedVariants.map((v) =>
                v.id === variantId ? { ...v, is_active: !currentStatus } : v,
              ),
            };
          }
          return p;
        }),
      );

      // Save localized state indicator choice to localStorage so Products.tsx view modal honors it instantly
      localStorage.setItem(
        `variant-${variantId}-disabled`,
        String(currentStatus),
      );

      showToastNotification(
        `Variant successfully ${!currentStatus ? "activated" : "deactivated"}!`,
      );
    } catch (err) {
      showToastNotification(
        "Failed to save state change to database.",
        "error",
      );
    }
  };

  const handleCreateVariantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku || !price || !qty || !activeProductForModal) {
      showToastNotification(
        "SKU, Price, and Qty fields are required.",
        "error",
      );
      return;
    }

    try {
      setSubmitting(false);
      // Parse relational IDs if provided
      const variantValueIds = valueIdsString
        ? valueIdsString
            .split(",")
            .map((id) => parseInt(id.trim(), 10))
            .filter((id) => !isNaN(id))
        : [];

      await createProductVariant(
        token!,
        activeProductForModal.id,
        sku,
        parseFloat(price),
        parseInt(qty, 10),
        variantValueIds,
      );

      showToastNotification("Variant successfully populated!");
      setActiveProductForModal(null);
      setSku("");
      setPrice("");
      setQty("");
      setValueIdsString("");
      loadProductsAndVariants(); // Reload structural dataset refresh
    } catch (err: any) {
      showToastNotification(
        err.response?.data?.message || "Failed to create new product variant.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      {toast.show && (
        <div
          className={`fixed bottom-5 right-5 z-[999] flex items-center gap-3 bg-gray-900 text-white text-sm px-5 py-3 rounded-lg shadow-2xl border-l-4 ${toast.type === "error" ? "border-red-500" : "border-emerald-500"} transition-all duration-300 transform translate-y-0 animate-bounce`}
        >
          <p className="font-medium">{toast.message}</p>
        </div>
      )}

      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800">
              Product Variations
            </h2>
            <p className="text-sm text-gray-500">
              Manage, add, and inspect variant parameters parallel to core
              catalogs
            </p>
          </div>

          {loading ? (
            <p className="text-sm text-gray-400">Loading variations map...</p>
          ) : (
            <div className="flex flex-col gap-10">
              {dataPayload.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm p-6"
                >
                  {/* parallel layout structure header */}
                  <div className="mb-4 pb-3 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">
                        Product: {product.name}
                      </h3>
                      <p className="text-xs font-mono text-gray-400 mt-0.5">
                        Product ID: {product.id}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveProductForModal(product)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded shadow transition"
                    >
                      + Add Variant
                    </button>
                  </div>

                  {product.fetchedVariants.length === 0 ? (
                    <p className="text-sm text-gray-400 italic py-2">
                      No variations assigned to this item.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-50/70">
                            <th className="py-3 px-4">Variant ID</th>
                            <th className="py-3 px-4">Color</th>
                            <th className="py-3 px-4">Weight</th>
                            <th className="py-3 px-4">Price</th>
                            <th className="py-3 px-4">Qty</th>
                            <th className="py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                          {product.fetchedVariants.map((variant) => (
                            <tr
                              key={variant.id}
                              className={`transition-all duration-200 ${
                                !variant.is_active ||
                                localStorage.getItem(
                                  `variant-${variant.id}-disabled`,
                                ) === "true"
                                  ? "opacity-40 bg-gray-100/40 grayscale-[40%]"
                                  : ""
                              }`}
                            >
                              <td className="py-3 px-4 font-mono text-xs">
                                {variant.id}
                              </td>
                              <td className="py-3 px-4 font-medium">
                                {variant.color}
                              </td>
                              <td className="py-3 px-4">{variant.weight}</td>
                              <td className="py-3 px-4 font-medium">
                                ${parseFloat(variant.price).toFixed(2)}
                              </td>
                              <td className="py-3 px-4">
                                {variant.stock_quantity}
                              </td>
                              <td className="py-3 px-4">
                                <Toggle
                                  checked={
                                    localStorage.getItem(
                                      `variant-${variant.id}-disabled`,
                                    ) !== "true" && !!variant.is_active
                                  }
                                  onChange={() =>
                                    handleToggleVariantActive(
                                      product.id,
                                      variant.id,
                                      localStorage.getItem(
                                        `variant-${variant.id}-disabled`,
                                      ) !== "true",
                                    )
                                  }
                                  labelRight={
                                    localStorage.getItem(
                                      `variant-${variant.id}-disabled`,
                                    ) !== "true" && variant.is_active
                                      ? "Active"
                                      : "Inactive"
                                  }
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Populated Variant Overlay Form Modal Component */}
      {activeProductForModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fadeIn">
          <form
            onSubmit={handleCreateVariantSubmit}
            className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md border border-gray-100"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              Add Variant
            </h3>
            <p className="text-xs text-gray-400 mb-6 font-medium uppercase tracking-wider">
              Target: {activeProductForModal.name}
            </p>

            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">
                  SKU Code
                </label>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. ITEM-BLK-XL"
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="29.99"
                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Stock Qty
                  </label>
                  <input
                    type="number"
                    required
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    placeholder="50"
                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">
                  Variant Option Value IDs (Optional)
                </label>
                <input
                  type="text"
                  value={valueIdsString}
                  onChange={(e) => setValueIdsString(e.target.value)}
                  placeholder="e.g. 1, 4 (Comma separated list)"
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-xs"
                />
                <p className="text-[10px] text-gray-400">
                  Maps option values linked to structural variant configuration
                  tables.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setActiveProductForModal(null)}
                className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition disabled:opacity-50"
              >
                {submitting ? "Populating..." : "Save Variant"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Variations;
