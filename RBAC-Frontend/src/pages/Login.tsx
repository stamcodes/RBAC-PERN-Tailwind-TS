import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { loginUser } from "../api/auth";

type Screen =
  | "login"
  | "forgot_email"
  | "verify_code"
  | "new_password"
  | "done";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password flow
  const [screen, setScreen] = useState<Screen>("login");
  const [forgotEmail, setForgotEmail] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [flowError, setFlowError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    try {
      setLoading(true);
      const data = await loginUser(email, password);
      if (data && (data.success || data.token)) {
        login(data.token, data.user);
        navigate("/dashboard");
      } else {
        setError(data?.message || "Login failed.");
      }
    } catch (err: any) {
      const serverMessage = err.response?.data?.message || err.message;
      setError(
        `Server connection error: ${serverMessage || "Invalid credentials"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setForgotEmail(email); // auto-import email from login screen
    setFlowError("");
    setScreen("forgot_email");
  };

  const handleSendCode = () => {
    if (!forgotEmail) {
      setFlowError("Please enter your email.");
      return;
    }
    setFlowError("");
    setScreen("verify_code");
  };

  const handleVerifyCode = () => {
    if (!verifyCode) {
      setFlowError("Please enter the verification code.");
      return;
    }
    if (!/^\d{6}$/.test(verifyCode)) {
      setFlowError("Enter a valid 6-digit numeric code.");
      return;
    }
    setFlowError("");
    setScreen("new_password");
  };

  const handleSetNewPassword = async () => {
    if (!newPassword || !confirmNewPassword) {
      setFlowError("Both fields are required.");
      return;
    }
    if (newPassword.length < 8) {
      setFlowError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setFlowError("Passwords do not match.");
      return;
    }

    try {
      setFlowError("");
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, newPassword }),
      });
      const data = await res.json();
      if (!data.success) {
        setFlowError(data.message || "Failed to reset password.");
        return;
      }
      setScreen("done");
    } catch (err) {
      setFlowError("Server error. Please try again.");
    }
  };

  const handleBackToLogin = () => {
    setScreen("login");
    setEmail(forgotEmail); // carry email back to login
    setPassword("");
    setVerifyCode("");
    setNewPassword("");
    setConfirmNewPassword("");
    setFlowError("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-sm">
        {/* ── LOGIN SCREEN ── */}
        {screen === "login" && (
          <>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">
              RBAC System Login
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Sign in to your account
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded px-4 py-3 mb-4">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@rbac.com"
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded transition ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>

              <button
                onClick={handleForgotPassword}
                className="text-sm text-blue-600 hover:text-blue-800 text-center transition"
              >
                Forgot password?
              </button>
            </div>
          </>
        )}

        {/* ── FORGOT PASSWORD — CONFIRM EMAIL ── */}
        {screen === "forgot_email" && (
          <>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">
              Reset Password
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Confirm your email to receive a verification code
            </p>

            {flowError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded px-4 py-3 mb-4">
                {flowError}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleSendCode}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded transition"
              >
                Send Verification Code
              </button>

              <button
                onClick={handleBackToLogin}
                className="text-sm text-gray-500 hover:text-gray-800 text-center transition"
              >
                ← Back to Login
              </button>
            </div>
          </>
        )}

        {/* ── VERIFY CODE ── */}
        {screen === "verify_code" && (
          <>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">
              Enter Code
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Enter the 6-digit verification code sent to{" "}
              <span className="font-medium text-gray-700">{forgotEmail}</span>
            </p>

            {flowError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded px-4 py-3 mb-4">
                {flowError}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="e.g. 123456"
                  maxLength={6}
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest text-center"
                />
              </div>

              <button
                onClick={handleVerifyCode}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded transition"
              >
                Verify Code
              </button>

              <button
                onClick={() => {
                  setScreen("forgot_email");
                  setFlowError("");
                }}
                className="text-sm text-gray-500 hover:text-gray-800 text-center transition"
              >
                ← Back
              </button>
            </div>
          </>
        )}

        {/* ── NEW PASSWORD ── */}
        {screen === "new_password" && (
          <>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">
              New Password
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Set a new password for your account
            </p>

            {flowError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded px-4 py-3 mb-4">
                {flowError}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleSetNewPassword}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded transition"
              >
                Done
              </button>

              <button
                onClick={() => {
                  setScreen("verify_code");
                  setFlowError("");
                }}
                className="text-sm text-gray-500 hover:text-gray-800 text-center transition"
              >
                ← Back
              </button>
            </div>
          </>
        )}

        {/* ── DONE ── */}
        {screen === "done" && (
          <>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">
                Password Updated
              </h1>
              <p className="text-sm text-gray-500">
                Your password has been reset successfully. Sign in with your new
                password.
              </p>
              <button
                onClick={handleBackToLogin}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded transition mt-2"
              >
                Back to Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
