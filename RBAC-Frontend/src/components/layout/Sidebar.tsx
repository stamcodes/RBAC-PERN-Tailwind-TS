import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";

const links = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Users", path: "/users" },
  { label: "Roles", path: "/roles" },
  { label: "Branches", path: "/branches" },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProductsOpen, setIsProductsOpen] = useState(
    location.pathname.startsWith("/products"),
  );

  return (
    <aside className="w-56 min-h-screen bg-gray-800 text-white flex flex-col py-6 px-4 gap-1">
      {links.map((link) => (
        <NavLink
          key={link.path}
          to={link.path}
          className={({ isActive }) =>
            `px-4 py-2 rounded text-sm font-medium transition ${
              isActive
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:bg-gray-700"
            }`
          }
        >
          {link.label}
        </NavLink>
      ))}

      {/* Collapsible Products Menu Option */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between rounded hover:bg-gray-700 transition pr-2">
          <NavLink
            to="/products"
            end
            className={() =>
              `flex-1 px-4 py-2 text-sm font-medium transition text-left ${
                location.pathname === "/products"
                  ? "text-blue-400 font-semibold"
                  : "text-gray-300"
              }`
            }
          >
            Products
          </NavLink>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setIsProductsOpen(!isProductsOpen);
            }}
            className="p-1 text-gray-400 hover:text-white rounded transition focus:outline-none"
          >
            <svg
              className={`w-4 h-4 transform transition-transform duration-200 ${
                isProductsOpen ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {/* Collapsible Children Content Panel */}
        {isProductsOpen && (
          <div className="pl-6 flex flex-col gap-1 mt-0.5 mb-1 border-l border-gray-700 ml-4 animate-fadeIn">
            <NavLink
              to="/products/categories"
              className={({ isActive }) =>
                `py-1.5 px-3 rounded text-xs font-medium transition ${
                  isActive
                    ? "text-blue-400 bg-gray-700/50"
                    : "text-gray-400 hover:text-white hover:bg-gray-700/20"
                }`
              }
            >
              Categories
            </NavLink>
            <NavLink
              to="/products/variations"
              className={({ isActive }) =>
                `py-1.5 px-3 rounded text-xs font-medium transition ${
                  isActive
                    ? "text-blue-400 bg-gray-700/50"
                    : "text-gray-400 hover:text-white hover:bg-gray-700/20"
                }`
              }
            >
              Variations
            </NavLink>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
