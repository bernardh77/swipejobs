export type WorkerProfile = {
  name: string;
  email: string;
  location: string;
  avatarUrl: string;
  maxJobDistance?: number;
};

export type Job = {
  id: string;
  title: string;
  company: string;
  industry: string;
  description: string;
  pay: number;
  // matchScore: number;
  imageUrl: string;
  location?: string;
  distanceMiles?: number;
  startDate?: string;
  address?: string;
  branch?: string;
  branchPhoneNumber?: string;
  reportTo?: {
    name?: string;
    phone?: string;
  };
  requirements?: string[];
  shiftCount?: number;
  shifts?: Array<{
    startDate?: string;
    endDate?: string;
  }>;
  timeZone?: string;
};

export type JobDecision = "accepted" | "rejected" | "none";

export type JobsResult = {
  jobs: Job[];
  total: number;
  page: number;
  totalPages: number;
};

export type ProfileResponse = {
  workerId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  maxJobDistance?: number;
  address: {
    formattedAddress?: string;
    zoneId?: string;
  };
};

export type MatchResponse = {
  jobId: string;
  jobTitle: {
    name: string;
    imageUrl?: string;
  };
  company: {
    name: string;
    address?: {
      formattedAddress?: string;
      zoneId?: string;
    };
    reportTo?: {
      name?: string;
      phone?: string;
    };
  };
  wagePerHourInCents?: number;
  milesToTravel?: number;
  shifts?: Array<{
    startDate?: string;
    endDate?: string;
  }>;
  branch?: string;
  branchPhoneNumber?: string;
  requirements?: string[];
};
