import { render, screen } from "@testing-library/react";
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
});
