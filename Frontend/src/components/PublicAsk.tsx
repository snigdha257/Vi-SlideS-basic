import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import toast from "react-hot-toast";
import "../styles/auth.css";

export default function PublicAsk() {
  const { sessionCode } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    question: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backendUrl, setBackendUrl] = useState<string>("");

  // Detect backend URL on component mount
  useEffect(() => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const url = `${protocol}//${hostname}:5000`;
    setBackendUrl(url);
    console.log("Backend URL detected:", url);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!formData.question.trim()) {
      toast.error("Question is required");
      return;
    }

    if (!backendUrl) {
      toast.error("System error: Backend URL not detected");
      return;
    }

    setIsSubmitting(true);

    try {
      const apiUrl = `${backendUrl}/ask/${sessionCode}`;
      console.log("Submitting to:", apiUrl);
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim() || undefined,
          question: formData.question.trim()
        })
      });

      if (response.ok) {
        toast.success("Question submitted successfully!");
        setFormData({
          name: "",
          email: "",
          question: ""
        });
        // Stay on the same page - user can submit another question
      } else {
        const error = await response.json();
        if (response.status === 404) {
          toast.error("Session not found");
        } else if (response.status === 410) {
          toast.error("Session has ended");
        } else {
          toast.error(error.message || "Failed to submit question");
        }
      }
    } catch (error) {
      console.error("Error submitting question:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      {/* NAV */}
      <nav className="auth-nav">
        <div className="auth-nav-brand">
          <div className="brand-icon">V</div>
          <span>Vi-SlideS</span>
        </div>
        <button className="auth-back-btn" onClick={() => navigate("/")}>
          <ArrowLeft size={18} />
        </button>
      </nav>

      {/* FORM CONTAINER */}
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-card-header">
            <h1 style={{textAlign: "center"}}>Ask a Question</h1>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Name Field */}
            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email">Email*</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Question Field */}
            <div className="form-group">
              <label htmlFor="question">Question *</label>
              <input
                className="input"
                id="question"
                name="question"
                value={formData.question}
                onChange={handleChange}
                placeholder="Type your question here..."
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isSubmitting}
            >
              <Send size={18} /> {isSubmitting ? "Submitting..." : "Submit Question"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
