import type { LabApi } from '../clients/LabApi';
import type { LabProfileState, LabResetResult } from '../models/lab';
import { readJson } from './serviceResponse';

/** Lab profile selection and data reset. Only the cleanup project calls reset. */
export class LabService {
  constructor(private readonly api: LabApi) {}

  /** GET /api/v1/lab/profile - 200. */
  async getProfile(accessToken: string): Promise<LabProfileState> {
    return readJson<LabProfileState>(await this.api.getProfile(accessToken), 200, 'Read lab profile');
  }

  /** PUT /api/v1/lab/profile - 200. Changing the profile affects every running test. */
  async selectProfile(profile: string, accessToken: string): Promise<LabProfileState> {
    return readJson<LabProfileState>(await this.api.selectProfile({ profile }, accessToken), 200, 'Select lab profile');
  }

  /**
   * POST /api/v1/lab/reset - 200. Admin only. Restores seed data and deletes every registered account,
   * so never call it while other tests run.
   */
  async reset(accessToken: string): Promise<LabResetResult> {
    return readJson<LabResetResult>(await this.api.reset(accessToken), 200, 'Reset lab data');
  }
}
