import { useEffect, useState } from "react";
import { useAuth } from "../context/authContext";
import { getAllProducts, getProductVariants } from "../api/products";
import type { Product, ProductVariant } from "../types";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import Table from "../components/ui/Table";

interface ToastState {
  show: boolean;
  message: string;
  type: "success" | "error";
}

const CategoryFilteredProducts = () => {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<
    { id: number; name: string }[]
  >([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  // Row and category mapping action states
  const [searchInputs, setSearchInputs] = useState<Record<number, string>>({});
  const [pendingUpdates, setPendingUpdates] = useState<Record<number, boolean>>(
    {},
  );
  const [openCategoryDropdown, setOpenCategoryDropdown] = useState<
    number | null
  >(null);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: "",
    type: "success",
  });

  // Complete Variants Module States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);

  // New Global Category Modal State
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    if (token) {
      loadInitialData();
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

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const prodRes = await getAllProducts(token!);
      setProducts(prodRes.data ?? prodRes ?? []);

      await fetchCategories();
    } catch (err) {
      showToastNotification("Failed to fetch page data elements.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const catRes = await fetch("http://localhost:5000/api/categories", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!catRes.ok) throw new Error();
    const catData = await catRes.json();
    setAllCategories(catData.data ?? catData ?? []);
  };

  const handleCreateCategoryDB = async () => {
    if (!newCategoryName.trim()) {
      showToastNotification("Category name cannot be empty.", "error");
      return;
    }
    try {
      setCreatingCategory(true);
      const res = await fetch("http://localhost:5000/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });

      const data = await res.json();
      if (res.ok || data.success) {
        showToastNotification("Category successfully saved to database!");
        setNewCategoryName("");
        setShowCreateCategoryModal(false);
        await fetchCategories();
      } else {
        showToastNotification(
          data.message || "Failed to create category.",
          "error",
        );
      }
    } catch (err) {
      showToastNotification(
        "Network failure while creating category.",
        "error",
      );
    } finally {
      setCreatingCategory(false);
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
      if (res.ok || data.success) {
        setPendingUpdates((prev) => ({ ...prev, [productId]: true }));
        const prodRes = await getAllProducts(token!);
        setProducts(prodRes.data ?? prodRes ?? []);
      } else {
        showToastNotification(
          data.message || "Failed to add category.",
          "error",
        );
      }
    } catch (err) {
      showToastNotification("Network failure.", "error");
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
      if (res.ok || data.success) {
        setPendingUpdates((prev) => ({ ...prev, [productId]: true }));
        const prodRes = await getAllProducts(token!);
        setProducts(prodRes.data ?? prodRes ?? []);
      } else {
        showToastNotification(
          data.message || "Failed to remove category.",
          "error",
        );
      }
    } catch (err) {
      showToastNotification("Network failure.", "error");
    }
  };

  const handleSaveUpdate = async (productId: number) => {
    try {
      const res = await fetch(`http://localhost:5000/api/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const verifiedDataList: Product[] = data.data ?? data ?? [];
      const isStillInDb = verifiedDataList.some(
        (p) => Number(p.id) === Number(productId),
      );

      if (isStillInDb) {
        showToastNotification("Database successfully updated!", "success");
        setPendingUpdates((prev) => ({ ...prev, [productId]: false }));
      } else {
        showToastNotification("Error changing product categories.", "error");
      }
    } catch (e) {
      showToastNotification("Failed to finalize update check.", "error");
    }
  };

  const handleOpenVariants = async (product: Product) => {
    setSelectedProduct(product);
    setVariantsLoading(true);
    try {
      const res = await getProductVariants(token!, product.id);
      setVariants(res.data ?? []);
    } catch (err) {
      showToastNotification("Failed to load variants.", "error");
    } finally {
      setVariantsLoading(false);
    }
  };

  // Filter products matching category parameter
  const filteredProducts = products.filter((product) => {
    if (selectedCategoryId === "ALL") return true;
    const assigned: any[] = product.categories ?? [];
    return assigned.some(
      (cat) =>
        Number(cat?.id ?? cat?.category_id) === Number(selectedCategoryId),
    );
  });

  // Table Configuration Ordered Layout: ID | Name | Category | Price | Variants
  const columns = [
    { header: "ID", accessor: "id" as keyof Product },
    { header: "Name", accessor: "name" as keyof Product },
    {
      header: "Category",
      accessor: (row: Product) => {
        const assigned: any[] = row.categories ?? [];
        const currentSearchTerm = searchInputs[row.id] ?? "";

        const availableToAdd = allCategories.filter((c) => {
          const isNotAssigned = !assigned.some(
            (a) => Number(a?.id ?? a?.category_id) === Number(c.id),
          );
          return (
            isNotAssigned &&
            c.name.toLowerCase().includes(currentSearchTerm.toLowerCase())
          );
        });

        return (
          <div className="flex flex-wrap items-center gap-2 relative">
            {assigned.map((cat) => {
              const catId = cat?.id ?? cat?.category_id;
              const catName =
                cat?.name ||
                allCategories.find((c) => Number(c.id) === Number(catId))
                  ?.name ||
                `Cat #${catId}`;
              return (
                <span
                  key={catId}
                  className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full"
                >
                  {catName}
                  <button
                    onClick={() => handleRemoveCategory(row.id, catId)}
                    className="text-blue-400 hover:text-red-500 transition ml-0.5 font-bold"
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
      header: "Price",
      accessor: (row: Product) => `$${parseFloat(row.price).toFixed(2)}`,
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

      {toast.show && (
        <div
          className={`fixed bottom-5 right-5 z-[999] flex items-center gap-3 bg-gray-900 text-white text-sm px-5 py-3 rounded-lg shadow-2xl border-l-4 ${toast.type === "error" ? "border-red-500" : "border-emerald-500"} transition-all duration-300 transform translate-y-0 animate-bounce`}
        >
          <p className="font-medium">{toast.message}</p>
        </div>
      )}

      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 bg-gray-50">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Categories</h2>
              <p className="text-sm text-gray-500">
                Filter and assign product collections
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 bg-white px-3 py-2 border border-gray-200 rounded-lg shadow-sm">
                <label
                  htmlFor="categoryFilter"
                  className="text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Filter:
                </label>
                <select
                  id="categoryFilter"
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none cursor-pointer pr-4"
                >
                  <option value="ALL">All Categories</option>
                  {allCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Add Category Trigger Action Button */}
              <button
                onClick={() => setShowCreateCategoryModal(true)}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 transition mr-1"
              >
                + Add New Category Option
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-gray-400">Loading catalog contents...</p>
          ) : (
            <div onClick={(e) => e.stopPropagation()}>
              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <p className="text-gray-400 text-sm italic">
                    No products matched to this criteria context.
                  </p>
                </div>
              ) : (
                <Table columns={columns} data={filteredProducts} />
              )}
            </div>
          )}

          {/* Variants Overlay View (Read-Only Copy Module) */}
          {selectedProduct && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-3xl">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-bold text-gray-800">
                    Variants — {selectedProduct.name}
                  </h3>
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
                    }}
                    className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Inline Create Category Modal Backdrop */}
          {showCreateCategoryModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <h3 className="text-base font-bold text-gray-800 mb-4">
                  Create Brand New Category
                </h3>
                <div className="flex flex-col gap-1 mb-6">
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Summer Wear, Electronics"
                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowCreateCategoryModal(false);
                      setNewCategoryName("");
                    }}
                    className="px-3 py-1.5 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateCategoryDB}
                    disabled={creatingCategory}
                    className="px-3 py-1.5 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition disabled:opacity-50"
                  >
                    {creatingCategory ? "Creating..." : "Save Category"}
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

export default CategoryFilteredProducts;
