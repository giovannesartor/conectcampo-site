export interface IPaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export interface IApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface IAuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface IDateRange {
  start: Date;
  end: Date;
}
