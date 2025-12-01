'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/context/AuthContext';
import { useRequireOwner } from '@/lib/hooks/useRequireRole';
import { AccessDenied } from '@/components/admin/AccessDenied';
import { getEmailTemplates, updateEmailTemplate } from '@/lib/api/emailTemplates';
import { EmailTemplate, TEMPLATE_VARIABLES, TemplateVariable } from '@/lib/types/emailTemplate';
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
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function EmailTemplatesPage() {
  const { user } = useAuth();
  const router = useRouter();

  const { isAuthorized, isCheckingAuth } = useRequireOwner();

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  // Editor state
  const [editSubject, setEditSubject] = useState('');
  const [editBodyHtml, setEditBodyHtml] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // UI state
  const [showPreview, setShowPreview] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    policy: true,
    customer: true,
    vehicle: true,
    company: true,
  });
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);

  // Check if user is owner
  useEffect(() => {
    if (user && user.role !== 'owner') {
      toast.error('Only owners can access email templates');
      router.push('/dashboard');
    }
  }, [user, router]);

  // Fetch templates
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Track changes
  useEffect(() => {
    if (selectedTemplate) {
      const subjectChanged = editSubject !== selectedTemplate.subject;
      const bodyChanged = editBodyHtml !== selectedTemplate.body_html;
      setHasChanges(subjectChanged || bodyChanged);
    }
  }, [editSubject, editBodyHtml, selectedTemplate]);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const data = await getEmailTemplates();
      setTemplates(data);

      // Auto-select first template
      if (data.length > 0) {
        selectTemplate(data[0]);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const selectTemplate = (template: EmailTemplate) => {
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

      // Update local state
      setTemplates((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
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
    if (selectedTemplate) {
      setEditSubject(selectedTemplate.subject);
      setEditBodyHtml(selectedTemplate.body_html);
      setHasChanges(false);
    }
  };

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable);
    setCopiedVariable(variable);
    toast.success(`Copied ${variable}`);
    setTimeout(() => setCopiedVariable(null), 2000);
  };

  const insertVariable = (variable: string) => {
    // Insert at cursor position in textarea
    const textarea = document.getElementById('html-editor') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = editBodyHtml.substring(0, start) + variable + editBodyHtml.substring(end);
      setEditBodyHtml(newValue);

      // Restore cursor position after variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Generate preview with sample data
  const generatePreview = useCallback(() => {
    let preview = editBodyHtml;

    // Replace all variables with sample data
    TEMPLATE_VARIABLES.forEach((variable) => {
      const regex = new RegExp(variable.key.replace(/[{}]/g, '\\$&'), 'g');
      preview = preview.replace(regex, variable.example);
    });

    return preview;
  }, [editBodyHtml]);

  // Group variables by section
  const groupedVariables = TEMPLATE_VARIABLES.reduce(
    (acc, variable) => {
      if (!acc[variable.section]) {
        acc[variable.section] = [];
      }
      acc[variable.section].push(variable);
      return acc;
    },
    {} as Record<string, TemplateVariable[]>
  );

  const sectionLabels: Record<string, { label: string; icon: string }> = {
    policy: { label: 'Policy Details', icon: '📋' },
    customer: { label: 'Customer Details', icon: '👤' },
    vehicle: { label: 'Vehicle Details', icon: '🚗' },
    company: { label: 'Company Info', icon: '🏢' },
  };

  if (isCheckingAuth || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton height={32} width={200} />
          <Skeleton height={40} width={100} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton height={600} className="lg:col-span-2" />
          <Skeleton height={600} />
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <AccessDenied message="Only owners can manage email templates." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-600 mt-1">Customize the email template sent to customers</p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-sm text-amber-600 font-medium">Unsaved changes</span>
          )}
          <Button variant="ghost" onClick={handleReset} disabled={!hasChanges || isSaving}>
            Reset
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={isSaving}
            disabled={!hasChanges}
          >
            <CheckIcon className="w-4 h-4 mr-2" />
            Save Template
          </Button>
        </div>
      </div>

      {/* Template Selector (if multiple templates in future) */}
      {templates.length > 1 && (
        <div className="flex gap-2">
          {templates.map((template) => (
            <button
              key={template._id}
              onClick={() => selectTemplate(template)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${
                  selectedTemplate?._id === template._id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {template.name}
            </button>
          ))}
        </div>
      )}

      {selectedTemplate && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor Panel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Subject Editor */}
            <Card>
              <CardBody>
                <Input
                  label="Email Subject"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  placeholder="Enter email subject..."
                  helpText="Use variables like {{policy_no}}, {{customer}} in the subject"
                />
              </CardBody>
            </Card>

            {/* HTML Editor */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <CodeBracketIcon className="w-5 h-5 text-gray-500" />
                  <CardTitle>HTML Template</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)}>
                  <EyeIcon className="w-4 h-4 mr-2" />
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </Button>
              </CardHeader>
              <CardBody className="p-0">
                <textarea
                  id="html-editor"
                  value={editBodyHtml}
                  onChange={(e) => setEditBodyHtml(e.target.value)}
                  className="w-full h-[500px] p-4 font-mono text-sm border-0 focus:ring-0 resize-none bg-gray-50"
                  placeholder="Enter HTML template..."
                  spellCheck={false}
                />
              </CardBody>
            </Card>

            {/* Preview Panel */}
            {showPreview && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <EyeIcon className="w-5 h-5 text-gray-500" />
                    <CardTitle>Live Preview</CardTitle>
                  </div>
                  <CardDescription>
                    This is how the email will look with sample data
                  </CardDescription>
                </CardHeader>
                <CardBody className="p-0">
                  <div className="border-t border-gray-200">
                    <div className="bg-gray-100 px-4 py-2 text-sm">
                      <span className="text-gray-500">Subject: </span>
                      <span className="text-gray-900 font-medium">
                        {TEMPLATE_VARIABLES.reduce(
                          (subj, v) =>
                            subj.replace(
                              new RegExp(v.key.replace(/[{}]/g, '\\$&'), 'g'),
                              v.example
                            ),
                          editSubject
                        )}
                      </span>
                    </div>
                    <iframe
                      srcDoc={generatePreview()}
                      className="w-full h-[600px] border-0"
                      title="Email Preview"
                      sandbox="allow-same-origin"
                    />
                  </div>
                </CardBody>
              </Card>
            )}
          </div>

          {/* Variables Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5 text-gray-500" />
                  <CardTitle>Available Variables</CardTitle>
                </div>
                <CardDescription>Click to copy, double-click to insert at cursor</CardDescription>
              </CardHeader>
              <CardBody className="p-0">
                <div className="divide-y divide-gray-100">
                  {Object.entries(groupedVariables).map(([section, variables]) => (
                    <div key={section}>
                      <button
                        onClick={() => toggleSection(section)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <span className="flex items-center gap-2 font-medium text-gray-900">
                          <span>{sectionLabels[section]?.icon}</span>
                          {sectionLabels[section]?.label || section}
                          <Badge variant="secondary" className="ml-2">
                            {variables.length}
                          </Badge>
                        </span>
                        {expandedSections[section] ? (
                          <ChevronUpIcon className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                        )}
                      </button>

                      {expandedSections[section] && (
                        <div className="px-4 pb-3 space-y-1">
                          {variables.map((variable) => (
                            <button
                              key={variable.key}
                              onClick={() => copyVariable(variable.key)}
                              onDoubleClick={() => insertVariable(variable.key)}
                              className={`
                                w-full flex items-center justify-between px-3 py-2 rounded-lg text-left
                                transition-colors group
                                ${
                                  copiedVariable === variable.key
                                    ? 'bg-green-50 border border-green-200'
                                    : 'hover:bg-gray-100 border border-transparent'
                                }
                              `}
                            >
                              <div className="min-w-0 flex-1">
                                <code className="text-sm text-primary font-medium">
                                  {variable.key}
                                </code>
                                <p className="text-xs text-gray-500 truncate">{variable.label}</p>
                              </div>
                              <div className="flex-shrink-0 ml-2">
                                {copiedVariable === variable.key ? (
                                  <CheckIcon className="w-4 h-4 text-green-600" />
                                ) : (
                                  <ClipboardIcon className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Help Card */}
            <Card>
              <CardBody>
                <div className="flex gap-3">
                  <InformationCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-gray-900 mb-2">Tips:</p>
                    <ul className="text-gray-600 space-y-1">
                      <li>• Use inline CSS for email compatibility</li>
                      <li>• Test with different email clients</li>
                      <li>• Keep important content above the fold</li>
                      <li>• Variables are replaced when sending</li>
                    </ul>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Template Info */}
            <Card>
              <CardBody>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Template ID</span>
                    <code className="text-gray-900">{selectedTemplate.template_id}</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <Badge variant={selectedTemplate.active ? 'success' : 'danger'}>
                      {selectedTemplate.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Updated</span>
                    <span className="text-gray-900">
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
          </div>
        </div>
      )}

      {/* No Templates Message */}
      {!isLoading && templates.length === 0 && (
        <Card>
          <CardBody className="text-center py-12">
            <EnvelopeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Found</h3>
            <p className="text-gray-600 mb-4">
              Run the seed script to create the default email template.
            </p>
            <code className="bg-gray-100 px-3 py-1 rounded text-sm">npm run db:seed-email</code>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
