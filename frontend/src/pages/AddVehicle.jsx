import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/useAuth";

const CATEGORIES = ["Economy", "Sedan", "Hatchback", "SUV", "Luxury", "Sports", "Van", "Pickup", "Electric", "Hybrid", "Family"];

export default function AddVehicle() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, userLoading } = useAuth();

  const [form, setForm] = useState({
    title: "", make: "", model: "", year: "", category: "Sedan", body_type: "",
    transmission: "Automatic", fuel_type: "Petrol", engine: "", mileage: "",
    seats: "", color: "", location: "", rental_price: "", sale_price: "", description: "",
  });

  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState("");
  const [estimateNote, setEstimateNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(null);

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleEstimate = async () => {
    setEstimateError("");
    setEstimateNote("");

    const required = ["make", "model", "year", "category", "body_type", "transmission", "fuel_type", "engine", "mileage", "seats", "location"];
    const missing = required.filter((f) => !form[f]);
    if (missing.length > 0) {
      setEstimateError(`Fill in these fields first: ${missing.join(", ")}`);
      return;
    }

    setEstimating(true);
    try {
      const res = await api.post("/ai/predict-price", {
        make: form.make, model: form.model, year: Number(form.year), category: form.category,
        body_type: form.body_type, transmission: form.transmission, fuel_type: form.fuel_type,
        engine: form.engine, mileage: Number(form.mileage), seats: Number(form.seats), location: form.location,
      });
      setForm((prev) => ({ ...prev, sale_price: String(res.data.estimated_price) }));
      setEstimateNote(res.data.disclaimer);
    } catch (err) {
      if (err.response?.status === 503) {
        setEstimateError(err.response.data?.detail || "Price estimation is temporarily unavailable.");
      } else {
        setEstimateError("Could not generate a price estimate. You can still enter a price manually.");
      }
    } finally {
      setEstimating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        year: Number(form.year),
        mileage: form.mileage ? Number(form.mileage) : null,
        seats: form.seats ? Number(form.seats) : null,
        rental_price: form.rental_price ? Number(form.rental_price) : null,
        sale_price: form.sale_price ? Number(form.sale_price) : null,
      };
      const res = await api.post("/vehicles", payload);
      setSubmitSuccess(res.data);
    } catch (err) {
      setSubmitError(err.response?.data?.detail ? JSON.stringify(err.response.data.detail) : "Could not create vehicle listing.");
    } finally {
      setSubmitting(false);
    }
  };

  if (userLoading) return <p>Loading...</p>;
  if (!isAuthenticated) return <p>Please log in to view this page.</p>;
  if (!isAdmin) return <p>You don't have access to this page.</p>;

  if (submitSuccess) {
    return (
      <div style={{ maxWidth: 500, margin: "40px auto" }}>
        <p>Vehicle "{submitSuccess.title}" created with status {submitSuccess.status}.</p>
        <button onClick={() => navigate("/admin")}>Go to Admin Dashboard</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 500, margin: "40px auto" }}>
      <h2>Add Vehicle</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <label>Title <input value={form.title} onChange={update("title")} required /></label>
        <label>Make <input value={form.make} onChange={update("make")} required /></label>
        <label>Model <input value={form.model} onChange={update("model")} required /></label>
        <label>Year <input type="number" value={form.year} onChange={update("year")} required /></label>
        <label>
          Category
          <select value={form.category} onChange={update("category")}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label>Body type <input value={form.body_type} onChange={update("body_type")} placeholder="e.g. Sedan, SUV" /></label>
        <label>
          Transmission
          <select value={form.transmission} onChange={update("transmission")}>
            <option value="Automatic">Automatic</option>
            <option value="Manual">Manual</option>
          </select>
        </label>
        <label>
          Fuel type
          <select value={form.fuel_type} onChange={update("fuel_type")}>
            <option value="Petrol">Petrol</option>
            <option value="Diesel">Diesel</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Electric">Electric</option>
          </select>
        </label>
        <label>Engine <input value={form.engine} onChange={update("engine")} placeholder="e.g. 1.6L" /></label>
        <label>Mileage (km) <input type="number" value={form.mileage} onChange={update("mileage")} /></label>
        <label>Seats <input type="number" value={form.seats} onChange={update("seats")} /></label>
        <label>Color <input value={form.color} onChange={update("color")} /></label>
        <label>Location (city) <input value={form.location} onChange={update("location")} required /></label>
        <label>Rental price / day (PKR) <input type="number" value={form.rental_price} onChange={update("rental_price")} /></label>

        <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 10 }}>
          <label>Sale price (PKR) <input type="number" value={form.sale_price} onChange={update("sale_price")} /></label>
          <div style={{ marginTop: 8 }}>
            <button type="button" onClick={handleEstimate} disabled={estimating}>
              {estimating ? "Estimating..." : "Estimate Sale Price (AI)"}
            </button>
          </div>
          {estimateError && <p style={{ color: "red", fontSize: 13 }}>{estimateError}</p>}
          {estimateNote && <p style={{ fontSize: 12, color: "#888" }}>{estimateNote}</p>}
        </div>

        <label>Description <textarea value={form.description} onChange={update("description")} rows={3} /></label>

        {submitError && <p style={{ color: "red" }}>{submitError}</p>}
        <button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create Vehicle"}</button>
      </form>
    </div>
  );
}