import { Request, Response } from 'express';
import { Meta, IMeta } from '../models/Meta';
import { AuditService } from '../services/auditService';
import { asyncHandler } from '../utils/asyncHandler';
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors';

/**
 * GET /api/v1/meta/categories
 * Get all available categories
 */
export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await Meta.distinct('category');

  res.json({
    status: 'success',
    data: {
      categories: categories.sort(),
      count: categories.length,
    },
  });
});

/**
 * GET /api/v1/meta/:category
 * Get all options for a category
 */
export const getOptionsByCategory = asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.params;
  const { active_only = 'false', parent_value } = req.query;

  const query: any = { category };

  // Filter by active status
  if (active_only === 'true') {
    query.active = true;
  }

  // Filter by parent (for dependent dropdowns)
  if (parent_value) {
    query.parent_value = parent_value;
  }

  const options = (await Meta.find(query).sort({ sort_order: 1, label: 1 })) as IMeta[];

  res.json({
    status: 'success',
    data: {
      category,
      options: options.map((opt) => ({
        id: opt._id.toString(),
        value: opt.value,
        label: opt.label,
        active: opt.active,
        sort_order: opt.sort_order,
        parent_value: opt.parent_value,
        metadata: opt.metadata,
      })),
      count: options.length,
    },
  });
});

/**
 * POST /api/v1/meta
 * Create new meta option
 */
export const createOption = asyncHandler(async (req: Request, res: Response) => {
  const { category, value, label, parent_value, metadata } = req.body;

  // Validate required fields
  if (!category || !value || !label) {
    throw new ValidationError('category, value, and label are required');
  }

  // Check for duplicate
  const existing = await Meta.findOne({ category, value });
  if (existing) {
    throw new ConflictError(
      `Option with value "${value}" already exists in category "${category}"`
    );
  }

  // Get max sort_order for this category
  const maxSortOrder = (await Meta.findOne({ category })
    .sort({ sort_order: -1 })
    .select('sort_order')) as IMeta | null;

  const option = (await Meta.create({
    category,
    value,
    label,
    active: true,
    sort_order: maxSortOrder ? maxSortOrder.sort_order + 1 : 1,
    parent_value,
    metadata,
  })) as IMeta;

  // Audit log
  await AuditService.logCreate(req.user!.userId, 'meta', option._id.toString(), {
    category,
    value,
    label,
  });

  res.status(201).json({
    status: 'success',
    message: 'Meta option created successfully',
    data: {
      option: {
        id: option._id.toString(),
        category: option.category,
        value: option.value,
        label: option.label,
        active: option.active,
        sort_order: option.sort_order,
        parent_value: option.parent_value,
      },
    },
  });
});

/**
 * PATCH /api/v1/meta/:id
 * Update meta option
 */
export const updateOption = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { label, active, parent_value, metadata } = req.body;

  const option = (await Meta.findById(id)) as IMeta | null;

  if (!option) {
    throw new NotFoundError('Meta option not found');
  }

  // Update allowed fields
  if (label !== undefined) option.label = label;
  if (active !== undefined) option.active = active;
  if (parent_value !== undefined) option.parent_value = parent_value;
  if (metadata !== undefined) option.metadata = metadata;

  await option.save();

  // Audit log
  await AuditService.logUpdate(req.user!.userId, 'meta', option._id.toString(), {
    category: option.category,
    value: option.value,
    updated_fields: { label, active, parent_value },
  });

  res.json({
    status: 'success',
    message: 'Meta option updated successfully',
    data: {
      option: {
        id: option._id.toString(),
        category: option.category,
        value: option.value,
        label: option.label,
        active: option.active,
        sort_order: option.sort_order,
      },
    },
  });
});

/**
 * PATCH /api/v1/meta/:id/order
 * Update sort order
 */
export const updateSortOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { sort_order } = req.body;

  if (typeof sort_order !== 'number') {
    throw new ValidationError('sort_order must be a number');
  }

  const option = (await Meta.findById(id)) as IMeta | null;

  if (!option) {
    throw new NotFoundError('Meta option not found');
  }

  option.sort_order = sort_order;
  await option.save();

  res.json({
    status: 'success',
    message: 'Sort order updated successfully',
    data: {
      option: {
        id: option._id.toString(),
        sort_order: option.sort_order,
      },
    },
  });
});

/**
 * DELETE /api/v1/meta/:id
 * Delete meta option
 */
export const deleteOption = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const option = (await Meta.findById(id)) as IMeta | null;

  if (!option) {
    throw new NotFoundError('Meta option not found');
  }

  // Audit log before deletion
  await AuditService.logDelete(req.user!.userId, 'meta', option._id.toString(), {
    category: option.category,
    value: option.value,
    label: option.label,
  });

  await option.deleteOne();

  res.json({
    status: 'success',
    message: 'Meta option deleted successfully',
  });
});

/**
 * POST /api/v1/meta/reorder
 * Bulk reorder options in a category
 */
export const reorderOptions = asyncHandler(async (req: Request, res: Response) => {
  const { category, order } = req.body;

  // order should be array of { id, sort_order }
  if (!category || !Array.isArray(order)) {
    throw new ValidationError('category and order array are required');
  }

  // Bulk update
  const updatePromises = order.map((item: { id: string; sort_order: number }) =>
    Meta.findByIdAndUpdate(item.id, { sort_order: item.sort_order })
  );

  await Promise.all(updatePromises);

  res.json({
    status: 'success',
    message: 'Options reordered successfully',
  });
});
