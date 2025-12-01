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
    } catch (error: any) {
      toast.error('Failed to update order');
      setLocalOptions(options);
    } finally {
      setDraggedIndex(null);
    }
  };

  return (
    <>
      <div className="overflow-x-auto -mx-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-12 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"></th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Label
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Parent
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {localOptions.map((option, index) => (
              <tr
                key={option.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  hover:bg-gray-50 transition-colors group
                  ${draggedIndex === index ? 'opacity-50 bg-blue-50' : ''}
                  ${!option.active ? 'bg-gray-50 opacity-60' : ''}
                `}
              >
                <td className="px-4 py-4 whitespace-nowrap cursor-move">
                  <Bars3Icon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <code className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                    {option.value}
                  </code>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {editingId === option.id ? (
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="px-2 py-1 border border-primary rounded focus:ring-2 focus:ring-primary w-full max-w-[200px]"
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
                <td className="px-6 py-4 whitespace-nowrap">
                  <button onClick={() => handleToggleActive(option)} className="focus:outline-none">
                    <Badge
                      variant={option.active ? 'success' : 'secondary'}
                      className="cursor-pointer"
                    >
                      {option.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {option.parent_value ? (
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">
                      {option.parent_value}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {editingId === option.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleSaveEdit(option.id)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Save"
                      >
                        <CheckIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Cancel"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditClick(option)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(option.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
