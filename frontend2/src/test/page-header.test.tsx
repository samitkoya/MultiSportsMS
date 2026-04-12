import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "@/components/PageHeader";

describe("PageHeader", () => {
  it("renders title and description content", () => {
    render(<PageHeader title="Venues" description="Manage every playing surface" />);

    expect(screen.getByText("Venues")).toBeInTheDocument();
    expect(screen.getByText("Manage every playing surface")).toBeInTheDocument();
  });
});
