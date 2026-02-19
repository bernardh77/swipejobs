import { render, screen, fireEvent } from "@testing-library/react";
import Pagination, { getVisiblePages } from "@/components/jobs/Pagination";

describe("Pagination", () => {
  it("calculates the visible page window", () => {
    expect(getVisiblePages(1, 10)).toEqual([1, 2, 3]);
    expect(getVisiblePages(2, 10)).toEqual([1, 2, 3]);
    expect(getVisiblePages(3, 10)).toEqual([2, 3, 4]);
    expect(getVisiblePages(9, 10)).toEqual([8, 9, 10]);
    expect(getVisiblePages(10, 10)).toEqual([8, 9, 10]);
    expect(getVisiblePages(1, 2)).toEqual([1, 2]);
    expect(getVisiblePages(1, 3)).toEqual([1, 2, 3]);
  });

  it("disables prev on the first page and next on the last page", () => {
    const { rerender } = render(
      <Pagination
        currentPage={1}
        totalPages={3}
        onPageChange={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: /previous page/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next page/i })).not.toBeDisabled();

    rerender(
      <Pagination
        currentPage={3}
        totalPages={3}
        onPageChange={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: /next page/i })).toBeDisabled();
  });

  it("fires onPageChange for next", () => {
    const onPageChange = jest.fn();
    render(
      <Pagination
        currentPage={2}
        totalPages={3}
        onPageChange={onPageChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /next page/i }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
