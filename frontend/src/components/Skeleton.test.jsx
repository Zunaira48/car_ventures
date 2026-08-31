import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  SkeletonCard,
  SkeletonGrid,
  SkeletonDetail,
  SkeletonTicket,
  SkeletonTicketList,
  SkeletonStatCard,
  SkeletonStatsGrid,
  SkeletonTable,
  SkeletonCardRow,
  SkeletonCardRowList,
} from "./Skeleton";

describe("SkeletonCard / SkeletonGrid", () => {
  it("renders a single skeleton card with a photo and body lines", () => {
    const { container } = render(<SkeletonCard />);
    expect(container.querySelector(".skeleton-card")).toBeInTheDocument();
    expect(container.querySelector(".skeleton-photo")).toBeInTheDocument();
    expect(container.querySelectorAll(".skeleton-line").length).toBeGreaterThan(0);
  });

  it("renders the requested number of cards in a grid", () => {
    const { container } = render(<SkeletonGrid count={4} />);
    expect(container.querySelectorAll(".skeleton-card")).toHaveLength(4);
  });

  it("defaults to 6 cards when no count is given", () => {
    const { container } = render(<SkeletonGrid />);
    expect(container.querySelectorAll(".skeleton-card")).toHaveLength(6);
  });
});

describe("SkeletonDetail", () => {
  it("renders inside a page-narrow wrapper", () => {
    const { container } = render(<SkeletonDetail />);
    expect(container.querySelector(".page-narrow")).toBeInTheDocument();
  });
});

describe("SkeletonTicket / SkeletonTicketList", () => {
  it("renders a single ticket with main, divider, and stub sections", () => {
    const { container } = render(<SkeletonTicket />);
    expect(container.querySelector(".skeleton-ticket")).toBeInTheDocument();
    expect(container.querySelector(".skeleton-ticket-main")).toBeInTheDocument();
    expect(container.querySelector(".ticket-divider")).toBeInTheDocument();
    expect(container.querySelector(".skeleton-ticket-stub")).toBeInTheDocument();
  });

  it("renders the requested number of tickets", () => {
    const { container } = render(<SkeletonTicketList count={5} />);
    expect(container.querySelectorAll(".skeleton-ticket")).toHaveLength(5);
  });

  it("defaults to 3 tickets when no count is given", () => {
    const { container } = render(<SkeletonTicketList />);
    expect(container.querySelectorAll(".skeleton-ticket")).toHaveLength(3);
  });
});

describe("SkeletonStatCard / SkeletonStatsGrid", () => {
  it("renders a single stat card", () => {
    const { container } = render(<SkeletonStatCard />);
    expect(container.querySelector(".stat-card")).toBeInTheDocument();
  });

  it("renders the requested number of stat cards", () => {
    const { container } = render(<SkeletonStatsGrid count={3} />);
    expect(container.querySelectorAll(".stat-card")).toHaveLength(3);
  });
});

describe("SkeletonTable", () => {
  it("renders the requested number of rows and columns", () => {
    const { container } = render(<SkeletonTable rows={4} cols={6} />);
    const rows = container.querySelectorAll("tbody tr");
    expect(rows).toHaveLength(4);
    rows.forEach((row) => {
      expect(row.querySelectorAll("td")).toHaveLength(6);
    });
  });

  it("defaults to 5 rows and 5 columns", () => {
    const { container } = render(<SkeletonTable />);
    expect(container.querySelectorAll("tbody tr")).toHaveLength(5);
    expect(container.querySelectorAll("tbody tr")[0].querySelectorAll("td")).toHaveLength(5);
  });
});

describe("SkeletonCardRow / SkeletonCardRowList", () => {
  it("renders a single card-shaped row with no photo placeholder", () => {
    const { container } = render(<SkeletonCardRow />);
    expect(container.querySelector(".card")).toBeInTheDocument();
    expect(container.querySelector(".skeleton-photo")).not.toBeInTheDocument();
  });

  it("renders the requested number of card rows", () => {
    const { container } = render(<SkeletonCardRowList count={2} />);
    expect(container.querySelectorAll(".card")).toHaveLength(2);
  });
});