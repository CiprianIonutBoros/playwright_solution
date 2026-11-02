import type { ActivityApi } from '../clients/ActivityApi';
import type { DashboardApi } from '../clients/DashboardApi';
import type { RequestOptions } from '../clients/BaseApiClient';
import type { ActivityEntry, ActivityPage, Dashboard } from '../models/activity';
import { readJson } from './serviceResponse';

/** Audit log and dashboard reads. The SSE stream stays on ActivityApi.events. */
export class ActivityService {
  constructor(private readonly api: ActivityApi, private readonly dashboardApi: DashboardApi) {}

  /** GET /api/v1/dashboard - 200, store metrics and recent activity. */
  async dashboard(accessToken: string): Promise<Dashboard> {
    return readJson<Dashboard>(await this.dashboardApi.overview(accessToken), 200, 'Read dashboard');
  }

  /** GET /api/v1/activity - 200. Pass `{ limit, after }` to page; `after` is the last entry id. */
  async list(accessToken: string, params?: RequestOptions['params']): Promise<ActivityPage> {
    return readJson<ActivityPage>(await this.api.list(accessToken, params), 200, 'List activity');
  }

  /** Pages through the activity log and returns the first matching entry. */
  async find(
    accessToken: string, predicate: (entry: ActivityEntry) => boolean, pageSize = 100,
  ): Promise<ActivityEntry | undefined> {
    let after = '0';
    for (;;) {
      const { items } = await this.list(accessToken, { limit: pageSize, after });
      const match = items.find(predicate);
      if (match || items.length < pageSize) {
        return match;
      }
      after = items[items.length - 1].id;
    }
  }
}
