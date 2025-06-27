import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Basic Test", () => {
  it("can run basic assertions", () => {
    expect(1 + 1).toBe(2);
  });
});

describe("UI Components", () => {
  it("renders a button", () => {
    render(<Button>Test Button</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.getByText("Test Button")).toBeInTheDocument();
  });
});
