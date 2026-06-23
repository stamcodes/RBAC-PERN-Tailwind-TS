import { useEffect, useState } from "react";
import { useAuth } from "../context/authContext";
import {
  getAllProducts,
  createProduct,
  getProductVariants,
  updateProductVariant,
  toggleVariantActive,
} from "../api/products";
import type { Product, ProductVariant } from "../types";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import Table from "../components/ui/Table";
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

const Products = () => {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [allCategories, setAllCategories] = useState<
    { id: number; name: string }[]
  >([]);

  const [searchInputs, setSearchInputs] = useState<Record<number, string>>({});
  const [pendingUpdates, setPendingUpdates] = useState<Record<number, boolean>>(
    {},
  );

  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: "",
    type: "success",
  });

  // Create product modal state
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newIsActive, setNewIsActive] = useState(true);
  const [creating, setCreating] = useState(false);

  // Variants overlay state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ExtendedVariant[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);

  // Inline variant edit state
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [editFields, setEditFields] = useState({ sku: "", price: "", qty: "" });

  // AddVariantModal trigger
  const [addVariantTarget, setAddVariantTarget] = useState<Product | null>(
    null,
  );

  const [openCategoryDropdown, setOpenCategoryDropdown] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (token) {
      fetchProducts();
      fetchAllCategories();
    }
  }, [token]);

  const showToastNotification = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
  };

  const fetchProducts = async () => {
    try {
      const res = await getAllProducts(token!);
      setProducts(res.data ?? []);
    } catch {
      setError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCategories = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAllCategories(data.data ?? data ?? []);
    } catch {
      showToastNotification("Failed to fetch categories.", "error");
    }
  };

  const loadVariantsForProduct = async (product: Product) => {
    setSelectedProduct(product);
    setVariantsLoading(true);
    setEditingRowId(null);
    try {
      const res = await getProductVariants(token!, product.id);
      const rawVariants = res.data ?? [];

      const formatted: ExtendedVariant[] = rawVariants.map((v: any) => {
        let parsedOptions = [];
        if (Array.isArray(v.options)) {
          parsedOptions = v.options;
        } else if (typeof v.options === "string") {
          try {
            parsedOptions = JSON.parse(v.options);
          } catch {
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
      });

      setVariants(formatted);
    } catch {
      showToastNotification("Failed to load variants.", "error");
    } finally {
      setVariantsLoading(false);
    }
  };

  const handleToggleProductActive = async (
    productId: number,
    currentStatus: boolean,
  ) => {
    try {
      await fetch(`http://localhost:5000/api/products`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: productId, is_active: !currentStatus }),
      });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, is_active: !currentStatus } : p,
        ),
      );
      showToastNotification(
        `Product successfully ${!currentStatus ? "activated" : "deactivated"}!`,
      );
    } catch {
      showToastNotification(
        "Failed to save state change to database.",
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
        `Variant ${currentStatus ? "deactivated" : "activated"} successfully!`,
      );
      await loadVariantsForProduct(selectedProduct!);
    } catch {
      showToastNotification("Failed to update variant status.", "error");
    }
  };

  const handleAddCategory = async (productId: number, categoryId: number) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/products/${productId}/categories`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ categoryId: Number(categoryId) }),
        },
      );
      const data = await res.json();
      if (res.status === 200 || res.status === 201 || data.success) {
        setPendingUpdates((prev) => ({ ...prev, [productId]: true }));
        await fetchProducts();
      } else {
        showToastNotification(
          data.message || "Failed to add category.",
          "error",
        );
      }
    } catch {
      showToastNotification("Failed to add category.", "error");
    } finally {
      setOpenCategoryDropdown(null);
    }
  };

  const handleRemoveCategory = async (
    productId: number,
    categoryId: number,
  ) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/products/${productId}/categories/${categoryId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (res.status === 200 || data.success) {
        setPendingUpdates((prev) => ({ ...prev, [productId]: true }));
        await fetchProducts();
      } else {
        showToastNotification(
          data.message || "Failed to remove category.",
          "error",
        );
      }
    } catch {
      showToastNotification("Failed to remove category.", "error");
    }
  };

  const handleSaveUpdate = async (productId: number) => {
    try {
      const res = await fetch(`http://localhost:5000/api/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const verifiedDataList: Product[] = data.data ?? [];
      const isStillInDb = verifiedDataList.some(
        (p) => Number(p.id) === Number(productId),
      );
      if (isStillInDb) {
        showToastNotification(
          "Product categories successfully updated in database!",
          "success",
        );
        setPendingUpdates((prev) => ({ ...prev, [productId]: false }));
      } else {
        showToastNotification(
          "Error: Product changes could not be targeted in DB.",
          "error",
        );
      }
    } catch {
      showToastNotification("Failed to finalize update check.", "error");
    }
  };

  const handleCreateProduct = async () => {
    if (!newName || !newPrice) {
      showToastNotification("Name and price are required.", "error");
      return;
    }
    try {
      setCreating(true);
      const res = await createProduct(
        token!,
        newName,
        newDescription,
        parseFloat(newPrice),
        newIsActive,
      );
      const addedProduct = res?.data ?? res;
      setProducts((prev) => [...prev, addedProduct]);
      setNewName("");
      setNewDescription("");
      setNewPrice("");
      setNewIsActive(true);
      setShowCreateProduct(false);
      showToastNotification("Product created successfully.");
    } catch (err: any) {
      showToastNotification(
        err.response?.data?.message ||
          err.message ||
          "Failed to create product.",
        "error",
      );
    } finally {
      setCreating(false);
    }
  };

  const startEditingVariantRow = (variant: ExtendedVariant) => {
    setEditingRowId(variant.id);
    setEditFields({
      sku: variant.sku,
      price: variant.price.toString(),
      qty: variant.stock_quantity.toString(),
    });
  };

  const handleInlineVariantUpdate = async (variant: ExtendedVariant) => {
    try {
      await updateProductVariant(token!, variant.id, {
        sku: editFields.sku,
        price: parseFloat(editFields.price),
        stock_quantity: parseInt(editFields.qty, 10),
      });
      showToastNotification("Variant updated successfully!", "success");
      setEditingRowId(null);
      await loadVariantsForProduct(selectedProduct!);
    } catch {
      showToastNotification("Failed to update variant.", "error");
    }
  };

  const productColumns = [
    { header: "ID", accessor: "id" as keyof Product },
    { header: "Name", accessor: "name" as keyof Product },
    { header: "Description", accessor: "description" as keyof Product },
    {
      header: "Price",
      accessor: (row: Product) => `$${parseFloat(row.price).toFixed(2)}`,
    },
    {
      header: "Status",
      accessor: (row: Product) => (
        <Toggle
          checked={row.is_active}
          onChange={() => handleToggleProductActive(row.id, row.is_active)}
          labelRight={row.is_active ? "Active" : "Inactive"}
        />
      ),
    },
    {
      header: "Categories",
      accessor: (row: Product) => {
        const assigned: any[] = row.categories ?? [];
        const currentSearchTerm = searchInputs[row.id] ?? "";
        const availableToAdd = allCategories.filter((c) => {
          const isNotAssigned = !assigned.some((a) => {
            const assignedId = a?.id ?? a?.category_id;
            return Number(assignedId) === Number(c.id);
          });
          const matchesSearch = c.name
            .toLowerCase()
            .includes(currentSearchTerm.toLowerCase());
          return isNotAssigned && matchesSearch;
        });

        return (
          <div className="flex flex-wrap items-center gap-2 relative">
            {assigned.length === 0 && (
              <span className="text-gray-400 text-xs">No categories</span>
            )}
            {assigned.map((cat) => {
              const catId = cat?.id ?? cat?.category_id;
              const catName =
                cat?.name ||
                allCategories.find((c) => Number(c.id) === Number(catId))
                  ?.name ||
                `Cat #${catId}`;
              if (!catId) return null;
              return (
                <span
                  key={catId}
                  className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full"
                >
                  {catName}
                  <button
                    onClick={() => handleRemoveCategory(row.id, catId)}
                    className="text-blue-400 hover:text-red-500 transition ml-0.5 leading-none font-bold"
                    title="Remove category"
                  >
                    ×
                  </button>
                </span>
              );
            })}

            <div className="relative flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchInputs((prev) => ({ ...prev, [row.id]: "" }));
                  setOpenCategoryDropdown(
                    openCategoryDropdown === row.id ? null : row.id,
                  );
                }}
                className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 hover:bg-blue-600 hover:text-white text-gray-600 text-xs font-bold transition"
                title="Add category"
              >
                +
              </button>

              {pendingUpdates[row.id] && (
                <button
                  onClick={() => handleSaveUpdate(row.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow transition animate-pulse"
                >
                  Update
                </button>
              )}

              {openCategoryDropdown === row.id && (
                <div
                  className="absolute z-50 top-6 left-0 bg-white border border-gray-200 rounded shadow-xl min-w-[200px] p-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    value={currentSearchTerm}
                    autoFocus
                    placeholder="Type category name..."
                    onChange={(e) =>
                      setSearchInputs((prev) => ({
                        ...prev,
                        [row.id]: e.target.value,
                      }))
                    }
                    className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="max-h-[160px] overflow-y-auto flex flex-col gap-0.5">
                    {availableToAdd.length === 0 ? (
                      <div className="px-2 py-1.5 text-xs text-gray-400 text-center italic">
                        No matches found
                      </div>
                    ) : (
                      availableToAdd.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => handleAddCategory(row.id, cat.id)}
                          className="w-full text-left px-2 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded transition"
                        >
                          {cat.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: "Variants",
      accessor: (row: Product) => (
        <button
          onClick={() => loadVariantsForProduct(row)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium transition"
        >
          View Variants
        </button>
      ),
    },
  ];

  return (
    <div
      className="flex flex-col min-h-screen relative"
      onClick={() => setOpenCategoryDropdown(null)}
    >
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
        <main className="flex-1 p-8 bg-gray-50">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-2xl font-bold text-gray-800">Products</h2>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCreateProduct(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded transition"
            >
              + New Product
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-8">
            Manage products and their variants
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded px-4 py-3 mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <p className="text-sm text-gray-400">Loading products...</p>
          ) : (
            <div
              onClick={(e) => e.stopPropagation()}
              className="[&_tr]:transition-all [&_tr]:duration-200 [&_tr:has(button[aria-checked=false])]:opacity-40 [&_tr:has(button[aria-checked=false])]:bg-gray-100/40 [&_tr:has(button[aria-checked=false])]:grayscale-[40%]"
            >
              <Table columns={productColumns} data={products} />
            </div>
          )}

          {/* Create Product Modal */}
          {showCreateProduct && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
                <h3 className="text-lg font-bold text-gray-800 mb-6">
                  Create New Product
                </h3>
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Running Shoes"
                      className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <input
                      type="text"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="e.g. High performance running shoes"
                      className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">
                      Price
                    </label>
                    <input
                      type="number"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="e.g. 59.99"
                      className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={newIsActive}
                      onChange={(e) => setNewIsActive(e.target.checked)}
                      className="accent-blue-600"
                      id="is_active"
                    />
                    <label
                      htmlFor="is_active"
                      className="text-sm font-medium text-gray-700"
                    >
                      Active
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowCreateProduct(false)}
                    className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateProduct}
                    disabled={creating}
                    className={`px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition ${creating ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {creating ? "Creating..." : "Create Product"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Variants Overlay */}
          {selectedProduct && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-4xl max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      Variants — {selectedProduct.name}
                    </h3>
                    <p className="text-xs font-mono text-gray-400">
                      Product ID: {selectedProduct.id}
                    </p>
                  </div>
                  <button
                    onClick={() => setAddVariantTarget(selectedProduct)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded transition"
                  >
                    + Add Variant
                  </button>
                </div>

                <div className="mt-6">
                  {variantsLoading ? (
                    <p className="text-sm text-gray-400">Loading variants...</p>
                  ) : variants.length === 0 ? (
                    <p className="text-sm text-gray-400 italic py-4 text-center">
                      No variants yet. Click "+ Add Variant" to create one.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-50/70">
                            <th className="py-3 px-4">ID / SKU</th>
                            <th className="py-3 px-4">Color</th>
                            <th className="py-3 px-4">Weight</th>
                            <th className="py-3 px-4">Price</th>
                            <th className="py-3 px-4">Stock</th>
                            <th className="py-3 px-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                          {variants.map((variant) => {
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
                                className="transition-all duration-200"
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
                                  <span className="font-medium">
                                    {variant.color || "—"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-xs font-mono">
                                  <span>{variant.weight || "—"}</span>
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
                                  <div className="flex items-center gap-3">
                                    <Toggle
                                      checked={variant.is_active}
                                      onChange={() =>
                                        handleToggleVariantActive(
                                          variant.id,
                                          variant.is_active,
                                        )
                                      }
                                      labelRight={
                                        variant.is_active
                                          ? "Active"
                                          : "Inactive"
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
                                                handleInlineVariantUpdate(
                                                  variant,
                                                )
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
                                            startEditingVariantRow(variant)
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

                <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setSelectedProduct(null);
                      setVariants([]);
                      setEditingRowId(null);
                    }}
                    className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* AddVariantModal — component, not inline */}
      <AddVariantModal
        isOpen={addVariantTarget !== null}
        product={addVariantTarget}
        token={token}
        onClose={() => setAddVariantTarget(null)}
        onSuccess={(msg) => {
          showToastNotification(msg, "success");
          if (selectedProduct) loadVariantsForProduct(selectedProduct);
        }}
        onError={(msg) => showToastNotification(msg, "error")}
      />
    </div>
  );
};

export default Products;
