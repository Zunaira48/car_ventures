import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import MyFavorites from "./MyFavorites";
import api from "../api/client";

vi.mock("../api/client", () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <MyFavorites />
    </MemoryRouter>
  );
}

const VEHICLE = {
  id: 41,
  title: "2014 Suzuki Alto ECO-S",
  category: "Economy",
  transmission: "Automatic",
  fuel_type: "Petrol",
  location: "Islamabad",
  rental_price: 1300,
  images: [],
};

describe("MyFavorites", () => {
  beforeEach(() => {
    api.get.mockReset();
    api.delete.mockReset();
  });

  it("shows a skeleton grid while loading", () => {
    api.get.mockReturnValue(new Promise(() => {})); // never resolves
    const { container } = renderPage();
    expect(container.querySelector(".skeleton-card")).toBeInTheDocument();
  });

  it("shows an empty-state message with a link to browse vehicles when there are no favorites", async () => {
    api.get.mockResolvedValue({ data: [] });
    renderPage();
    expect(await screen.findByText(/no favorites yet/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /browse vehicles/i })).toBeInTheDocument();
  });

  it("renders a favorite vehicle once loaded", async () => {
    api.get.mockResolvedValue({ data: [VEHICLE] });
    renderPage();
    expect(await screen.findByText("2014 Suzuki Alto ECO-S")).toBeInTheDocument();
    expect(screen.getByText(/1 saved/i)).toBeInTheDocument();
    expect(screen.getByText(/PKR 1300/)).toBeInTheDocument();
  });

  it("removes a vehicle from the list when its remove button is clicked", async () => {
    api.get.mockResolvedValue({ data: [VEHICLE] });
    api.delete.mockResolvedValue({});
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("2014 Suzuki Alto ECO-S");
    await user.click(screen.getByTitle(/remove from favorites/i));

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith(`/favorites/${VEHICLE.id}`);
    });
    await waitFor(() => {
      expect(screen.queryByText("2014 Suzuki Alto ECO-S")).not.toBeInTheDocument();
    });
  });
});