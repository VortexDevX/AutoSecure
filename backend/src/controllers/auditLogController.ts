import { Request, Response } from 'express';
import { AuditLog } from '../models/AuditLog';
import { asyncHandler } from '../utils/asyncHandler';
import { ValidationError } from '../utils/errors';

/**
 * GET /api/v1/audit-logs
 * Get audit logs with filtering and pagination
 */
export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = '1',
    limit = '20',
    action,
    resource_type,
    user_id,
    start_date,
    end_date,
    search,
    sort_by = 'createdAt',
    sort_order = 'desc',
  } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  // Validation
  if (pageNum < 1) {
    throw new ValidationError('Page must be >= 1');
  }
  if (limitNum < 1 || limitNum > 100) {
    throw new ValidationError('Limit must be between 1 and 100');
  }

  // Build query
  const query: any = {};

  // Filter by action
  if (action && action !== 'all') {
    query.action = action;
  }

  // Filter by resource type
  if (resource_type && resource_type !== 'all') {
    query.resource_type = resource_type;
  }

  // Filter by user
  if (user_id) {
    query.user_id = user_id;
  }

  // Filter by date range
  if (start_date || end_date) {
    query.createdAt = {};
    if (start_date) {
      query.createdAt.$gte = new Date(start_date as string);
    }
    if (end_date) {
      // Add 1 day to include the end date fully
      const endDateObj = new Date(end_date as string);
      endDateObj.setDate(endDateObj.getDate() + 1);
      query.createdAt.$lt = endDateObj;
    }
  }

  // Search in details (limited - searches resource_id and stringified details)
  if (search) {
    query.$or = [
      { resource_id: { $regex: search, $options: 'i' } },
      { ip_address: { $regex: search, $options: 'i' } },
    ];
  }

  // Execute query
  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .populate('user_id', 'email full_name role')
      .sort({ [sort_by as string]: sort_order === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    AuditLog.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPreviousPage = pageNum > 1;

  res.json({
    success: true,
    data: {
      logs: logs.map((log: any) => ({
        id: log._id.toString(),
        user: log.user_id
          ? {
              id: log.user_id._id?.toString(),
              email: log.user_id.email,
              full_name: log.user_id.full_name,
              role: log.user_id.role,
            }
          : null,
        action: log.action,
        resource_type: log.resource_type,
        resource_id: log.resource_id,
        details: log.details,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        created_at: log.createdAt,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        total_pages: totalPages,
        has_next_page: hasNextPage,
        has_previous_page: hasPreviousPage,
      },
    },
  });
});

/**
 * GET /api/v1/audit-logs/stats
 * Get audit log statistics
 */
export const getAuditLogStats = asyncHandler(async (req: Request, res: Response) => {
  const { days = '7' } = req.query;
  const daysNum = parseInt(days as string, 10);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysNum);

  // Get counts by action
  const actionCounts = await AuditLog.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    { $group: { _id: '$action', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // Get counts by resource type
  const resourceCounts = await AuditLog.aggregate([
    { $match: { createdAt: { $gte: startDate }, resource_type: { $ne: null } } },
    { $group: { _id: '$resource_type', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // Get daily activity
  const dailyActivity = await AuditLog.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Get total count
  const totalLogs = await AuditLog.countDocuments({ createdAt: { $gte: startDate } });

  res.json({
    success: true,
    data: {
      period_days: daysNum,
      total_logs: totalLogs,
      by_action: actionCounts.map((item) => ({
        action: item._id,
        count: item.count,
      })),
      by_resource: resourceCounts.map((item) => ({
        resource_type: item._id,
        count: item.count,
      })),
      daily_activity: dailyActivity.map((item) => ({
        date: item._id,
        count: item.count,
      })),
    },
  });
});

/**
 * GET /api/v1/audit-logs/:id
 * Get single audit log detail
 */
export const getAuditLogById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const log = await AuditLog.findById(id).populate('user_id', 'email full_name role').lean();

  if (!log) {
    throw new ValidationError('Audit log not found');
  }

  res.json({
    success: true,
    data: {
      log: {
        id: (log as any)._id.toString(),
        user: (log as any).user_id
          ? {
              id: (log as any).user_id._id?.toString(),
              email: (log as any).user_id.email,
              full_name: (log as any).user_id.full_name,
              role: (log as any).user_id.role,
            }
          : null,
        action: log.action,
        resource_type: log.resource_type,
        resource_id: log.resource_id,
        details: log.details,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        created_at: log.createdAt,
      },
    },
  });
});
