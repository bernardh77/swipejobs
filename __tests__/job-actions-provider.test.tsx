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
        // matchScore: 4.2,
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
        // matchScore: 3.9,
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
      <button onClick={() => scheduleDecision("job-2", "rejected")}>Reject</button>
      <button onClick={() => undoDecision("job-1")}>Undo (direct)</button>
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
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByTestId("count")).toHaveTextContent("2");

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    expect(submitJobDecision).not.toHaveBeenCalled();
  });

  it("restores the job and shows an error on API failure", async () => {
    (submitJobDecision as jest.Mock).mockRejectedValueOnce(new Error("fail"));
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

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.getByTestId("count")).toHaveTextContent("2");
    expect(
      screen.getByText("Something went wrong. Please try again.")
    ).toBeInTheDocument();
  });

  it("handles multiple pending actions independently", async () => {
    render(
      <ToastProvider>
        <JobActionsProvider>
          <Harness />
        </JobActionsProvider>
      </ToastProvider>
    );

    await act(async () => {});
    fireEvent.click(screen.getByText("Accept"));
    fireEvent.click(screen.getByText("Reject"));
    expect(screen.getByTestId("count")).toHaveTextContent("0");

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    expect(submitJobDecision).toHaveBeenCalledWith("job-1", "accepted");
    expect(submitJobDecision).toHaveBeenCalledWith("job-2", "rejected");
  });
});
