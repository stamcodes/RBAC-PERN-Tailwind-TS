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

  // Inline Editing Map states tracker
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [editFields, setEditFields] = useState({
    price: "",
    qty: "",
    sku: "",
    color: "",
    weight: "",
  });

  // Modal Creation Form States
  const [activeProductForModal, setActiveProductForModal] =
    useState<Product | null>(null);
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");
  const [color, setColor] = useState("");
  const [weight, setWeight] = useState("");
  const [valueIdsString, setValueIdsString] = useState("");
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
                  color: colorOpt?.value || "",
                  weight: weightOpt?.value || "",
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

  const handleToggleVariantActive = (
    variantId: number,
    currentStatus: boolean,
  ) => {
    if (currentStatus) {
      localStorage.setItem(`variant-${variantId}-disabled`, "true");
    } else {
      localStorage.removeItem(`variant-${variantId}-disabled`);
    }
    setDataPayload((prev) => [...prev]);
    showToastNotification(
      `Variant successfully ${currentStatus ? "deactivated" : "activated"}!`,
    );
  };

  // Triggers context inline field edit switches
  const startEditingRow = (variant: ExtendedVariant) => {
    setEditingRowId(variant.id);
    setEditFields({
      sku: variant.sku,
      price: variant.price.toString(),
      qty: variant.stock_quantity.toString(),
      color: variant.color || "",
      weight: variant.weight || "",
    });
  };

  const handleInlineRowUpdate = async (variant: ExtendedVariant) => {
    try {
      await updateProductVariant(token!, variant.id, {
        sku: editFields.sku,
        price: parseFloat(editFields.price),
        stock_quantity: parseInt(editFields.qty, 10),
        color: editFields.color,
        weight: editFields.weight,
      });

      showToastNotification("Database successfully updated!", "success");
      setEditingRowId(null);
      loadProductsAndVariants();
    } catch (e) {
      showToastNotification(
        "Failed to save changes to backend database.",
        "error",
      );
    }
  };

  const handleCreateVariantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku || !price || !qty || !activeProductForModal) return;

    try {
      setSubmitting(true);
      const variantValueIds = valueIdsString
        ? valueIdsString
            .split(",")
            .map((id) => parseInt(id.trim(), 10))
            .filter((id) => !isNaN(id))
        : [];

      // FIXED: Sending color and weight directly inside the body payload config object parameter wrapper
      await createProductVariant(
        token!,
        activeProductForModal.id,
        sku,
        parseFloat(price),
        parseInt(qty, 10),
        variantValueIds,
        color,
        weight,
      );

      showToastNotification("Variant successfully populated!");
      setActiveProductForModal(null);
      setSku("");
      setPrice("");
      setQty("");
      setColor("");
      setWeight("");
      setValueIdsString("");
      loadProductsAndVariants();
    } catch (err: any) {
      showToastNotification(
        err.response?.data?.message || "Failed to create variant.",
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
          className={`fixed bottom-5 right-5 z-[999] bg-gray-900 text-white text-sm px-5 py-3 rounded-lg shadow-2xl border-l-4 ${toast.type === "error" ? "border-red-500" : "border-emerald-500"}`}
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
                            const isDeactivated =
                              localStorage.getItem(
                                `variant-${variant.id}-disabled`,
                              ) === "true";
                            const isEditingRow = editingRowId === variant.id;

                            const rowModified =
                              isEditingRow &&
                              (editFields.sku !== variant.sku ||
                                parseFloat(editFields.price) !==
                                  parseFloat(variant.price as any) ||
                                parseInt(editFields.qty, 10) !==
                                  parseInt(variant.stock_quantity as any, 10) ||
                                editFields.color !== (variant.color || "") ||
                                editFields.weight !== (variant.weight || ""));

                            return (
                              <tr
                                key={variant.id}
                                className={`transition-all duration-200 ${isDeactivated ? "opacity-30 bg-gray-100/40 grayscale" : ""}`}
                              >
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
                                <td className="py-3 px-4">
                                  {isEditingRow ? (
                                    <input
                                      type="text"
                                      value={editFields.color}
                                      placeholder="e.g. Red"
                                      onChange={(e) =>
                                        setEditFields({
                                          ...editFields,
                                          color: e.target.value,
                                        })
                                      }
                                      className="border border-gray-300 rounded px-1.5 py-0.5 text-xs max-w-[90px] focus:outline-blue-500"
                                    />
                                  ) : (
                                    <span className="font-medium">
                                      {variant.color || "—"}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-xs font-mono">
                                  {isEditingRow ? (
                                    <input
                                      type="text"
                                      value={editFields.weight}
                                      placeholder="e.g. 5kg"
                                      onChange={(e) =>
                                        setEditFields({
                                          ...editFields,
                                          weight: e.target.value,
                                        })
                                      }
                                      className="border border-gray-300 rounded px-1.5 py-0.5 text-xs max-w-[80px] focus:outline-blue-500"
                                    />
                                  ) : (
                                    <span>{variant.weight || "—"}</span>
                                  )}
                                </td>
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

      {/* Creation Modal View Setup */}
      {activeProductForModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form
            onSubmit={handleCreateVariantSubmit}
            className="bg-white rounded-lg p-8 w-full max-w-md"
          >
            <h3 className="text-lg font-bold text-gray-800">
              Add Variant to {activeProductForModal.name}
            </h3>
            <div className="flex flex-col gap-4 my-4">
              <input
                type="text"
                required
                value={sku}
                placeholder="SKU Code"
                onChange={(e) => setSku(e.target.value)}
                className="border p-2 rounded text-sm w-full"
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={color}
                  placeholder="Color (Optional, e.g. Blue)"
                  onChange={(e) => setColor(e.target.value)}
                  className="border p-2 rounded text-sm"
                />
                <input
                  type="text"
                  value={weight}
                  placeholder="Weight (Optional, e.g. 12kg)"
                  onChange={(e) => setWeight(e.target.value)}
                  className="border p-2 rounded text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="0.01"
                  required
                  value={price}
                  placeholder="Price ($)"
                  onChange={(e) => setPrice(e.target.value)}
                  className="border p-2 rounded text-sm"
                />
                <input
                  type="number"
                  required
                  value={qty}
                  placeholder="Stock Qty"
                  onChange={(e) => setQty(e.target.value)}
                  className="border p-2 rounded text-sm"
                />
              </div>

              <input
                type="text"
                value={valueIdsString}
                placeholder="Explicit Option Value IDs (Optional: e.g. 1, 4)"
                onChange={(e) => setValueIdsString(e.target.value)}
                className="border p-2 rounded text-xs font-mono"
              />
            </div>
            <div className="flex gap-2 justify-end border-t pt-3">
              <button
                type="button"
                onClick={() => setActiveProductForModal(null)}
                className="border px-4 py-1.5 rounded text-sm text-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-medium"
              >
                {submitting ? "Saving..." : "Save Variant"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Variations;
