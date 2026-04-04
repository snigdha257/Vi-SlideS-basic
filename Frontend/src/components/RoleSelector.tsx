import { useState } from "react";
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

  return (
    <div className="role-selector-overlay">
      <div className="role-selector-modal">
        <div className="role-selector-header">
          <h2>Welcome, {userName}!</h2>
          <p>Select your role to continue</p>
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
  );
}