import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/authService";
import { GoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import "../styles/auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.login(email, password);
      if (response.token && response.user) {
        localStorage.setItem("studentInfo", JSON.stringify(response.user));
        toast.success(`Welcome back, ${response.user.name || 'User'}!`);
        if (response.user.role === "teacher") {
          navigate("/teacher");
        } else {
          navigate("/student");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Login Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      if (credentialResponse.credential) {
        const response = await authService.googleLogin(credentialResponse.credential);
        if (response.token && response.user) {
          localStorage.setItem("studentInfo", JSON.stringify(response.user));
          toast.success("Google Login Successful!");
          if (response.user.role === "teacher") {
            navigate("/teacher");
          } else {
            navigate("/student");
          }
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Google Login Failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div style={{ margin: "1.5rem 0", textAlign: "center", position: "relative" }}>
          <span style={{ background: "#d6d8e0ff", padding: "0 10px", color: "#1d0951ee", position: "relative", zIndex: 1, borderRadius: "4px" }}>OR</span>
          <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "1px", background: "rgba(0, 0, 0, 0.1)", zIndex: 0 }}></div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error("Google Login Failed")}
            theme="filled_blue"
            shape="pill"
            width="250"
          />
        </div>
        <p className="auth-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}