import { useState } from "react";
import { useEffect } from "react";
import toast from "react-hot-toast";
import "../styles/roleSelector.css";

interface RoleSelectorProps {
  onRoleSelected: (role: "teacher" | "student") => void;
  userName: string;
  isloading: boolean;
}

export default function RoleSelector({ onRoleSelected, userName, isloading }: RoleSelectorProps) {
  const [selectedRole, setSelectedRole] = useState<"teacher" | "student" | null>(null);
  const handleConfirm = () => {
    if (!selectedRole) {
      toast.error("Please select a role");
      return;
    }
    onRoleSelected(selectedRole);
  };
  useEffect(() => {
    const preventScroll = (e: Event) => e.preventDefault();

    document.body.classList.add("no-scroll");
    document.documentElement.classList.add("no-scroll");
    document.addEventListener('wheel', preventScroll, { passive: false });
    document.addEventListener('touchmove', preventScroll, { passive: false });

    return () => {
      document.body.classList.remove("no-scroll");
      document.documentElement.classList.remove("no-scroll");
      document.removeEventListener('wheel', preventScroll);
      document.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  return (
    <div className="role-selector-page">
      <div className="floating-glow-blue"></div>
      <div className="floating-glow-purple"></div>
      <div className="role-selector-overlay">
        <div className="role-selector-modal">
          <div className="role-selector-header">        
            <h2 style={{color: "#e2e8f0"}}>Welcome, {userName}!</h2>
            <p style={{color: "#94a3b8"}}>Select your role to continue</p>
          </div>

          <div className="role-selector-body">
            <div
              className={`role-card ${selectedRole === "teacher" ? "selected" : ""}`}
              onClick={() => setSelectedRole("teacher")}
            >
              <div className="role-icon">👨‍🏫</div>
              <div className="role-title">Teacher</div>
              <div className="role-description">Create sessions and manage students</div>
            </div>

            <div
              className={`role-card ${selectedRole === "student" ? "selected" : ""}`}
              onClick={() => setSelectedRole("student")}
            >
              <div className="role-icon">👨‍🎓</div>
              <div className="role-title">Student</div>
              <div className="role-description">Join sessions and ask questions</div>
            </div>
          </div>

          <div className="role-selector-footer">
            <button className="btn-confirm" onClick={handleConfirm}>
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}