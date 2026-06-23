import { useEffect, useState } from "react";
import { useAuth } from "../context/authContext";
import {
  getAllProducts,
  getProductVariants,
  updateProductVariant,
  toggleVariantActive,
} from "../api/products";
import type { Product, ProductVariant } from "../types";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import Toggle from "../components/ui/Toggle";
import AddVariantModal from "../components/ui/Modal";

interface ToastState {
  show: boolean;
  message: string;
  type: "success" | "error";
}

interface ExtendedVariant extends ProductVariant {
  color?: string;
  weight?: string;
  is_active: boolean;
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

  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [editFields, setEditFields] = useState({
    price: "",
    qty: "",
    sku: "",
  });

  const [activeProductForModal, setActiveProductForModal] =
    useState<Product | null>(null);

  useEffect(() => {
    if (token) loadProductsAndVariants();
  }, [token]);

  const showToastNotification = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
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
                let parsedOptions = [];
                if (Array.isArray(v.options)) {
                  parsedOptions = v.options;
                } else if (typeof v.options === "string") {
                  try {
                    parsedOptions = JSON.parse(v.options);
                  } catch (_) {
                    parsedOptions = [];
                  }
                }

                const colorOpt = parsedOptions.find(
                  (o: any) => o.type?.toLowerCase() === "color",
                );
                const weightOpt = parsedOptions.find(
                  (o: any) => o.type?.toLowerCase() === "weight",
                );

                return {
                  ...v,
                  color: colorOpt?.value || "",
                  weight: weightOpt?.value || "",
                };
              },
            );
            return { ...product, fetchedVariants: formattedVariants };
          } catch {
            return { ...product, fetchedVariants: [] };
          }
        }),
      );
      setDataPayload(fullyMappedData);
    } catch {
      showToastNotification(
        "Failed to organize product variants layout.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVariantActive = async (
    variantId: number,
    currentStatus: boolean,
  ) => {
    try {
      await toggleVariantActive(token!, variantId);
      showToastNotification(
        `Variant successfully ${currentStatus ? "deactivated" : "activated"}!`,
      );
      // Explicitly wipe the editing lock to force clean row paints
      setEditingRowId(null);
      await loadProductsAndVariants();
    } catch {
      showToastNotification("Failed to update variant status.", "error");
    }
  };

  const startEditingRow = (variant: ExtendedVariant) => {
    setEditingRowId(variant.id);
    setEditFields({
      sku: variant.sku,
      price: variant.price.toString(),
      qty: variant.stock_quantity.toString(),
    });
  };

  const handleInlineRowUpdate = async (variant: ExtendedVariant) => {
    try {
      await updateProductVariant(token!, variant.id, {
        sku: editFields.sku,
        price: parseFloat(editFields.price),
        stock_quantity: parseInt(editFields.qty, 10),
      });

      showToastNotification("Database successfully updated!", "success");
      setEditingRowId(null);
      await loadProductsAndVariants();
    } catch {
      showToastNotification(
        "Failed to save changes to backend database.",
        "error",
      );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      {toast.show && (
        <div
          className={`fixed bottom-5 right-5 z-[999] bg-gray-900 text-white text-sm px-5 py-3 rounded-lg shadow-2xl border-l-4 ${
            toast.type === "error" ? "border-red-500" : "border-emerald-500"
          }`}
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
              View, modify, and configure individual sub-catalog variants
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
                  <div className="mb-4 pb-3 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">
                        Product: {product.name}
                      </h3>
                      <p className="text-xs font-mono text-gray-400">
                        Product ID: {product.id}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveProductForModal(product)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded shadow"
                    >
                      + Add Variant
                    </button>
                  </div>

                  {product.fetchedVariants.length === 0 ? (
                    <p className="text-sm text-gray-400 italic py-2">
                      No variations assigned.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-50/70">
                            <th className="py-3 px-4">Variant ID / SKU</th>
                            <th className="py-3 px-4">Color</th>
                            <th className="py-3 px-4">Weight</th>
                            <th className="py-3 px-4">Price</th>
                            <th className="py-3 px-4">Qty</th>
                            <th className="py-3 px-4">Status / Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                          {product.fetchedVariants.map((variant) => {
                            const isDeactivated = !variant.is_active;
                            const isEditingRow = editingRowId === variant.id;

                            const rowModified =
                              isEditingRow &&
                              (editFields.sku !== variant.sku ||
                                parseFloat(editFields.price) !==
                                  parseFloat(variant.price as any) ||
                                parseInt(editFields.qty, 10) !==
                                  parseInt(variant.stock_quantity as any, 10));

                            return (
                              <tr
                                key={variant.id}
                                className={`transition-all duration-200 ${
                                  isDeactivated
                                    ? "opacity-30 bg-gray-100/40 grayscale"
                                    : ""
                                }`}
                              >
                                {/* SKU */}
                                <td className="py-3 px-4">
                                  <div className="text-xs font-mono font-bold text-gray-400">
                                    ID: {variant.id}
                                  </div>
                                  {isEditingRow ? (
                                    <input
                                      type="text"
                                      value={editFields.sku}
                                      onChange={(e) =>
                                        setEditFields({
                                          ...editFields,
                                          sku: e.target.value,
                                        })
                                      }
                                      className="border border-gray-300 rounded px-1.5 py-0.5 text-xs font-mono max-w-[120px] focus:outline-blue-500 mt-1"
                                    />
                                  ) : (
                                    <div className="text-sm font-medium text-gray-700 mt-0.5">
                                      {variant.sku}
                                    </div>
                                  )}
                                </td>

                                {/* Color — read-only, driven by variant options */}
                                <td className="py-3 px-4">
                                  <span className="font-medium">
                                    {variant.color || "—"}
                                  </span>
                                </td>

                                {/* Weight — read-only, driven by variant options */}
                                <td className="py-3 px-4 text-xs font-mono">
                                  <span>{variant.weight || "—"}</span>
                                </td>

                                {/* Price */}
                                <td className="py-3 px-4">
                                  {isEditingRow ? (
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editFields.price}
                                      onChange={(e) =>
                                        setEditFields({
                                          ...editFields,
                                          price: e.target.value,
                                        })
                                      }
                                      className="border border-gray-300 rounded px-1.5 py-0.5 text-xs max-w-[80px] focus:outline-blue-500"
                                    />
                                  ) : (
                                    <span className="font-semibold">
                                      $
                                      {parseFloat(variant.price as any).toFixed(
                                        2,
                                      )}
                                    </span>
                                  )}
                                </td>

                                {/* Qty */}
                                <td className="py-3 px-4">
                                  {isEditingRow ? (
                                    <input
                                      type="number"
                                      value={editFields.qty}
                                      onChange={(e) =>
                                        setEditFields({
                                          ...editFields,
                                          qty: e.target.value,
                                        })
                                      }
                                      className="border border-gray-300 rounded px-1.5 py-0.5 text-xs max-w-[70px] focus:outline-blue-500"
                                    />
                                  ) : (
                                    <span>{variant.stock_quantity}</span>
                                  )}
                                </td>

                                {/* Status / Actions */}
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-4">
                                    <Toggle
                                      checked={!isDeactivated}
                                      onChange={() =>
                                        handleToggleVariantActive(
                                          variant.id,
                                          !isDeactivated,
                                        )
                                      }
                                      labelRight={
                                        !isDeactivated ? "Active" : "Inactive"
                                      }
                                    />
                                    <div className="flex items-center gap-2">
                                      {isEditingRow ? (
                                        <>
                                          <button
                                            onClick={() =>
                                              setEditingRowId(null)
                                            }
                                            className="text-xs text-gray-400 hover:text-gray-600 font-medium px-2 py-1"
                                          >
                                            Cancel
                                          </button>
                                          {rowModified && (
                                            <button
                                              onClick={() =>
                                                handleInlineRowUpdate(variant)
                                              }
                                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-2.5 py-1 rounded shadow animate-pulse"
                                            >
                                              Update
                                            </button>
                                          )}
                                        </>
                                      ) : (
                                        <button
                                          onClick={() =>
                                            startEditingRow(variant)
                                          }
                                          className="text-blue-600 hover:text-blue-800 text-xs font-medium border border-blue-200 px-2 py-0.5 rounded hover:bg-blue-50"
                                        >
                                          Edit
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
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

      {/* AddVariantModal — cleanly extracted, no inline form needed */}
      <AddVariantModal
        isOpen={activeProductForModal !== null}
        product={activeProductForModal}
        token={token}
        onClose={() => setActiveProductForModal(null)}
        onSuccess={(msg) => {
          showToastNotification(msg, "success");
          loadProductsAndVariants();
        }}
        onError={(msg) => showToastNotification(msg, "error")}
      />
    </div>
  );
};

export default Variations;
