import React from "react";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  labelLeft?: string;
  labelRight?: string;
}

const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  labelLeft,
  labelRight,
}) => {
  return (
    <div
      className={`flex items-center gap-2 ${disabled ? "opacity-50 pointer-events-none" : ""}`}
    >
      {labelLeft && (
        <span
          className={`text-xs font-medium ${!checked ? "text-gray-900" : "text-gray-400"}`}
        >
          {labelLeft}
        </span>
      )}

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          checked ? "bg-emerald-500" : "bg-gray-300"
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>

      {labelRight && (
        <span
          className={`text-xs font-medium ${checked ? "text-emerald-600" : "text-gray-400"}`}
        >
          {labelRight}
        </span>
      )}
    </div>
  );
};

export default Toggle;
