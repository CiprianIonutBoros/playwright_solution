export interface ActivityEntry {
  /** Numeric string; also the `after` cursor for the next page. */
  id: string;
  requestId: string;
  actorId: string | null;
  actorRole: string | null;
  action: string;
  entity: string;
  entityId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  createdAt: string;
}

export interface ActivityPage {
  items: ActivityEntry[];
}

export interface DashboardActivity {
  action: string;
  entity: string;
  entityId: string;
  createdAt: string;
}

/** GET /api/v1/dashboard - 200. */
export interface Dashboard {
  profile: string;
  productCount: number;
  orderCount: number;
  activityCount: number;
  recentActivity: DashboardActivity[];
}
