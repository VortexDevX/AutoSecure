'use client';

import { useState, useEffect } from 'react';
import { MetaOption } from '@/lib/types/meta';
import { updateMetaOption, deleteMetaOption, reorderMetaOptions } from '@/lib/api/meta';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import {
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  Bars3Icon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';

interface MetaOptionsTableProps {
  category: string;
  options: MetaOption[];
  onUpdate: () => void;
}

export function MetaOptionsTable({ category, options, onUpdate }: MetaOptionsTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [localOptions, setLocalOptions] = useState(options);

  // Update local options when props change
  useEffect(() => {
    setLocalOptions(options);
  }, [options]);

  const handleEditClick = (option: MetaOption) => {
    setEditingId(option.id);
    setEditLabel(option.label);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editLabel.trim()) {
      toast.error('Label cannot be empty');
      return;
    }

    try {
      await updateMetaOption(id, { label: editLabel.trim() });
      toast.success('Option updated successfully');
      setEditingId(null);
      onUpdate();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update option');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditLabel('');
  };

  const handleToggleActive = async (option: MetaOption) => {
    try {
      await updateMetaOption(option.id, { active: !option.active });
      toast.success(`Option ${option.active ? 'deactivated' : 'activated'}`);
      onUpdate();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await deleteMetaOption(deleteId);
      toast.success('Option deleted successfully');
      setDeleteId(null);
      onUpdate();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete option');
    } finally {
      setIsDeleting(false);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOptions = [...localOptions];
    const draggedItem = newOptions[draggedIndex];
    newOptions.splice(draggedIndex, 1);
    newOptions.splice(index, 0, draggedItem);

    setLocalOptions(newOptions);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;

    const reorderedData = localOptions.map((option, index) => ({
      id: option.id,
      sort_order: index + 1,
    }));

    try {
      await reorderMetaOptions(category, reorderedData);
      toast.success('Order updated');
      onUpdate();
    } catch {
      toast.error('Failed to update order');
      setLocalOptions(options);
    } finally {
      setDraggedIndex(null);
    }
  };

  // A-Z Sort handler
  const handleSortAZ = async () => {
    const sorted = [...localOptions].sort((a, b) => a.value.localeCompare(b.value));
    setLocalOptions(sorted);

    const reorderedData = sorted.map((option, index) => ({
      id: option.id,
      sort_order: index + 1,
    }));

    try {
      await reorderMetaOptions(category, reorderedData);
      toast.success('Sorted A-Z successfully');
      onUpdate();
    } catch {
      toast.error('Failed to sort');
      setLocalOptions(options);
    }
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="section-label">Category</p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-900">
            {category.replace(/_/g, ' ')}
          </h2>
        </div>
        <Button onClick={handleSortAZ} variant="secondary" size="sm">
          <ArrowDownIcon className="w-4 h-4 mr-1" />
          Sort A-Z
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-3">
          <thead className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            <tr>
              <th className="w-12 px-4 py-3 text-left"></th>
              <th className="px-6 py-3 text-left">
                Value
              </th>
              <th className="px-6 py-3 text-left">
                Label
              </th>
              <th className="px-6 py-3 text-left">
                Status
              </th>
              <th className="px-6 py-3 text-left">
                Parent
              </th>
              <th className="px-6 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {localOptions.map((option, index) => (
              <tr
                key={option.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  group transition
                  ${draggedIndex === index ? 'opacity-50' : ''}
                  ${!option.active ? 'opacity-60' : ''}
                `}
              >
                <td className="cursor-move whitespace-nowrap rounded-l-[18px] border-y border-l border-slate-200/80 bg-[rgba(239,245,253,0.82)] px-4 py-3">
                  <Bars3Icon className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                </td>
                <td className="whitespace-nowrap border-y border-slate-200/80 bg-[rgba(239,245,253,0.82)] px-6 py-3">
                  <code className="rounded-full bg-slate-100 px-2.5 py-1 text-sm font-mono text-slate-900">
                    {option.value}
                  </code>
                </td>
                <td className="whitespace-nowrap border-y border-slate-200/80 bg-[rgba(239,245,253,0.82)] px-6 py-3 text-sm text-slate-900">
                  {editingId === option.id ? (
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="input h-10 max-w-[220px] px-3"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(option.id);
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                    />
                  ) : (
                    <span className="font-medium">{option.label}</span>
                  )}
                </td>
                <td className="whitespace-nowrap border-y border-slate-200/80 bg-[rgba(239,245,253,0.82)] px-6 py-3">
                  <button onClick={() => handleToggleActive(option)} className="focus:outline-none">
                    <Badge
                      variant={option.active ? 'success' : 'secondary'}
                      className="cursor-pointer"
                    >
                      {option.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </button>
                </td>
                <td className="whitespace-nowrap border-y border-slate-200/80 bg-[rgba(239,245,253,0.82)] px-6 py-3 text-sm text-slate-500">
                  {option.parent_value ? (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium">
                      {option.parent_value}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap rounded-r-[18px] border-y border-r border-slate-200/80 bg-[rgba(239,245,253,0.82)] px-6 py-3 text-right">
                  {editingId === option.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleSaveEdit(option.id)}
                        className="rounded-full border border-emerald-200 bg-emerald-50/90 p-2 text-emerald-600 transition hover:bg-emerald-100"
                        title="Save"
                      >
                        <CheckIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="rounded-full border border-slate-200 bg-slate-100/90 p-2 text-slate-600 transition hover:bg-slate-200"
                        title="Cancel"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditClick(option)}
                        className="rounded-full border border-sky-200 bg-sky-50/90 p-2 text-sky-600 transition hover:bg-sky-100"
                        title="Edit"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(option.id)}
                        className="rounded-full border border-rose-200 bg-rose-50/90 p-2 text-rose-600 transition hover:bg-rose-100"
                        title="Delete"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Meta Option"
        message="Are you sure you want to delete this option? This action cannot be undone."
        variant="danger"
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </>
  );
}
