import { http } from "./client";

export const auditLogsApi = { getAll: (params = {}) => http.get("/audit-logs", { params }) };
