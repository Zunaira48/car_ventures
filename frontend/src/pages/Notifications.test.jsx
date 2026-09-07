import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Notifications from "./Notifications";
import api from "../api/client";
import { useAuth } from "../context/useAuth";

vi.mock("../api/client", () => ({
  default: { get: vi.fn(), patch: vi.fn() },
}));

vi.mock("../context/useAuth");

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <Notifications />
    </MemoryRouter>
  );
}

const UNREAD_WITH_LINK = {
  id: 1,
  message: "Your booking has been confirmed.",
  is_read: false,
  link: "/bookings",
  created_at: "2026-09-01T10:00:00Z",
};

const READ_NOTIFICATION = {
  id: 2,
  message: "Welcome to car_ventures!",
  is_read: true,
  link: null,
  created_at: "2026-08-01T10:00:00Z",
};

describe("Notifications", () => {
  const refreshUnreadCount = vi.fn();

  beforeEach(() => {
    api.get.mockReset();
    api.patch.mockReset();
    refreshUnreadCount.mockClear();
    mockNavigate.mockClear();
    useAuth.mockReturnValue({ refreshUnreadCount });
  });

  it("shows a skeleton list while loading", () => {
    api.get.mockReturnValue(new Promise(() => {}));
    const { container } = renderPage();
    expect(container.querySelectorAll(".notif-item")).toHaveLength(4);
  });

  it("shows an empty-state message when there are no notifications", async () => {
    api.get.mockResolvedValue({ data: [] });
    renderPage();
    expect(await screen.findByText(/no notifications yet/i)).toBeInTheDocument();
  });

  it("does not show a Mark all as read button when nothing is unread", async () => {
    api.get.mockResolvedValue({ data: [READ_NOTIFICATION] });
    renderPage();
    await screen.findByText("Welcome to car_ventures!");
    expect(screen.queryByRole("button", { name: /mark all as read/i })).not.toBeInTheDocument();
  });

  it("shows a Mark all as read button when something is unread", async () => {
    api.get.mockResolvedValue({ data: [UNREAD_WITH_LINK] });
    renderPage();
    expect(await screen.findByRole("button", { name: /mark all as read/i })).toBeInTheDocument();
  });

  it("clicking an unread notification marks it read, refreshes the unread count, and navigates to its link", async () => {
    api.get.mockResolvedValue({ data: [UNREAD_WITH_LINK] });
    api.patch.mockResolvedValue({});
    const user = userEvent.setup();
    renderPage();

    const item = await screen.findByText("Your booking has been confirmed.");
    await user.click(item);

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith("/notifications/1/read");
    });
    expect(refreshUnreadCount).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/bookings");
  });

  it("clicking an already-read notification with no link does not call the API or navigate", async () => {
    api.get.mockResolvedValue({ data: [READ_NOTIFICATION] });
    const user = userEvent.setup();
    renderPage();

    const item = await screen.findByText("Welcome to car_ventures!");
    await user.click(item);

    expect(api.patch).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("Mark all as read clears every unread notification and refreshes the count", async () => {
    api.get.mockResolvedValue({ data: [UNREAD_WITH_LINK] });
    api.patch.mockResolvedValue({});
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: /mark all as read/i }));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith("/notifications/read-all");
    });
    expect(refreshUnreadCount).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /mark all as read/i })).not.toBeInTheDocument();
    });
  });
});