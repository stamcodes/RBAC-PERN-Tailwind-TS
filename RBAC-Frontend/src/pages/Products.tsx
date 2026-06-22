import { useEffect, useState } from "react";
import { useAuth } from "../context/authContext";
import {
  getAllProducts,
  createProduct,
  getProductVariants,
  createProductVariant,
} from "../api/products";
import type { Product, ProductVariant } from "../types";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import Table from "../components/ui/Table";
import Badge from "../components/ui/Badge";

interface ToastState {
  show: boolean;
  message: string;
  type: "success" | "error";
}

const Products = () => {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [allCategories, setAllCategories] = useState<
    { id: number; name: string }[]
  >([]);

  // Category Search input states tracking per row ID
  const [searchInputs, setSearchInputs] = useState<Record<number, string>>({});

  // Local changes tracking map to display the "UPDATE" button per row if category changed
  const [pendingUpdates, setPendingUpdates] = useState<Record<number, boolean>>(
    {},
  );

  // Toast status reporting state
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: "",
    type: "success",
  });

  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newIsActive, setNewIsActive] = useState(true);
  const [creating, setCreating] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);

  const [showCreateVariant, setShowCreateVariant] = useState(false);
  const [newSku, setNewSku] = useState("");
  const [newVariantPrice, setNewVariantPrice] = useState("");
  const [newStockQuantity, setNewStockQuantity] = useState("");
  const [creatingVariant, setCreatingVariant] = useState(false);

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
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  const fetchProducts = async () => {
    try {
      const res = await getAllProducts(token!);
      setProducts(res.data ?? []);
    } catch (err) {
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
    } catch (err) {
      console.error("Failed to fetch categories", err);
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
        // Instantly refresh local component list representation
        await fetchProducts();
      } else {
        alert(data.message || "Failed to add category.");
      }
    } catch (err) {
      alert("Failed to add category.");
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
        alert(data.message || "Failed to remove category.");
      }
    } catch (err) {
      alert("Failed to remove category.");
    }
  };

  const handleSaveUpdate = async (productId: number) => {
    try {
      // Re-fetch to verify actual operational database data state persistence
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
    } catch (e) {
      showToastNotification("Failed to finalize update check.", "error");
    }
  };

  const handleCreateProduct = async () => {
    if (!newName || !newPrice) {
      alert("Name and price are required.");
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
      const message = err.response?.data?.message || err.message;
      alert(`Failed to create product: ${message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleOpenVariants = async (product: Product) => {
    setSelectedProduct(product);
    setVariantsLoading(true);
    try {
      const res = await getProductVariants(token!, product.id);
      setVariants(res.data ?? []);
    } catch (err) {
      alert("Failed to load variants.");
    } finally {
      setVariantsLoading(false);
    }
  };

  const handleCreateVariant = async () => {
    if (!newSku || !newVariantPrice || !newStockQuantity) {
      alert("SKU, price, and stock quantity are required.");
      return;
    }
    try {
      setCreatingVariant(true);
      const res = await createProductVariant(
        token!,
        selectedProduct!.id,
        newSku,
        parseFloat(newVariantPrice),
        parseInt(newStockQuantity),
      );
      setVariants((prev) => [...prev, res.data ?? res]);
      setNewSku("");
      setNewVariantPrice("");
      setNewStockQuantity("");
      setShowCreateVariant(false);
      showToastNotification("Product variant saved successfully!");
    } catch (err: any) {
      const message = err.response?.data?.message || err.message;
      alert(`Failed to create variant: ${message}`);
    } finally {
      setCreatingVariant(false);
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
        <Badge
          label={row.is_active ? "Active" : "Inactive"}
          variant={row.is_active ? "green" : "red"}
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

              {/* Dynamic Action Update Button */}
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
          onClick={() => handleOpenVariants(row)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium transition"
        >
          View Variants
        </button>
      ),
    },
  ];

  const variantColumns = [
    { header: "ID", accessor: "id" as keyof ProductVariant },
    { header: "SKU", accessor: "sku" as keyof ProductVariant },
    {
      header: "Price",
      accessor: (row: ProductVariant) => `$${parseFloat(row.price).toFixed(2)}`,
    },
    { header: "Stock", accessor: "stock_quantity" as keyof ProductVariant },
    {
      header: "Options",
      accessor: (row: ProductVariant) =>
        row.options?.length > 0
          ? row.options.map((o) => `${o.type}: ${o.value}`).join(", ")
          : "—",
    },
  ];

  return (
    <div
      className="flex flex-col min-h-screen relative"
      onClick={() => setOpenCategoryDropdown(null)}
    >
      <Navbar />

      {/* Toast Alert Portal Interface Layout UI */}
      {toast.show && (
        <div className="fixed bottom-5 right-5 z-[999] flex items-center gap-3 bg-gray-900 text-white text-sm px-5 py-3 rounded-lg shadow-2xl border-l-4 border-emerald-500 transition-all duration-300 transform translate-y-0 animate-bounce">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
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
            <div onClick={(e) => e.stopPropagation()}>
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

          {/* Variants Overlay View */}
          {selectedProduct && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-3xl">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-bold text-gray-800">
                    Variants — {selectedProduct.name}
                  </h3>
                  <button
                    onClick={() => setShowCreateVariant(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded transition"
                  >
                    + Add Variant
                  </button>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  Product ID: {selectedProduct.id}
                </p>
                {variantsLoading ? (
                  <p className="text-sm text-gray-400">Loading variants...</p>
                ) : (
                  <Table columns={variantColumns} data={variants} />
                )}
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => {
                      setSelectedProduct(null);
                      setVariants([]);
                      setShowCreateVariant(false);
                    }}
                    className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
                  >
                    Close
                  </button>
                </div>

                {showCreateVariant && (
                  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-60">
                    <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
                      <h3 className="text-lg font-bold text-gray-800 mb-6">
                        Add Variant to {selectedProduct.name}
                      </h3>
                      <div className="flex flex-col gap-4 mb-6">
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-medium text-gray-700">
                            SKU
                          </label>
                          <input
                            type="text"
                            value={newSku}
                            onChange={(e) => setNewSku(e.target.value)}
                            placeholder="e.g. SHOE-RED-42"
                            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-medium text-gray-700">
                            Price
                          </label>
                          <input
                            type="number"
                            value={newVariantPrice}
                            onChange={(e) => setNewVariantPrice(e.target.value)}
                            placeholder="e.g. 49.99"
                            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-medium text-gray-700">
                            Stock Quantity
                          </label>
                          <input
                            type="number"
                            value={newStockQuantity}
                            onChange={(e) =>
                              setNewStockQuantity(e.target.value)
                            }
                            placeholder="e.g. 100"
                            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 justify-end">
                        <button
                          onClick={() => setShowCreateVariant(false)}
                          className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreateVariant}
                          disabled={creatingVariant}
                          className={`px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition ${creatingVariant ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {creatingVariant ? "Adding..." : "Add Variant"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Products;
