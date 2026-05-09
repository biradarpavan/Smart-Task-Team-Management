import React from 'react';
import { X, Calendar, Flag, User, Paperclip, Clock, CheckCircle2, AlertCircle, Circle, Loader } from 'lucide-react';

const STATUS_ICONS = {
  'To Do': <Circle size={16} className="text-gray-400" />,
  'In Progress': <Loader size={16} className="text-blue-500 animate-spin" />,
  'Review': <AlertCircle size={16} className="text-yellow-500" />,
  'Done': <CheckCircle2 size={16} className="text-green-500" />,
};

const PRIORITY_STYLES = {
  High:   { badge: 'bg-red-100 text-red-700 border border-red-200', dot: 'bg-red-500' },
  Medium: { badge: 'bg-yellow-100 text-yellow-700 border border-yellow-200', dot: 'bg-yellow-500' },
  Low:    { badge: 'bg-green-100 text-green-700 border border-green-200', dot: 'bg-green-500' },
};

export default function TaskDetailModal({ task, onClose, onEdit, onDelete, canEdit = true }) {
  if (!task) return null;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';
  const priority = PRIORITY_STYLES[task.priority] || { badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Coloured top bar based on priority */}
        <div className={`h-1.5 w-full ${task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-yellow-400' : 'bg-green-500'}`} />

        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex justify-between items-start">
          <div className="flex-1 pr-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white leading-snug">{task.title}</h2>
            <div className="flex items-center space-x-2 mt-2">
              {STATUS_ICONS[task.status]}
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{task.status}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mt-1">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-2 space-y-5">
          {/* Description */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 min-h-[80px]">
            {task.description
              ? <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{task.description}</p>
              : <p className="text-gray-400 dark:text-gray-500 text-sm italic">No description added.</p>
            }
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center space-x-1"><Flag size={12}/><span>Priority</span></span>
              <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold w-fit ${priority.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`}></span>
                <span>{task.priority || 'None'}</span>
              </span>
            </div>

            {/* Due Date */}
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center space-x-1"><Calendar size={12}/><span>Due Date</span></span>
              {task.dueDate ? (
                <span className={`text-sm font-semibold ${isOverdue ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                  {isOverdue && '⚠️ '}
                  {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {isOverdue && <span className="ml-1.5 text-xs font-normal text-red-400">(Overdue)</span>}
                </span>
              ) : (
                <span className="text-sm text-gray-400 italic">No due date</span>
              )}
            </div>

            {/* Assignee */}
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center space-x-1"><User size={12}/><span>Assigned To</span></span>
              {task.assignee ? (
                <div className="flex items-center space-x-2">
                  <img src={task.assignee.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="avatar" className="w-7 h-7 rounded-full border-2 border-indigo-100 dark:border-indigo-900 object-cover" />
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{task.assignee.name}</p>
                    <p className="text-xs text-gray-400">{task.assignee.email}</p>
                  </div>
                </div>
              ) : (
                <span className="text-sm text-gray-400 italic">Unassigned</span>
              )}
            </div>

            {/* Created At */}
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center space-x-1"><Clock size={12}/><span>Created</span></span>
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                {new Date(task.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Attachment */}
          {task.attachment && (
            <div className="flex items-center space-x-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 border border-indigo-100 dark:border-indigo-800/40">
              <Paperclip size={18} className="text-indigo-500 flex-shrink-0" />
              <a
                href={task.attachment}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold hover:underline truncate"
              >
                View Attached File
              </a>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center mt-2">
          <div>
            {canEdit ? (
              <button
                onClick={() => { onDelete(task._id); onClose(); }}
                className="text-red-500 hover:text-red-700 text-sm font-semibold hover:underline underline-offset-4 transition-colors"
              >
                Delete Task
              </button>
            ) : (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                🔒 You can drag this task to update its status
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              Close
            </button>
            {canEdit && (
              <button
                onClick={() => { onEdit(task); onClose(); }}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Edit Task
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
