import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Vehicles from "./Vehicles";
import api from "../api/client";
import { useAuth } from "../context/useAuth";

vi.mock("../api/client", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

vi.mock("../context/useAuth");

function renderPage() {
  return render(
    <MemoryRouter>
      <Vehicles />
    </MemoryRouter>
  );
}

const VEHICLE = {
  id: 7,
  title: "2019 Toyota Corolla Altis",
  category: "Sedan",
  transmission: "Automatic",
  fuel_type: "Petrol",
  location: "Lahore",
  rental_price: 4500,
  images: [],
};

describe("Vehicles filter bar", () => {
  beforeEach(() => {
    api.get.mockReset();
    api.post.mockReset();
    useAuth.mockReturnValue({ isAuthenticated: false });
  });

  it("loads all vehicles on mount with no filters applied", async () => {
    api.get.mockResolvedValue({ data: [VEHICLE] });
    renderPage();
    await screen.findByText("2019 Toyota Corolla Altis");
    expect(api.get).toHaveBeenCalledWith("/vehicles?page_size=100");
  });

  it("renders all filter controls", async () => {
    api.get.mockResolvedValue({ data: [] });
    renderPage();
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/transmission/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fuel/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/min pkr/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/max pkr/i)).toBeInTheDocument();
  });

  it("submits the entered filters as query params when Search is clicked", async () => {
    api.get.mockResolvedValue({ data: [] });
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));

    await user.type(screen.getByLabelText(/location/i), "Lahore");
    await user.selectOptions(screen.getByLabelText(/category/i), "Sedan");
    await user.type(screen.getByLabelText(/min pkr/i), "2000");
    await user.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
    const secondCallUrl = api.get.mock.calls[1][0];
    expect(secondCallUrl).toContain("location=Lahore");
    expect(secondCallUrl).toContain("category=Sedan");
    expect(secondCallUrl).toContain("min_price=2000");
  });

  it("Clear button only appears once a filter is set, and resets + reloads with no filters", async () => {
    api.get.mockResolvedValue({ data: [] });
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));

    expect(screen.queryByRole("button", { name: /clear/i })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/location/i), "Karachi");
    expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
    expect(api.get.mock.calls[1][0]).toBe("/vehicles?page_size=100");
    expect(screen.getByLabelText(/location/i)).toHaveValue("");
  });

  it("shows a filtered-specific empty state when filters are active and nothing matches", async () => {
    api.get.mockResolvedValue({ data: [] });
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("No vehicles available yet.")).toBeInTheDocument();

    await user.type(screen.getByLabelText(/location/i), "Nowhere");
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByText("No vehicles match those filters.")).toBeInTheDocument();
  });

  it("AI Search parses the query, fills the manual filters, and reloads vehicles", async () => {
    api.get.mockResolvedValue({ data: [] });
    api.post.mockResolvedValue({
      data: { location: "Lahore", category: "Sedan", transmission: null, fuel_type: null, min_price: null, max_price: 5000 },
    });
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));

    await user.type(screen.getByPlaceholderText(/automatic sedan/i), "sedan in Lahore under 5000");
    await user.click(screen.getByRole("button", { name: /ai search/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/ai/parse-search", { query: "sedan in Lahore under 5000" });
    });
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
    const secondCallUrl = api.get.mock.calls[1][0];
    expect(secondCallUrl).toContain("location=Lahore");
    expect(secondCallUrl).toContain("category=Sedan");
    expect(secondCallUrl).toContain("max_price=5000");
    expect(screen.getByLabelText(/location/i)).toHaveValue("Lahore");
  });

  it("AI Search shows a fallback error and does not touch the manual filters when the AI service fails", async () => {
    api.get.mockResolvedValue({ data: [] });
    api.post.mockRejectedValue(new Error("service unavailable"));
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));

    await user.type(screen.getByPlaceholderText(/automatic sedan/i), "cheap hatchback");
    await user.click(screen.getByRole("button", { name: /ai search/i }));

    expect(await screen.findByText(/could not understand that search/i)).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText(/location/i)).toHaveValue("");
  });
});