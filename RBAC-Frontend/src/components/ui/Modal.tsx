import React, { useState, useEffect } from "react";
import { createProductVariant, getAllVariantValues } from "../../api/products";
import type { Product } from "../../types";

interface VariantValueOption {
  id: number;
  name: string;
}

interface VariantTypeGroup {
  typeId: number;
  typeName: string;
  values: VariantValueOption[];
}

interface AddVariantModalProps {
  isOpen: boolean;
  product: Product | null;
  token: string | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const AddVariantModal: React.FC<AddVariantModalProps> = ({
  isOpen,
  product,
  token,
  onClose,
  onSuccess,
  onError,
}) => {
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Dropdown state: { [typeId]: selectedValueId }
  const [selectedValues, setSelectedValues] = useState<Record<number, number>>(
    {},
  );
  const [variantTypes, setVariantTypes] = useState<VariantTypeGroup[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);

  useEffect(() => {
    if (isOpen && token) {
      fetchVariantTypes();
    }
  }, [isOpen, token]);

  const fetchVariantTypes = async () => {
    try {
      setLoadingTypes(true);
      const res = await getAllVariantValues(token!);
      setVariantTypes(res.data ?? []);
    } catch {
      onError("Failed to load variant options from server.");
    } finally {
      setLoadingTypes(false);
    }
  };

  const resetFormState = () => {
    setSku("");
    setPrice("");
    setQty("");
    setSelectedValues({});
  };

  const handleCancelClose = () => {
    resetFormState();
    onClose();
  };

  const handleDropdownChange = (typeId: number, valueId: number) => {
    setSelectedValues((prev) => ({ ...prev, [typeId]: valueId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku || !price || !qty || !token || !product) return;

    try {
      setSubmitting(true);

      // Collect only the value IDs that were actually selected (non-zero)
      const variantValueIds = Object.values(selectedValues).filter(
        (id) => id > 0,
      );

      await createProductVariant(
        token,
        product.id,
        sku,
        parseFloat(price),
        parseInt(qty, 10),
        variantValueIds.length > 0 ? variantValueIds : undefined,
      );

      onSuccess("Variant successfully created!");
      resetFormState();
      onClose();
    } catch (err: any) {
      onError(err.response?.data?.message || "Failed to create variant.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg p-8 w-full max-w-md shadow-xl"
      >
        <h3 className="text-lg font-bold text-gray-800 mb-1">Add Variant</h3>
        <p className="text-xs text-gray-400 mb-5 font-mono">
          Product: {product.name} (ID: {product.id})
        </p>

        <div className="flex flex-col gap-4">
          {/* SKU */}
          <input
            type="text"
            required
            value={sku}
            placeholder="SKU Code (e.g. SHOE-RED-42)"
            onChange={(e) => setSku(e.target.value)}
            className="border p-2 rounded text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Price + Qty */}
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              step="0.01"
              required
              value={price}
              placeholder="Price ($)"
              onChange={(e) => setPrice(e.target.value)}
              className="border p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              required
              value={qty}
              placeholder="Stock Qty"
              onChange={(e) => setQty(e.target.value)}
              className="border p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Dynamic dropdowns per variant type */}
          {loadingTypes ? (
            <p className="text-xs text-gray-400 italic">
              Loading variant options...
            </p>
          ) : (
            variantTypes.map((group) => (
              <div key={group.typeId} className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  {group.typeName}
                  <span className="ml-1 font-normal text-gray-400 normal-case">
                    (optional)
                  </span>
                </label>
                <select
                  value={selectedValues[group.typeId] ?? 0}
                  onChange={(e) =>
                    handleDropdownChange(
                      group.typeId,
                      parseInt(e.target.value, 10),
                    )
                  }
                  className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value={0}>— None —</option>
                  {group.values.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2 justify-end border-t pt-4 mt-5">
          <button
            type="button"
            onClick={handleCancelClose}
            className="border px-4 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-medium disabled:bg-blue-400 transition-colors"
          >
            {submitting ? "Saving..." : "Save Variant"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddVariantModal;
