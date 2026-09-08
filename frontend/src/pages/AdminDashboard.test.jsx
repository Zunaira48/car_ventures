import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import AdminDashboard from "./AdminDashboard";
import api from "../api/client";
import { useAuth } from "../context/useAuth";

vi.mock("../api/client", () => ({
  default: { get: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

vi.mock("../context/useAuth");

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminDashboard />
    </MemoryRouter>
  );
}

function mockAdmin() {
  useAuth.mockReturnValue({ isAuthenticated: true, isAdmin: true, userLoading: false });
}

const SUMMARY = {
  total_users: 4, total_vehicles: 42, pending_vehicle_approvals: 1,
  active_bookings: 7, completed_bookings: 2, revenue_estimate: 1678300,
  note: "revenue_estimate is a sum of recorded booking prices, not actual collected payments",
};

const PENDING_VEHICLE = { id: 50, title: "2020 Honda Civic", location: "Karachi", transmission: "Manual", fuel_type: "Petrol", year: 2020 };
const APPROVED_VEHICLE = { id: 42, title: "2017 Toyota Corolla", location: "Karachi", status: "APPROVED" };
const PENDING_BOOKING = { id: 3, vehicle_id: 42, user_id: 1, start_date: "2026-09-01", end_date: "2026-09-05", total_price: 24000, status: "PENDING" };
const A_USER = { id: 1, full_name: "Test User", email: "user@example.com", role: "user", created_at: "2026-01-01T00:00:00Z" };
const ACTIVE_TOUR = { id: 1, tour_type: "GROUP_BUS", title: "Hunza Valley Adventure", destination: "Hunza", price: 25000, status: "ACTIVE" };

describe("AdminDashboard access control", () => {
  beforeEach(() => api.get.mockReset());

  it("shows a loading message while auth state is resolving", () => {
    useAuth.mockReturnValue({ isAuthenticated: false, isAdmin: false, userLoading: true });
    renderPage();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("prompts login when not authenticated", () => {
    useAuth.mockReturnValue({ isAuthenticated: false, isAdmin: false, userLoading: false });
    renderPage();
    expect(screen.getByText(/please log in to view this page/i)).toBeInTheDocument();
  });

  it("denies access to a non-admin authenticated user", () => {
    useAuth.mockReturnValue({ isAuthenticated: true, isAdmin: false, userLoading: false });
    renderPage();
    expect(screen.getByText(/don't have access to this page/i)).toBeInTheDocument();
  });

  it("shows the Summary tab by default for an admin, and switches tabs on click", async () => {
    mockAdmin();
    api.get.mockResolvedValue({ data: SUMMARY });
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText("Total Users")).toBeInTheDocument();

    api.get.mockResolvedValue({ data: [] });
    await user.click(screen.getByRole("button", { name: "All Users" }));
    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/admin/users"));
  });
});

describe("SummaryTab", () => {
  beforeEach(() => {
    mockAdmin();
    api.get.mockReset();
  });

  it("shows a stats skeleton while loading", () => {
    api.get.mockReturnValue(new Promise(() => {}));
    const { container } = renderPage();
    expect(container.querySelectorAll(".stat-card")).toHaveLength(6);
  });

  it("shows an error message on failure", async () => {
    api.get.mockRejectedValue(new Error("network error"));
    renderPage();
    expect(await screen.findByText(/could not load dashboard summary/i)).toBeInTheDocument();
  });

  it("renders the real stats on success", async () => {
    api.get.mockResolvedValue({ data: SUMMARY });
    renderPage();
    expect(await screen.findByText("42")).toBeInTheDocument();
    expect(screen.getByText("PKR 1678300")).toBeInTheDocument();
  });
});

describe("PendingVehiclesTab", () => {
  const user = userEvent.setup();

  beforeEach(async () => {
    mockAdmin();
    api.get.mockReset();
    api.put.mockReset();
  });

  async function openTab(data) {
    api.get.mockResolvedValueOnce({ data: SUMMARY });
    renderPage();
    await screen.findByText("Total Users");
    api.get.mockResolvedValueOnce({ data });
    await user.click(screen.getByRole("button", { name: "Pending Vehicles" }));
  }

  it("shows an empty state when nothing is pending", async () => {
    await openTab([]);
    expect(await screen.findByText(/no vehicles pending approval/i)).toBeInTheDocument();
  });

  it("renders a pending vehicle with Approve/Reject actions", async () => {
    await openTab([PENDING_VEHICLE]);
    expect(await screen.findByText("2020 Honda Civic")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reject" })).toBeInTheDocument();
  });

  it("approving a vehicle calls PUT with APPROVED and removes it from the list", async () => {
    await openTab([PENDING_VEHICLE]);
    await screen.findByText("2020 Honda Civic");
    api.put.mockResolvedValue({});

    await user.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith("/vehicles/50", { status: "APPROVED" });
    });
    await waitFor(() => {
      expect(screen.queryByText("2020 Honda Civic")).not.toBeInTheDocument();
    });
  });
});

describe("AllVehiclesTab", () => {
  const user = userEvent.setup();
  let confirmSpy;

  beforeEach(() => {
    mockAdmin();
    api.get.mockReset();
    api.put.mockReset();
    api.delete.mockReset();
    confirmSpy = vi.spyOn(window, "confirm");
  });

  afterEach(() => confirmSpy.mockRestore());

  async function openTab(data) {
    api.get.mockResolvedValueOnce({ data: SUMMARY });
    renderPage();
    await screen.findByText("Total Users");
    api.get.mockResolvedValueOnce({ data });
    await user.click(screen.getByRole("button", { name: "All Vehicles" }));
  }

  it("renders vehicles in a table with a status selector per row", async () => {
    await openTab([APPROVED_VEHICLE]);
    expect(await screen.findByText("2017 Toyota Corolla")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveValue("APPROVED");
  });

  it("changing the status select calls PUT with the new status", async () => {
    await openTab([APPROVED_VEHICLE]);
    await screen.findByText("2017 Toyota Corolla");
    api.put.mockResolvedValue({});

    await user.selectOptions(screen.getByRole("combobox"), "SUSPENDED");

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith("/vehicles/42", { status: "SUSPENDED" });
    });
  });

  it("deleting a vehicle after confirming removes it from the table", async () => {
    confirmSpy.mockReturnValue(true);
    await openTab([APPROVED_VEHICLE]);
    await screen.findByText("2017 Toyota Corolla");
    api.delete.mockResolvedValue({});

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith("/vehicles/42"));
    await waitFor(() => {
      expect(screen.queryByText("2017 Toyota Corolla")).not.toBeInTheDocument();
    });
  });

  it("does not call the API if the delete confirmation is declined", async () => {
    confirmSpy.mockReturnValue(false);
    await openTab([APPROVED_VEHICLE]);
    await screen.findByText("2017 Toyota Corolla");

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(api.delete).not.toHaveBeenCalled();
    expect(screen.getByText("2017 Toyota Corolla")).toBeInTheDocument();
  });

  it("shows the server's specific error detail when delete fails (e.g. existing bookings)", async () => {
    confirmSpy.mockReturnValue(true);
    await openTab([APPROVED_VEHICLE]);
    await screen.findByText("2017 Toyota Corolla");
    api.delete.mockRejectedValue({ response: { data: { detail: "Cannot delete: this vehicle has 2 booking(s) on record." } } });

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByText(/has 2 booking\(s\) on record/i)).toBeInTheDocument();
    expect(screen.getByText("2017 Toyota Corolla")).toBeInTheDocument();
  });
});

describe("BookingsTab", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    mockAdmin();
    api.get.mockReset();
    api.patch.mockReset();
  });

  async function openTab(data) {
    api.get.mockResolvedValueOnce({ data: SUMMARY });
    renderPage();
    await screen.findByText("Total Users");
    api.get.mockResolvedValueOnce({ data });
    await user.click(screen.getByRole("button", { name: "All Bookings" }));
  }

  it("renders a PENDING booking with Confirm and Cancel actions", async () => {
    await openTab([PENDING_BOOKING]);
    expect(await screen.findByText("PENDING")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("confirming a booking updates it to CONFIRMED and swaps in Mark Completed", async () => {
    await openTab([PENDING_BOOKING]);
    await screen.findByText("PENDING");
    api.patch.mockResolvedValue({});

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith("/bookings/3/status", { status: "CONFIRMED" });
    });
    expect(await screen.findByText("CONFIRMED")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mark Completed" })).toBeInTheDocument();
  });
});

describe("UsersTab", () => {
  beforeEach(() => {
    mockAdmin();
    api.get.mockReset();
  });

  it("renders the users table", async () => {
    api.get.mockResolvedValueOnce({ data: SUMMARY }).mockResolvedValueOnce({ data: [A_USER] });
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Total Users");

    await user.click(screen.getByRole("button", { name: "All Users" }));

    expect(await screen.findByText("user@example.com")).toBeInTheDocument();
  });
});

describe("ManageToursTab", () => {
  const user = userEvent.setup();
  let confirmSpy;

  beforeEach(() => {
    mockAdmin();
    api.get.mockReset();
    api.put.mockReset();
    api.delete.mockReset();
    confirmSpy = vi.spyOn(window, "confirm");
  });

  afterEach(() => confirmSpy.mockRestore());

  async function openTab(data) {
    api.get.mockResolvedValueOnce({ data: SUMMARY });
    renderPage();
    await screen.findByText("Total Users");
    api.get.mockResolvedValueOnce({ data });
    await user.click(screen.getByRole("button", { name: "Manage Tours" }));
  }

  it("renders an active tour with Deactivate and Delete actions", async () => {
    await openTab([ACTIVE_TOUR]);
    expect(await screen.findByText("Hunza Valley Adventure")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Deactivate" })).toBeInTheDocument();
  });

  it("deactivating a tour calls PUT and flips the button to Activate", async () => {
    await openTab([ACTIVE_TOUR]);
    await screen.findByText("Hunza Valley Adventure");
    api.put.mockResolvedValue({});

    await user.click(screen.getByRole("button", { name: "Deactivate" }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith("/tours/1", { status: "INACTIVE" });
    });
    expect(await screen.findByRole("button", { name: "Activate" })).toBeInTheDocument();
  });

  it("deleting a tour after confirming removes it from the table", async () => {
    confirmSpy.mockReturnValue(true);
    await openTab([ACTIVE_TOUR]);
    await screen.findByText("Hunza Valley Adventure");
    api.delete.mockResolvedValue({});

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(api.delete).toHaveBeenCalledWith("/tours/1"));
    await waitFor(() => {
      expect(screen.queryByText("Hunza Valley Adventure")).not.toBeInTheDocument();
    });
  });
});