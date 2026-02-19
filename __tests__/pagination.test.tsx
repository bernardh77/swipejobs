import { render, screen, fireEvent } from "@testing-library/react";
import Pagination from "@/components/jobs/Pagination";

describe("Pagination", () => {
  it("disables prev on the first page and next on the last page", () => {
    const { rerender } = render(
      <Pagination
        page={1}
        totalPages={3}
        totalItems={30}
        pageSize={10}
        onPageChange={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: /previous page/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next page/i })).not.toBeDisabled();

    rerender(
      <Pagination
        page={3}
        totalPages={3}
        totalItems={30}
        pageSize={10}
        onPageChange={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: /next page/i })).toBeDisabled();
  });

  it("fires onPageChange for next", () => {
    const onPageChange = jest.fn();
    render(
      <Pagination
        page={2}
        totalPages={3}
        totalItems={30}
        pageSize={10}
        onPageChange={onPageChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /next page/i }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
