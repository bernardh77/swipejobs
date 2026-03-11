import { render, screen, fireEvent } from "@testing-library/react";
import JobCard from "@/components/jobs/JobCard";
import type { Job } from "@/lib/types";

const baseJob: Job = {
  id: "job-1",
  title: "Driver",
  company: "C.D. Barnes and Associates",
  industry: "Chicago",
  description: "Requirements: Safety Vest",
  pay: 10.82,
  // matchScore: 3.5,
  imageUrl: "",
  distanceMiles: 11.7,
  startDate: "Sep 5",
};

describe("JobCard", () => {
  it("calls onOpen when the row is clicked", () => {
    const onOpen = jest.fn();
    render(
      <JobCard
        job={baseJob}
        isSubmitting={false}
        isPreview={false}
        onAccept={jest.fn()}
        onReject={jest.fn()}
        onOpen={onOpen}
      />
    );

    fireEvent.click(screen.getByText("Driver"));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("does not trigger onOpen when action buttons are clicked", () => {
    const onOpen = jest.fn();
    const onAccept = jest.fn();
    const onReject = jest.fn();
    render(
      <JobCard
        job={baseJob}
        isSubmitting={false}
        isPreview={false}
        onAccept={onAccept}
        onReject={onReject}
        onOpen={onOpen}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /accept driver/i }));
    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", { name: /not interested in driver/i })
    );
    expect(onReject).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });
});
