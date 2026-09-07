import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Register from "./Register";
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

function renderRegister() {
  return render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );
}

describe("Register", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("renders all form fields and a submit button", () => {
    useAuth.mockReturnValue({ register: vi.fn() });
    renderRegister();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Register" })).toBeInTheDocument();
  });

  it("calls register with the entered form data, shows a success message, then navigates to /login", async () => {
    const register = vi.fn().mockResolvedValue(undefined);
    useAuth.mockReturnValue({ register });
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/full name/i), "Jane Doe");
    await user.type(screen.getByLabelText(/^email$/i), "jane@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "hunter22");
    await user.type(screen.getByLabelText(/city/i), "Lahore");
    await user.click(screen.getByRole("button", { name: "Register" }));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith({
        full_name: "Jane Doe",
        email: "jane@example.com",
        password: "hunter22",
        city: "Lahore",
        phone_number: "",
      });
    });
    expect(await screen.findByText(/registered! redirecting to login/i)).toBeInTheDocument();
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/login"), { timeout: 1500 });
  });

  it("shows the server's error message and does not navigate when registration fails", async () => {
    const register = vi.fn().mockRejectedValue({
      response: { data: { detail: "Email already registered" } },
    });
    useAuth.mockReturnValue({ register });
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/full name/i), "Jane Doe");
    await user.type(screen.getByLabelText(/^email$/i), "dupe@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "hunter22");
    await user.click(screen.getByRole("button", { name: "Register" }));

    expect(await screen.findByText("Email already registered")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("falls back to a generic error message when the server gives no detail", async () => {
    const register = vi.fn().mockRejectedValue(new Error("network down"));
    useAuth.mockReturnValue({ register });
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/full name/i), "Jane Doe");
    await user.type(screen.getByLabelText(/^email$/i), "jane@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "hunter22");
    await user.click(screen.getByRole("button", { name: "Register" }));

    expect(await screen.findByText("Registration failed")).toBeInTheDocument();
  });
});