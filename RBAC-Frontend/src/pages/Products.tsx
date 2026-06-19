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

const Products = () => {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create product form
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newIsActive, setNewIsActive] = useState(true);
  const [creating, setCreating] = useState(false);

  // Variants panel
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);

  // Create variant form
  const [showCreateVariant, setShowCreateVariant] = useState(false);
  const [newSku, setNewSku] = useState("");
  const [newVariantPrice, setNewVariantPrice] = useState("");
  const [newStockQuantity, setNewStockQuantity] = useState("");
  const [creatingVariant, setCreatingVariant] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [token]);

  const fetchProducts = async () => {
    try {
      const res = await getAllProducts(token!);
      setProducts(res.data ?? []);
    } catch (err) {
      setError("Failed to load products.");
    } finally {
      loading && setLoading(false);
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

      // Ensure we extract data properly regardless of whether it's wrapped in a .data attribute block
      const addedProduct = res?.data ?? res;
      setProducts((prev) => [...prev, addedProduct]);

      setNewName("");
      setNewDescription("");
      setNewPrice("");
      setNewIsActive(true);
      setShowCreateProduct(false);
    } catch (err: any) {
      // Pull actual backend validation messages if fields are rejected
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
      accessor: (row: Product) =>
        row.categories?.length > 0 ? row.categories.join(", ") : "—",
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
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 bg-gray-50">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-2xl font-bold text-gray-800">Products</h2>
            <button
              onClick={() => setShowCreateProduct(true)}
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
            <Table columns={productColumns} data={products} />
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
                    className={`px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition ${
                      creating ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {creating ? "Creating..." : "Create Product"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Variants Panel Modal */}
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

                {/* Create Variant Form — inline inside variants panel */}
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
                          className={`px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition ${
                            creatingVariant
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
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
