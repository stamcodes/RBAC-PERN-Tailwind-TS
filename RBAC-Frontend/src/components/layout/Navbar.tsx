import { useAuth } from "../../context/authContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="w-full bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
      <h1 className="text-xl font-bold tracking-wide">RBAC Admin</h1>
      <div className="flex items-center gap-4">
        {user && <span className="text-sm text-gray-300">{user.email}</span>}
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
