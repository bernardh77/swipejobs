import { render, screen, fireEvent, act } from "@testing-library/react";
import { ToastProvider } from "@/components/jobs/ToastProvider";
import { JobActionsProvider, useJobActions } from "@/components/matches/JobActionsProvider";
import { submitJobDecision } from "@/lib/api";

jest.mock("@/lib/api", () => ({
  submitJobDecision: jest.fn(() => Promise.resolve()),
}));

jest.mock("@/hooks/useMatchesData", () => ({
  useMatchesData: () => ({
    jobs: [
      {
        id: "job-1",
        title: "Driver",
        company: "Acme",
        industry: "Logistics",
        description: "",
        pay: 12.5,
        matchScore: 4.2,
        imageUrl: "",
        location: "",
      },
      {
        id: "job-2",
        title: "Picker",
        company: "Acme",
        industry: "Warehouse",
        description: "",
        pay: 11.0,
        matchScore: 3.9,
        imageUrl: "",
        location: "",
      },
    ],
    worker: null,
    isLoading: false,
    error: null,
  }),
}));

function Harness() {
  const { visibleJobs, scheduleDecision, undoDecision } = useJobActions();
  return (
    <div>
      <span data-testid="count">{visibleJobs.length}</span>
      <button onClick={() => scheduleDecision("job-1", "accepted")}>Accept</button>
      <button onClick={() => undoDecision("job-1")}>Undo</button>
    </div>
  );
}

describe("JobActionsProvider", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (submitJobDecision as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("removes immediately and calls API after the undo window", async () => {
    render(
      <ToastProvider>
        <JobActionsProvider>
          <Harness />
        </JobActionsProvider>
      </ToastProvider>
    );

    await act(async () => {});
    expect(screen.getByTestId("count")).toHaveTextContent("2");
    await act(async () => {});
    fireEvent.click(screen.getByText("Accept"));
    expect(screen.getByTestId("count")).toHaveTextContent("1");

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    expect(submitJobDecision).toHaveBeenCalledWith("job-1", "accepted");
  });

  it("restores the job and skips API when undone", async () => {
    render(
      <ToastProvider>
        <JobActionsProvider>
          <Harness />
        </JobActionsProvider>
      </ToastProvider>
    );

    await act(async () => {});
    fireEvent.click(screen.getByText("Accept"));
    expect(screen.getByTestId("count")).toHaveTextContent("1");
    fireEvent.click(screen.getAllByText("Undo")[0]);
    expect(screen.getByTestId("count")).toHaveTextContent("2");

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    expect(submitJobDecision).not.toHaveBeenCalled();
  });
});
