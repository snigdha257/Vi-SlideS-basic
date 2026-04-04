import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/authService";
import { GoogleLogin } from "@react-oauth/google";
import RoleSelector from "../components/RoleSelector";// Reuse RoleSelector component for both login and registration flows
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import "../styles/auth.css";

export default function Login() {
  const [showRoleSelector, setShowRoleSelector] = useState(false);// State to control role selector visibility for Google login
const [googleUser, setGoogleUser] = useState<any>(null);// Store Google user info temporarily for role selection flow
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
        // First, try to login with Google to see if user exists
        const response = await authService.googleLogin(credentialResponse.credential);
        // If response indicates new user, show role selector. Otherwise, log in directly.
        if (response.isNewUser) {
          // New user - show role selector
          const decoded = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
          
          const userData = {
            email: decoded.email,
            name: decoded.name || decoded.email?.split("@")[0] || "User",
            picture: decoded.picture,
          };

          setGoogleUser({
            ...userData,
            googleToken: credentialResponse.credential
          });
          setShowRoleSelector(true);
          toast.success("Please select your role to continue");
        } else if (response.token && response.user) {
          // Existing user with role - direct to dashboard
          const userData = {
            ...response.user,
            name: response.user.name || response.user.email?.split("@")[0] || "User",// Fallback to email prefix if name is not available
          };

          localStorage.setItem("studentInfo", JSON.stringify(userData));
          localStorage.setItem("token", response.token);// Store token for authenticated requests
          toast.success("Welcome back!");

          if (userData.role === "teacher") {
            navigate("/teacher");
          } else {
            navigate("/student");
          }
        }
      }
    } catch (err: any) {
      toast.error("Google Login Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelected = (role: "teacher" | "student") => {
    setLoading(true);

    authService.googleLogin(
      googleUser.googleToken,
      role
    ).then(response => {
      if (response.token && response.user) {
        const updatedUser = {
          ...response.user,
          role,
        };

        localStorage.setItem("studentInfo", JSON.stringify(updatedUser));
        localStorage.setItem("token", response.token);
        toast.success("Role selected successfully!");

        if (role === "teacher") {
          navigate("/teacher");
        } else {
          navigate("/student");
        }
      }
    }).catch(err => {
      toast.error("Failed to set role");
    }).finally(() => {
      setLoading(false);
    });// After role selection, we call googleLogin again with the selected role to update the user in the backend and get the token. Then we log in the user as usual.
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
        {/* Role Selector for Google Login */ }
        {showRoleSelector && googleUser && (
          <RoleSelector
            userName={googleUser.name}
            onRoleSelected={handleRoleSelected}
            isloading={loading}
          />
        )}
      </div>
    </div>
  );
}