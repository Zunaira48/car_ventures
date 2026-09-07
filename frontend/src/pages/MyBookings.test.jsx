import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import MyBookings from "./MyBookings";
import api from "../api/client";

vi.mock("../api/client", () => ({
  default: { get: vi.fn(), patch: vi.fn() },
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <MyBookings />
    </MemoryRouter>
  );
}

const PENDING_BOOKING = {
  id: 7,
  start_date: "2026-11-01",
  end_date: "2026-11-03",
  pickup_location: "Model Town",
  total_price: 24000,
  status: "PENDING",
};

const CANCELLED_BOOKING = { ...PENDING_BOOKING, id: 8, status: "CANCELLED" };

describe("MyBookings", () => {
  beforeEach(() => {
    api.get.mockReset();
    api.patch.mockReset();
  });

  it("shows a ticket skeleton while loading", () => {
    api.get.mockReturnValue(new Promise(() => {})); // never resolves
    const { container } = renderPage();
    expect(container.querySelector(".skeleton-ticket")).toBeInTheDocument();
  });

  it("shows an empty-state message with a link to browse vehicles when there are no bookings", async () => {
    api.get.mockResolvedValue({ data: [] });
    renderPage();
    expect(await screen.findByText(/you have no bookings yet/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /browse vehicles/i })).toBeInTheDocument();
  });

  it("renders a booking with its status and a Cancel button when PENDING", async () => {
    api.get.mockResolvedValue({ data: [PENDING_BOOKING] });
    renderPage();
    expect(await screen.findByText(/2026-11-01/)).toBeInTheDocument();
    expect(screen.getByText("PENDING")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByText(/model town/i)).toBeInTheDocument();
  });

  it("does not show a Cancel button for an already-cancelled booking", async () => {
    api.get.mockResolvedValue({ data: [CANCELLED_BOOKING] });
    renderPage();
    await screen.findByText("CANCELLED");
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("cancelling a booking calls the API and updates its status in place", async () => {
    api.get.mockResolvedValue({ data: [PENDING_BOOKING] });
    api.patch.mockResolvedValue({});
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("PENDING");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith("/bookings/7/cancel");
    });
    expect(await screen.findByText("CANCELLED")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("shows an error message if cancelling fails, and the ticket stays visible and PENDING", async () => {
    api.get.mockResolvedValue({ data: [PENDING_BOOKING] });
    api.patch.mockRejectedValue(new Error("network error"));
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("PENDING");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(await screen.findByText(/could not cancel that booking/i)).toBeInTheDocument();
    // Regression guard: a failed cancel must not hide the rest of the ticket list.
    expect(screen.getByText("PENDING")).toBeInTheDocument();
    expect(screen.getByText(/model town/i)).toBeInTheDocument();
  });
});