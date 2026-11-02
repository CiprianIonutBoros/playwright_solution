export interface SelectLabProfileRequest {
  profile: string;
}

export interface LabProfile {
  id: string;
  name: string;
  summary: string;
}

/** POST /api/v1/lab/reset - 200. Shape observed on the live API; OpenAPI leaves it unspecified. */
export interface LabResetResult {
  reset: boolean;
  profile: string;
  seedVersion: string;
}

/** GET and PUT /api/v1/lab/profile - 200. */
export interface LabProfileState {
  activeProfile: string;
  updatedAt: string;
  profiles: LabProfile[];
}
