'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/context/AuthContext';
import { useRequireOwner } from '@/lib/hooks/useRequireRole';
import { AccessDenied } from '@/components/admin/AccessDenied';
import { getEmailTemplates, updateEmailTemplate } from '@/lib/api/emailTemplates';
import {
  EmailTemplate,
  TemplateVariable,
  getVariablesForTemplate,
  getSectionLabelsForTemplate,
} from '@/lib/types/emailTemplate';
import {
  EnvelopeIcon,
  DocumentTextIcon,
  EyeIcon,
  CodeBracketIcon,
  CheckIcon,
  ClipboardIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

export default function EmailTemplatesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { isAuthorized, isCheckingAuth } = useRequireOwner();

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBodyHtml, setEditBodyHtml] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);

  const templateVariables = selectedTemplate
    ? getVariablesForTemplate(selectedTemplate.template_id)
    : [];
  const sectionLabels = selectedTemplate
    ? getSectionLabelsForTemplate(selectedTemplate.template_id)
    : {};

  useEffect(() => {
    if (user && user.role !== 'owner') {
      toast.error('Only owners can access email templates');
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (!selectedTemplate) return;
    const sections = getSectionLabelsForTemplate(selectedTemplate.template_id);
    const initialExpanded: Record<string, boolean> = {};
    Object.keys(sections).forEach((section) => {
      initialExpanded[section] = true;
    });
    setExpandedSections(initialExpanded);
  }, [selectedTemplate?.template_id]);

  useEffect(() => {
    if (!selectedTemplate) return;
    setHasChanges(editSubject !== selectedTemplate.subject || editBodyHtml !== selectedTemplate.body_html);
  }, [editSubject, editBodyHtml, selectedTemplate]);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const data = await getEmailTemplates();
      setTemplates(data);
      if (data.length > 0) selectTemplate(data[0], false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const selectTemplate = (template: EmailTemplate, askForUnsaved = true) => {
    if (askForUnsaved && hasChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to switch templates?')) {
        return;
      }
    }

    setSelectedTemplate(template);
    setEditSubject(template.subject);
    setEditBodyHtml(template.body_html);
    setHasChanges(false);
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;
    setIsSaving(true);
    try {
      const updated = await updateEmailTemplate(selectedTemplate._id, {
        subject: editSubject,
        body_html: editBodyHtml,
      });
      setTemplates((prev) => prev.map((template) => (template._id === updated._id ? updated : template)));
      setSelectedTemplate(updated);
      setHasChanges(false);
      toast.success('Template saved successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (!selectedTemplate) return;
    setEditSubject(selectedTemplate.subject);
    setEditBodyHtml(selectedTemplate.body_html);
    setHasChanges(false);
  };

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable);
    setCopiedVariable(variable);
    toast.success(`Copied ${variable}`);
    setTimeout(() => setCopiedVariable(null), 2000);
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('html-editor') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = editBodyHtml.substring(0, start) + variable + editBodyHtml.substring(end);
    setEditBodyHtml(newValue);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  const generatePreview = useCallback(() => {
    let preview = editBodyHtml;
    templateVariables.forEach((variable) => {
      const regex = new RegExp(variable.key.replace(/[{}]/g, '\\$&'), 'g');
      preview = preview.replace(regex, variable.example);
    });
    return preview;
  }, [editBodyHtml, templateVariables]);

  const generateSubjectPreview = useCallback(() => {
    let preview = editSubject;
    templateVariables.forEach((variable) => {
      const regex = new RegExp(variable.key.replace(/[{}]/g, '\\$&'), 'g');
      preview = preview.replace(regex, variable.example);
    });
    return preview;
  }, [editSubject, templateVariables]);

  const groupedVariables = templateVariables.reduce(
    (acc, variable) => {
      if (!acc[variable.section]) acc[variable.section] = [];
      acc[variable.section].push(variable);
      return acc;
    },
    {} as Record<string, TemplateVariable[]>
  );

  const getTemplateTypeLabel = (templateId: string): string => {
    switch (templateId) {
      case 'premium_details':
        return 'Policy';
      case 'license_details':
        return 'License';
      default:
        return 'Custom';
    }
  };

  const getTemplateTypeBadge = (templateId: string): 'primary' | 'success' | 'warning' => {
    switch (templateId) {
      case 'premium_details':
        return 'primary';
      case 'license_details':
        return 'success';
      default:
        return 'warning';
    }
  };

  if (isCheckingAuth || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton height={28} width={220} />
          <Skeleton height={36} width={140} />
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[17rem_minmax(0,1fr)_20rem]">
          <Skeleton height={680} />
          <Skeleton height={680} />
          <Skeleton height={680} />
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <AccessDenied message="Only owners can manage email templates." />;
  }

  return (
    <div className="space-y-5">
      <section className="glass-panel-strong rounded-[24px] px-4 py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="section-label">Template Studio</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              Email templates
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Edit structure, insert variables, and keep a live preview visible while you work.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {hasChanges && (
              <span className="rounded-full border border-amber-200 bg-amber-50/90 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-amber-700">
                Unsaved changes
              </span>
            )}
            <Button variant="ghost" onClick={handleReset} disabled={!hasChanges || isSaving}>
              Reset
            </Button>
            <Button onClick={handleSave} isLoading={isSaving} disabled={!hasChanges}>
              <CheckIcon className="h-4 w-4" />
              Save Template
            </Button>
          </div>
        </div>
      </section>

      {templates.length > 0 ? (
        <div className="grid gap-5 xl:grid-cols-[17rem_minmax(0,1fr)_20rem]">
          <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
            <Card className="rounded-[22px]">
              <CardHeader>
                <CardTitle>Templates</CardTitle>
                <CardDescription>Choose the template you want to edit.</CardDescription>
              </CardHeader>
              <CardBody className="space-y-2">
                {templates.map((template) => (
                  <button
                    key={template._id}
                    onClick={() => selectTemplate(template)}
                    className={`w-full rounded-[16px] border px-3 py-3 text-left transition ${
                      selectedTemplate?._id === template._id
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-slate-50/90 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{template.name}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.16em] opacity-70">
                          {getTemplateTypeLabel(template.template_id)}
                        </p>
                      </div>
                      <Badge
                        variant={getTemplateTypeBadge(template.template_id)}
                        className={selectedTemplate?._id === template._id ? 'border-white/30 bg-white/15 text-white' : ''}
                      >
                        {getTemplateTypeLabel(template.template_id)}
                      </Badge>
                    </div>
                  </button>
                ))}
              </CardBody>
            </Card>

            <Card className="rounded-[22px]">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5 text-slate-500" />
                  <CardTitle>Variables</CardTitle>
                </div>
                <CardDescription>Single click to copy. Double click to insert.</CardDescription>
              </CardHeader>
              <CardBody className="max-h-[540px] overflow-y-auto p-0">
                <div className="divide-y divide-slate-200/80">
                  {Object.entries(groupedVariables).map(([section, variables]) => (
                    <div key={section}>
                      <button
                        onClick={() =>
                          setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
                        }
                        className="flex w-full items-center justify-between px-4 py-3 transition hover:bg-slate-50/80"
                      >
                        <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
                          <span>{sectionLabels[section]?.icon || '📄'}</span>
                          {sectionLabels[section]?.label || section}
                          <Badge variant="secondary">{variables.length}</Badge>
                        </span>
                        {expandedSections[section] ? (
                          <ChevronUpIcon className="h-4 w-4 text-slate-500" />
                        ) : (
                          <ChevronDownIcon className="h-4 w-4 text-slate-500" />
                        )}
                      </button>

                      {expandedSections[section] && (
                        <div className="space-y-1 px-4 pb-3">
                          {variables.map((variable) => (
                            <button
                              key={variable.key}
                              onClick={() => copyVariable(variable.key)}
                              onDoubleClick={() => insertVariable(variable.key)}
                              className={`flex w-full items-center justify-between rounded-[14px] border px-3 py-2 text-left transition ${
                                copiedVariable === variable.key
                                  ? 'border-emerald-200 bg-emerald-50/80'
                                  : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <code className="text-sm font-medium text-primary">{variable.key}</code>
                                <p className="truncate text-xs text-slate-500">{variable.label}</p>
                              </div>
                              {copiedVariable === variable.key ? (
                                <CheckIcon className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <ClipboardIcon className="h-4 w-4 text-slate-400" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </aside>

          <section className="space-y-4">
            <Card className="rounded-[22px]">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <EnvelopeIcon className="h-5 w-5 text-slate-500" />
                  <CardTitle>Email Subject</CardTitle>
                </div>
              </CardHeader>
              <CardBody>
                <Input
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  placeholder="Enter email subject"
                  helpText={`Use variables like ${templateVariables[0]?.key || '{{variable}}'} in the subject`}
                />
              </CardBody>
            </Card>

            <Card className="rounded-[22px]">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CodeBracketIcon className="h-5 w-5 text-slate-500" />
                  <CardTitle>HTML Template</CardTitle>
                </div>
                <CardDescription>Main editor surface.</CardDescription>
              </CardHeader>
              <CardBody className="p-0">
                <textarea
                  id="html-editor"
                  value={editBodyHtml}
                  onChange={(e) => setEditBodyHtml(e.target.value)}
                  className="h-[640px] w-full resize-none border-0 bg-slate-50/90 p-4 font-mono text-sm text-slate-800 focus:ring-0"
                  placeholder="Enter HTML template..."
                  spellCheck={false}
                />
              </CardBody>
            </Card>
          </section>

          <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
            <Card className="rounded-[22px] overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <EyeIcon className="h-5 w-5 text-slate-500" />
                  <CardTitle>Live Preview</CardTitle>
                </div>
                <CardDescription>Rendered with sample data.</CardDescription>
              </CardHeader>
              <CardBody className="p-0">
                <div className="border-t border-slate-200/80">
                  <div className="bg-slate-50/90 px-4 py-3 text-sm">
                    <span className="text-slate-500">Subject: </span>
                    <span className="font-medium text-slate-900">{generateSubjectPreview()}</span>
                  </div>
                  <iframe
                    srcDoc={generatePreview()}
                    className="h-[440px] w-full border-0 bg-white"
                    title="Email Preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              </CardBody>
            </Card>

            {selectedTemplate && (
              <Card className="rounded-[22px]">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <InformationCircleIcon className="h-5 w-5 text-slate-500" />
                    <CardTitle>Template Details</CardTitle>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500">Template ID</span>
                      <code className="text-slate-900">{selectedTemplate.template_id}</code>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500">Type</span>
                      <Badge variant={getTemplateTypeBadge(selectedTemplate.template_id)}>
                        {getTemplateTypeLabel(selectedTemplate.template_id)}
                      </Badge>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500">Status</span>
                      <Badge variant={selectedTemplate.active ? 'success' : 'danger'}>
                        {selectedTemplate.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500">Updated</span>
                      <span className="text-slate-900">
                        {new Date(selectedTemplate.updatedAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            <Card className="rounded-[22px]">
              <CardBody>
                <div className="flex gap-3">
                  <InformationCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-sky-500" />
                  <div className="text-sm">
                    <p className="font-medium text-slate-900">Tips</p>
                    <ul className="mt-2 space-y-1 text-slate-600">
                      <li>Use inline CSS for email compatibility.</li>
                      <li>Keep the most important content above the fold.</li>
                      <li>Variables are replaced when the message is sent.</li>
                    </ul>
                  </div>
                </div>
              </CardBody>
            </Card>
          </aside>
        </div>
      ) : (
        <Card className="rounded-[24px]">
          <CardBody className="py-12 text-center">
            <EnvelopeIcon className="mx-auto mb-4 h-12 w-12 text-slate-400" />
            <h3 className="text-lg font-medium text-slate-900">No Templates Found</h3>
            <p className="mt-2 text-slate-600">Run the seed scripts to create email templates.</p>
            <div className="mt-4 space-y-2">
              <code className="block rounded bg-slate-100 px-3 py-1 text-sm">npm run db:seed-email</code>
              <code className="block rounded bg-slate-100 px-3 py-1 text-sm">
                npm run db:seed-license-email
              </code>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
