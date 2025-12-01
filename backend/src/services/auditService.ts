import { AuditLog, IAuditLog } from '../models/AuditLog';
import { Types } from 'mongoose';

export interface AuditLogData {
  user_id: string | Types.ObjectId;
  action: IAuditLog['action'];
  resource_type?: IAuditLog['resource_type'];
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

export class AuditService {
  /**
   * Create an audit log entry
   */
  static async log(data: AuditLogData): Promise<void> {
    try {
      await AuditLog.create({
        user_id: data.user_id,
        action: data.action,
        resource_type: data.resource_type,
        resource_id: data.resource_id,
        details: data.details,
        ip_address: data.ip_address,
        user_agent: data.user_agent,
      });
    } catch (error) {
      // Don't throw - audit logging should never break main flow
      console.error('❌ Audit log failed:', error);
    }
  }

  /**
   * Log login event
   */
  static async logLogin(
    userId: string | Types.ObjectId,
    ip?: string,
    userAgent?: string,
    success: boolean = true
  ): Promise<void> {
    await this.log({
      user_id: userId,
      action: 'login',
      details: { success },
      ip_address: ip,
      user_agent: userAgent,
    });
  }

  /**
   * Log logout event
   */
  static async logLogout(
    userId: string | Types.ObjectId,
    ip?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      user_id: userId,
      action: 'logout',
      ip_address: ip,
      user_agent: userAgent,
    });
  }

  /**
   * Log CRUD events
   */
  static async logCreate(
    userId: string | Types.ObjectId,
    resourceType: IAuditLog['resource_type'],
    resourceId: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      user_id: userId,
      action: 'create',
      resource_type: resourceType,
      resource_id: resourceId,
      details,
    });
  }

  static async logUpdate(
    userId: string | Types.ObjectId,
    resourceType: IAuditLog['resource_type'],
    resourceId: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      user_id: userId,
      action: 'update',
      resource_type: resourceType,
      resource_id: resourceId,
      details,
    });
  }

  static async logDelete(
    userId: string | Types.ObjectId,
    resourceType: IAuditLog['resource_type'],
    resourceId: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      user_id: userId,
      action: 'delete',
      resource_type: resourceType,
      resource_id: resourceId,
      details,
    });
  }

  /**
   * Log export event
   */
  static async logExport(
    userId: string | Types.ObjectId,
    details: Record<string, any>
  ): Promise<void> {
    await this.log({
      user_id: userId,
      action: 'export',
      details,
    });
  }

  /**
   * Log site toggle event
   */
  static async logSiteToggle(
    userId: string | Types.ObjectId,
    enabled: boolean,
    message?: string
  ): Promise<void> {
    await this.log({
      user_id: userId,
      action: 'site_toggle',
      resource_type: 'site_settings',
      details: { enabled, message },
    });
  }

  /**
   * Log role change event
   */
  static async logRoleChange(
    adminUserId: string | Types.ObjectId,
    targetUserId: string,
    oldRole: string,
    newRole: string
  ): Promise<void> {
    await this.log({
      user_id: adminUserId,
      action: 'role_change',
      resource_type: 'user',
      resource_id: targetUserId,
      details: { old_role: oldRole, new_role: newRole },
    });
  }
}
