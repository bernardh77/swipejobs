import { fetchJobs, fetchProfile, submitJobDecision, ApiError } from "@/lib/api";

const mockFetch = (body: string, status = 200) => {
  const ok = status >= 200 && status < 300;
  return Promise.resolve({
    ok,
    status,
    text: async () => body,
  } as Response);
};

describe("api", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("fetches and maps profile data", async () => {
    (global.fetch as jest.Mock).mockReturnValue(
      mockFetch(
        JSON.stringify({
          firstName: "Taylor",
          lastName: "Reed",
          address: { formattedAddress: "Austin, TX" },
        })
      )
    );

    const profile = await fetchProfile();
    expect(profile.name).toBe("Taylor Reed");
    expect(profile.location).toBe("Austin, TX");
    expect(profile.avatarUrl).toContain("data:image/svg+xml");
  });

  it("throws on 500 responses", async () => {
    (global.fetch as jest.Mock).mockReturnValue(
      mockFetch(JSON.stringify({ message: "Server error" }), 500)
    );

    await expect(fetchJobs(1)).rejects.toMatchObject<ApiError>({
      status: 500,
    });
  });

  it("throws on 404 responses", async () => {
    (global.fetch as jest.Mock).mockReturnValue(
      mockFetch(JSON.stringify({ message: "Not found" }), 404)
    );

    await expect(fetchProfile()).rejects.toMatchObject<ApiError>({
      status: 404,
    });
  });

  it("throws on network failures", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network down"));

    await expect(fetchJobs(1)).rejects.toThrow("Network error");
  });

  it("throws on invalid JSON", async () => {
    (global.fetch as jest.Mock).mockReturnValue(mockFetch("not-json"));

    await expect(fetchJobs(1)).rejects.toThrow("Invalid JSON");
  });

  it("submits job decisions", async () => {
    (global.fetch as jest.Mock).mockReturnValue(
      mockFetch(JSON.stringify({ id: 10 }))
    );

    await expect(submitJobDecision("job-10", "accepted")).resolves.toBeUndefined();
  });

  it("throws on unexpected profile shape", async () => {
    (global.fetch as jest.Mock).mockReturnValue(
      mockFetch(JSON.stringify({ firstName: "Taylor" }))
    );

    await expect(fetchProfile()).rejects.toThrow("Unexpected response shape");
  });

  it("throws on unexpected matches shape", async () => {
    (global.fetch as jest.Mock).mockReturnValue(
      mockFetch(JSON.stringify([{ jobId: 123 }]))
    );

    await expect(fetchJobs(1)).rejects.toThrow("Unexpected response shape");
  });

  it("throws on decision network failure", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network down"));

    await expect(submitJobDecision("job-10", "rejected")).rejects.toThrow(
      "Network error"
    );
  });
});
