import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { FcGoogle } from "react-icons/fc";

const LoginForm = ({ onSuccess }) => {
  // const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login, loginWithGoogle } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success("Login successful");
      onSuccess();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleGoogleLogin = async () => {
  try {
    await loginWithGoogle();
    toast.success("Google login successful");
    onSuccess();
  } catch (err) {
    toast.error(err.message);
  }
};

  return (
    <div className="flex flex-col space-y-4 py-3">
  
  {/* GOOGLE BUTTON */}
  <button
    type="button"
    onClick={handleGoogleLogin}
    className="flex items-center justify-center gap-2 px-3 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
  >
    <FcGoogle className="w-5 h-5" />
    <span className="text-gray-700 dark:text-white">Continue with Google</span>
  </button>

  {/* divider */}
  <div className="flex items-center gap-3">
    <div className="flex-1 h-px bg-gray-300" />
    <span className="text-sm text-gray-500 dark:text-white">or</span>
    <div className="flex-1 h-px bg-gray-300" />
  </div>
    <form onSubmit={handleSubmit} className="flex flex-col space-y-4 py-3">
      <input
        type="email"
        placeholder="Email"
        className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[var(--secondary-color)]"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[var(--secondary-color)]"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button className="px-3 py-2 bg-[var(--secondary-color)] text-white rounded hover:bg-[var(--secondary-color-hover)] transition">
        Login
      </button>
    </form>
    </div>
  );
};

export default LoginForm;
