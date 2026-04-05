import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/authService";
import { GoogleLogin } from "@react-oauth/google";
import RoleSelector from "./RoleSelector";// Reuse RoleSelector component for both login and registration flows
import toast from "react-hot-toast";
import "../styles/auth.css";

export default function Register() {
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("student");

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await authService.register(email, password, name, role);
      toast.success("Registration successful! You can now log in.");

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      toast.error(err.message || "Registration Failed");
    } finally {
      setLoading(false);
    }
  };

const handleGoogleSuccess = async (credentialResponse: any) => {
  try {
    if (credentialResponse.credential) {
      // First, try to login with Google to see if user exists
      const response = await authService.googleLogin(credentialResponse.credential);

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
          name: response.user.name || response.user.email?.split("@")[0] || "User",
        };

        localStorage.setItem("studentInfo", JSON.stringify(userData));
        localStorage.setItem("token", response.token);
        toast.success("Welcome back!");

        if (userData.role === "teacher") {
          navigate("/teacher");
        } else {
          navigate("/student");
        }
      }
    }
  } catch (err: any) {
    toast.error("Google Registration Failed");
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
      toast.success("Registration successful!");

      if (role === "teacher") {
        navigate("/teacher");
      } else {
        navigate("/student");
      }
    }
}).catch(() => {
    toast.error("Failed to complete registration");
  }).finally(() => {
    setLoading(false);
  });
};

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Register</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Enter your name"
            />
          </div>
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
            <label>Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
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

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm your password"
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <div style={{ margin: "1.5rem 0", textAlign: "center", position: "relative" }}>
          <span style={{ background: "#d6d8e0ff", padding: "0 10px", color: "#1d0951ee", position: "relative", zIndex: 1, borderRadius: "4px" }}>OR</span>
          <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "1px", background: "rgba(0, 0, 0, 0.1)", zIndex: 0 }}></div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error("Google Registration Failed")}
            theme="filled_blue"
            shape="pill"
            width="250"
          />
        </div>

        {showRoleSelector && googleUser && (
          <RoleSelector
            userName={googleUser.name}
            onRoleSelected={handleRoleSelected}
            isloading={loading}
          />
        )}

        <p className="auth-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
        
      </div>
    </div>
  );
}