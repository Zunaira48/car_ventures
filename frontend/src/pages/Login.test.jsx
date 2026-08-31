import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Login from "./Login";
import { useAuth } from "../context/useAuth";

vi.mock("../context/useAuth");

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

describe("Login", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("renders email and password fields and a submit button", () => {
    useAuth.mockReturnValue({ login: vi.fn() });
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("calls login with the entered credentials and navigates to /vehicles on success", async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    useAuth.mockReturnValue({ login });
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), "jane@example.com");
    await user.type(screen.getByLabelText(/password/i), "hunter2");
    await user.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith("jane@example.com", "hunter2");
    });
    expect(mockNavigate).toHaveBeenCalledWith("/vehicles");
  });

  it("shows the server's error message and does not navigate when login fails", async () => {
    const login = vi.fn().mockRejectedValue({
      response: { data: { detail: "Incorrect email or password" } },
    });
    useAuth.mockReturnValue({ login });
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), "jane@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrongpass");
    await user.click(screen.getByRole("button", { name: /login/i }));

    expect(await screen.findByText("Incorrect email or password")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("falls back to a generic error message when the server gives no detail", async () => {
    const login = vi.fn().mockRejectedValue(new Error("network down"));
    useAuth.mockReturnValue({ login });
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), "jane@example.com");
    await user.type(screen.getByLabelText(/password/i), "hunter2");
    await user.click(screen.getByRole("button", { name: /login/i }));

    expect(await screen.findByText("Login failed")).toBeInTheDocument();
  });
});