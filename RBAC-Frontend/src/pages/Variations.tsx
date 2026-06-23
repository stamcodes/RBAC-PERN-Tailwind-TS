import { useEffect, useState } from "react";
import { useAuth } from "../context/authContext";
import {
  getAllProducts,
  getProductVariants,
  updateProductVariant,
  toggleVariantActive,
  getAllVariantValues, // Matches the modal's function name
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

// Replace your old ExtendedVariant interface with this:
interface ExtendedVariant extends ProductVariant {
  is_active: boolean; // Ensures your toggle state stays cleanly tracked
}

interface ProductWithVariants extends Product {
  fetchedVariants: ExtendedVariant[];
}

interface VariantValueOption {
  id: number;
  name: string;
}

interface VariantTypeGroup {
  typeId: number;
  typeName: string;
  values: VariantValueOption[];
}

const Variations = () => {
  const { token } = useAuth();
  const [dataPayload, setDataPayload] = useState<ProductWithVariants[]>([]);
  const [variantTypes, setVariantTypes] = useState<VariantTypeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: "",
    type: "success",
  });

  const [editingRowId, setEditingRowId] = useState<number | null>(null);

  // Row inline inputs state
  const [editFields, setEditFields] = useState({ sku: "", price: "", qty: "" });
  // Row dropdowns mapping: { [typeId]: selectedValueId } -> Matches Modals.tsx!
  const [selectedValues, setSelectedValues] = useState<Record<number, number>>(
    {},
  );

  const [activeProductForModal, setActiveProductForModal] =
    useState<Product | null>(null);

  useEffect(() => {
    if (token) {
      initPageData();
    }
  }, [token]);

  const showToastNotification = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
  };

  const initPageData = async () => {
    try {
      setLoading(true);
      const res = await getAllVariantValues(token!);
      setVariantTypes(res.data ?? []);
      await loadProductsAndVariants();
    } catch {
      showToastNotification("Failed to load options from server.", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadProductsAndVariants = async () => {
    try {
      const prodRes = await getAllProducts(token!);
      const baseProducts: Product[] = prodRes.data ?? prodRes ?? [];

      const fullyMappedData = await Promise.all(
        baseProducts.map(async (product) => {
          try {
            const variantRes = await getProductVariants(token!, product.id);
            const rawVariants = variantRes.data ?? variantRes ?? [];
            return { ...product, fetchedVariants: rawVariants };
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

    // Parse out current options array elements to pre-populate dropdown selections dynamically
    const initialDropdowns: Record<number, number> = {};
    let parsedOptions: any[] = [];
    if (Array.isArray(variant.options)) {
      parsedOptions = variant.options;
    } else if (typeof variant.options === "string") {
      try {
        parsedOptions = JSON.parse(variant.options);
      } catch (_) {}
    }

    parsedOptions.forEach((opt: any) => {
      // Matches the type system by checking matching type identifiers across loaded config maps
      const matchingGroup = variantTypes.find(
        (g) => g.typeName.toLowerCase() === opt.type?.toLowerCase(),
      );
      const matchingValue = matchingGroup?.values.find(
        (v) => v.name === opt.value,
      );
      if (matchingGroup && matchingValue) {
        initialDropdowns[matchingGroup.typeId] = matchingValue.id;
      }
    });

    setSelectedValues(initialDropdowns);
  };

  const handleDropdownChange = (typeId: number, valueId: number) => {
    setSelectedValues((prev) => ({ ...prev, [typeId]: valueId }));
  };

  const handleInlineRowUpdate = async (variant: ExtendedVariant) => {
    try {
      // Strip zero values exactly like your Modal does
      const variantValueIds = Object.values(selectedValues).filter(
        (id) => id > 0,
      );

      await updateProductVariant(token!, variant.id, {
        sku: editFields.sku,
        price: parseFloat(editFields.price),
        stock_quantity: parseInt(editFields.qty, 10),
        variantValueIds:
          variantValueIds.length > 0 ? variantValueIds : undefined,
      });

      showToastNotification("Database successfully updated!", "success");
      setEditingRowId(null);
      await loadProductsAndVariants();
    } catch {
      showToastNotification("Failed to save changes to database.", "error");
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
              View and modify your global options mappings inline
            </p>
          </div>

          {loading ? (
            <p className="text-sm text-gray-400">Loading variations data...</p>
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
                            <th className="py-3 px-4">SKU</th>
                            {/* Dynamically build table headers based on standard available option types */}
                            {variantTypes.map((group) => (
                              <th key={group.typeId} className="py-3 px-4">
                                {group.typeName}
                              </th>
                            ))}
                            <th className="py-3 px-4">Price</th>
                            <th className="py-3 px-4">Qty</th>
                            <th className="py-3 px-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                          {product.fetchedVariants.map((variant) => {
                            const isDeactivated = !variant.is_active;
                            const isEditingRow = editingRowId === variant.id;

                            // Handle option values parsing dynamically for display
                            let parsedOpts: any[] = [];
                            if (Array.isArray(variant.options))
                              parsedOpts = variant.options;
                            else if (typeof variant.options === "string") {
                              try {
                                parsedOpts = JSON.parse(variant.options);
                              } catch (_) {}
                            }

                            return (
                              <tr
                                key={variant.id}
                                className={`transition-all duration-200 ${isDeactivated ? "opacity-40 bg-gray-100/50" : ""}`}
                              >
                                <td className="py-3 px-4">
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
                                      className="border border-gray-300 rounded px-2 py-1 text-xs font-mono max-w-[130px] focus:outline-blue-500"
                                    />
                                  ) : (
                                    <span className="font-mono text-xs">
                                      {variant.sku}
                                    </span>
                                  )}
                                </td>

                                {/* Dynamic Columns Match Selection Groups perfectly */}
                                {variantTypes.map((group) => {
                                  if (isEditingRow) {
                                    return (
                                      <td
                                        key={group.typeId}
                                        className="py-3 px-4"
                                      >
                                        <select
                                          value={
                                            selectedValues[group.typeId] ?? 0
                                          }
                                          onChange={(e) =>
                                            handleDropdownChange(
                                              group.typeId,
                                              parseInt(e.target.value, 10),
                                            )
                                          }
                                          className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-blue-500 bg-white min-w-[100px]"
                                        >
                                          <option value={0}>— None —</option>
                                          {group.values.map((v) => (
                                            <option key={v.id} value={v.id}>
                                              {v.name}
                                            </option>
                                          ))}
                                        </select>
                                      </td>
                                    );
                                  }

                                  const activeDisplayVal = parsedOpts.find(
                                    (o) =>
                                      o.type?.toLowerCase() ===
                                      group.typeName.toLowerCase(),
                                  );
                                  return (
                                    <td
                                      key={group.typeId}
                                      className="py-3 px-4 font-medium"
                                    >
                                      {activeDisplayVal
                                        ? activeDisplayVal.value
                                        : "—"}
                                    </td>
                                  );
                                })}

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
                                      className="border border-gray-300 rounded px-2 py-1 text-xs max-w-[80px]"
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
                                      className="border border-gray-300 rounded px-2 py-1 text-xs max-w-[70px]"
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
                                    />
                                    {isEditingRow ? (
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => setEditingRowId(null)}
                                          className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleInlineRowUpdate(variant)
                                          }
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-2.5 py-1 rounded shadow"
                                        >
                                          Save
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => startEditingRow(variant)}
                                        className="text-blue-600 hover:text-blue-800 text-xs font-medium border border-blue-200 px-2 py-0.5 rounded hover:bg-blue-50"
                                      >
                                        Edit
                                      </button>
                                    )}
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

      <AddVariantModal
        isOpen={activeProductForModal !== null}
        product={activeProductForModal}
        token={token}
        onClose={() => setActiveProductForModal(null)}
        onSuccess={(msg) => {
          showToastNotification(msg, "success");
          initPageData();
        }}
        onError={(msg) => showToastNotification(msg, "error")}
      />
    </div>
  );
};

export default Variations;
