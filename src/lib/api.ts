import type {
  JobsResult,
  Job,
  JobDecision,
  MatchResponse,
  ProfileResponse,
  WorkerProfile,
} from "./types";

const API_BASE = "/api";
export const WORKER_ID = "7f90df6e-b832-44e2-b624-3143d428001f";

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isProfileResponse = (value: unknown): value is ProfileResponse => {
  if (!isRecord(value)) return false;
  return (
    typeof value.firstName === "string" &&
    typeof value.lastName === "string" &&
    isRecord(value.address)
  );
};

const isMatchResponse = (value: unknown): value is MatchResponse => {
  if (!isRecord(value)) return false;
  return (
    typeof value.jobId === "string" &&
    isRecord(value.jobTitle) &&
    typeof value.jobTitle.name === "string" &&
    isRecord(value.company) &&
    typeof value.company.name === "string"
  );
};

const isMatchesResponse = (value: unknown): value is MatchResponse[] =>
  Array.isArray(value) && value.every(isMatchResponse);

const buildHeaders = (init?: RequestInit) => {
  const baseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const extraHeaders = init?.headers ?? {};
  return { ...baseHeaders, ...extraHeaders };
};

async function fetchJson<T>(
  url: string,
  init: RequestInit,
  guard: (value: unknown) => value is T
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: buildHeaders(init),
    });
  } catch (error) {
    throw new ApiError("Network error. Please try again.");
  }

  let text: string;
  try {
    text = await response.text();
  } catch (error) {
    throw new ApiError("Failed to read server response.", response.status);
  }

  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      throw new ApiError("Invalid JSON in response.", response.status);
    }
  }

  if (!response.ok) {
    const message =
      isRecord(data) && typeof data.message === "string"
        ? data.message
        : `Request failed with status ${response.status}.`;
    throw new ApiError(message, response.status);
  }

  if (!guard(data)) {
    throw new ApiError("Unexpected response shape.", response.status);
  }

  return data;
}

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
};

export async function getWorker(workerId: string): Promise<ProfileResponse> {
  return fetchJson<ProfileResponse>(
    `${API_BASE}/worker/${workerId}/profile`,
    { method: "GET" },
    isProfileResponse
  );
}

export async function getMatches(workerId: string): Promise<MatchResponse[]> {
  return fetchJson<MatchResponse[]>(
    `${API_BASE}/worker/${workerId}/matches`,
    { method: "GET" },
    isMatchesResponse
  );
}

export async function fetchProfile(): Promise<WorkerProfile> {
  const data = await getWorker(WORKER_ID);

  return {
    name: `${data.firstName} ${data.lastName}`,
    email: data.email ?? "Email unavailable",
    location: data.address.formattedAddress || "Location unavailable",
    avatarUrl: buildProfileAvatar(`${data.firstName} ${data.lastName}`),
    maxJobDistance: data.maxJobDistance,
  };
}

export async function fetchJobs(
  page: number,
  limit = 10
): Promise<JobsResult> {
  const data = await getMatches(WORKER_ID);

  const total = data.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const pageItems = data.slice(start, start + limit);

  const jobs: Job[] = pageItems.map((match, index) =>
    mapMatchToJob(match, index, start)
  );

  return {
    jobs,
    total,
    page,
    totalPages,
  };
}

export function mapMatchToJob(
  match: MatchResponse,
  index = 0,
  start = 0
): Job {
  const jobId = match.jobId ?? `job-${start + index + 1}`;
  const title = match.jobTitle?.name ?? "Open role";
  const company = match.company?.name ?? "SwipeJobs Partner";
  const industry =
    match.branch ?? match.company?.address?.formattedAddress ?? "General";
  const payCents = match.wagePerHourInCents ?? 0;
  const pay = Number.isFinite(payCents) ? payCents / 100 : 0;
  const shiftStart = match.shifts?.[0]?.startDate ?? null;
  const location = match.company?.address?.formattedAddress ?? undefined;
  const timeZone = match.company?.address?.zoneId ?? undefined;
  const descriptionParts = [
    match.milesToTravel ? `${match.milesToTravel} miles away` : null,
    match.requirements?.length
      ? `Requirements: ${match.requirements.join(", ")}`
      : null,
    shiftStart ? `Start: ${formatDate(shiftStart)}` : null,
  ].filter(Boolean);
  const description =
    descriptionParts.join(" ") || "Details available upon request.";
  const matchScore = buildMatchScore(jobId);
  const imageUrl = match.jobTitle?.imageUrl ?? buildPlaceholderImage(title);

  return {
    id: jobId,
    title,
    company,
    industry,
    description,
    pay,
    matchScore,
    imageUrl,
    location,
    distanceMiles: match.milesToTravel,
    startDate: shiftStart ? formatDate(shiftStart) : undefined,
    address: match.company?.address?.formattedAddress ?? undefined,
    branch: match.branch ?? undefined,
    branchPhoneNumber: match.branchPhoneNumber ?? undefined,
    reportTo: match.company?.reportTo
      ? {
          name: match.company?.reportTo?.name,
          phone: match.company?.reportTo?.phone,
        }
      : undefined,
    requirements: match.requirements,
    shiftCount: match.shifts?.length,
    shifts: match.shifts,
    timeZone,
  };
}

export async function submitJobDecision(
  jobId: string,
  decision: JobDecision
): Promise<void> {
  const action = decision === "accepted" ? "accept" : "reject";
  const response = await fetchJson<any>(
    `${API_BASE}/worker/${WORKER_ID}/job/${jobId}/${action}`,
    { method: "GET" },
    (_value: unknown): _value is unknown => true
  );

  if (response && response.success === false) {
    throw new ApiError(response.message || "Failed to process decision.");
  }
}

function buildMatchScore(jobId: string): number {
  let hash = 0;
  for (let i = 0; i < jobId.length; i += 1) {
    hash = (hash + jobId.charCodeAt(i) * (i + 1)) % 100;
  }
  return 3.2 + (hash % 18) / 10;
}

function buildPlaceholderImage(title: string): string {
  const initial = title.trim().slice(0, 1).toUpperCase() || "J";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#f5eee4" offset="0"/><stop stop-color="#e6d8c4" offset="1"/></linearGradient></defs><rect width="480" height="320" fill="url(#g)"/><circle cx="240" cy="160" r="80" fill="#fdf7ee"/><text x="240" y="185" font-family="Space Grotesk, sans-serif" font-size="72" fill="#4e453d" text-anchor="middle">${initial}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function buildProfileAvatar(name: string): string {
  const initial = name.trim().slice(0, 1).toUpperCase() || "W";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#f2e5dc" offset="0"/><stop stop-color="#e2cdbb" offset="1"/></linearGradient></defs><rect width="160" height="160" fill="url(#g)"/><circle cx="80" cy="80" r="52" fill="#fdf7ee"/><text x="80" y="95" font-family="Space Grotesk, sans-serif" font-size="64" fill="#4e453d" text-anchor="middle">${initial}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
