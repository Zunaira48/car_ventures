import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function Register() {
  const [form, setForm] = useState({ full_name: "", email: "", password: "", city: "", phone_number: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(form);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
    }
  };

  return (
    <div className="page-narrow">
      <div className="card">
        <div className="card-body">
          <h2>Register</h2>
          <p className="muted" style={{ marginTop: -8, marginBottom: 20 }}>
            Create an account to book vehicles and tours.
          </p>
          <form onSubmit={handleSubmit} className="form">
            <label>
              Full name
              <input name="full_name" placeholder="Your name" onChange={handleChange} required />
            </label>
            <label>
              Email
              <input name="email" type="email" placeholder="you@example.com" onChange={handleChange} required />
            </label>
            <label>
              Password
              <input name="password" type="password" placeholder="••••••••" onChange={handleChange} required />
            </label>
            <label>
              City
              <input name="city" placeholder="e.g. Lahore" onChange={handleChange} />
            </label>
            <label>
              Phone number
              <input name="phone_number" placeholder="+92 3XX XXXXXXX" onChange={handleChange} />
            </label>
            {error && <p className="alert-error">{error}</p>}
            {success && <p className="alert-success">Registered! Redirecting to login...</p>}
            <button type="submit" className="btn-primary">Register</button>
          </form>
          <p className="muted" style={{ marginTop: 16, marginBottom: 0 }}>
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}