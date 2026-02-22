import { render, screen, fireEvent } from "@testing-library/react";
import JobDetailsPanel from "@/components/jobs/JobDetailsPanel";
import type { Job } from "@/lib/types";

const baseJob: Job = {
  id: "job-1",
  title: "Driver",
  company: "C.D. Barnes and Associates",
  industry: "Chicago",
  description: "Requirements: Safety Vest",
  pay: 10.82,
  matchScore: 3.5,
  imageUrl: "",
  distanceMiles: 11.7,
  startDate: "Sep 5",
  location: "123 Main Street, Chicago, IL",
  requirements: ["Safety Vest"],
  shifts: [
    { startDate: "2023-09-04T16:00:00.000Z", endDate: "2023-09-05T00:00:00.000Z" },
  ],
};

describe("JobDetailsPanel", () => {
  it("updates the title when a new job is selected", () => {
    const { rerender } = render(
      <JobDetailsPanel job={baseJob} showActions={false} />
    );

    expect(screen.getByRole("heading", { name: "Driver" })).toBeInTheDocument();

    const nextJob: Job = {
      ...baseJob,
      id: "job-2",
      title: "Warehouse Associate",
    };

    rerender(<JobDetailsPanel job={nextJob} showActions={false} />);

    expect(
      screen.getByRole("heading", { name: "Warehouse Associate" })
    ).toBeInTheDocument();
  });

  it("hides the requirements block when none are provided", () => {
    const noRequirementsJob: Job = {
      ...baseJob,
      requirements: [],
    };

    render(<JobDetailsPanel job={noRequirementsJob} showActions={false} />);

    expect(screen.queryByText("Requirements")).not.toBeInTheDocument();
  });

  it("toggles the schedule list when show all is clicked", () => {
    const shifts = Array.from({ length: 6 }, (_, index) => {
      const day = String(index + 1).padStart(2, "0");
      return {
        startDate: `2023-09-${day}T16:00:00.000Z`,
        endDate: `2023-09-${day}T20:00:00.000Z`,
      };
    });
    const shiftJob: Job = {
      ...baseJob,
      shifts,
    };

    render(<JobDetailsPanel job={shiftJob} showActions={false} />);

    const toggleButton = screen.getByRole("button", { name: "Show all (6)" });
    fireEvent.click(toggleButton);
    expect(screen.getByRole("button", { name: "Show less" })).toBeInTheDocument();
    expect(screen.getByText("Sep 6")).toBeInTheDocument();
  });

  it("disables actions and shows pending state", () => {
    const onAccept = jest.fn();
    const onReject = jest.fn();
    render(
      <JobDetailsPanel
        job={baseJob}
        pendingDecision="accepted"
        onAccept={onAccept}
        onReject={onReject}
      />
    );

    const acceptButton = screen.getByRole("button", { name: /accept driver/i });
    expect(acceptButton).toBeDisabled();
    expect(acceptButton).toHaveTextContent("Pending...");
  });
});
