import { NavLink } from "react-router-dom";

const links = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Users", path: "/users" },
  { label: "Roles", path: "/roles" },
  { label: "Branches", path: "/branches" },
  { label: "Products", path: "/products" },
];

const Sidebar = () => {
  return (
    <aside className="w-56 min-h-screen bg-gray-800 text-white flex flex-col py-6 px-4 gap-2">
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
    </aside>
  );
};

export default Sidebar;
