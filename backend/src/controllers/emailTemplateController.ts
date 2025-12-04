import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { EmailTemplate } from '../models';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/errors';

/**
 * Get all email templates
 * GET /api/v1/email-templates
 */
export const getTemplates = asyncHandler(async (req: Request, res: Response) => {
  const templates = await EmailTemplate.find()
    .populate('created_by', 'email')
    .populate('updated_by', 'email')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: templates.length,
    data: templates,
  });
});

/**
 * Get single email template
 * GET /api/v1/email-templates/:id
 */
export const getTemplate = asyncHandler(async (req: Request, res: Response) => {
  const template = await EmailTemplate.findById(req.params.id)
    .populate('created_by', 'email')
    .populate('updated_by', 'email');

  if (!template) {
    throw new AppError('Email template not found', 404);
  }

  res.json({
    success: true,
    data: template,
  });
});

/**
 * Create email template
 * POST /api/v1/email-templates
 */
export const createTemplate = asyncHandler(async (req: Request, res: Response) => {
  const { template_id, name, subject, body_html, active } = req.body;

  // Check if template_id already exists
  const existing = await EmailTemplate.findOne({ template_id });
  if (existing) {
    throw new AppError(`Template with ID "${template_id}" already exists`, 400);
  }

  const template = await EmailTemplate.create({
    template_id,
    name,
    subject,
    body_html,
    active: active !== undefined ? active : true,
    created_by: new Types.ObjectId(req.user!.userId), // ✅ Fixed
    updated_by: new Types.ObjectId(req.user!.userId), // ✅ Fixed
  });

  res.status(201).json({
    success: true,
    message: 'Email template created successfully',
    data: template,
  });
});

/**
 * Update email template
 * PATCH /api/v1/email-templates/:id
 */
export const updateTemplate = asyncHandler(async (req: Request, res: Response) => {
  const { name, subject, body_html, active } = req.body;

  const template = await EmailTemplate.findById(req.params.id);
  if (!template) {
    throw new AppError('Email template not found', 404);
  }

  // Update fields
  if (name !== undefined) template.name = name;
  if (subject !== undefined) template.subject = subject;
  if (body_html !== undefined) template.body_html = body_html;
  if (active !== undefined) template.active = active;
  template.updated_by = new Types.ObjectId(req.user!.userId); // ✅ Fixed

  await template.save();

  res.json({
    success: true,
    message: 'Email template updated successfully',
    data: template,
  });
});

/**
 * Delete email template
 * DELETE /api/v1/email-templates/:id
 */
export const deleteTemplate = asyncHandler(async (req: Request, res: Response) => {
  const template = await EmailTemplate.findById(req.params.id);
  if (!template) {
    throw new AppError('Email template not found', 404);
  }

  // Prevent deleting system templates
  const systemTemplates = ['premium_details', 'license_details'];
  if (systemTemplates.includes(template.template_id)) {
    throw new AppError(`Cannot delete system template "${template.template_id}"`, 400);
  }

  await template.deleteOne();

  res.json({
    success: true,
    message: 'Email template deleted successfully',
  });
});
