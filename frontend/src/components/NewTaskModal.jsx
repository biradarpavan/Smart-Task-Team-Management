import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Paperclip, Info } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import API_URL from '../config';

export default function NewTaskModal({ isOpen, onClose, onTaskCreated, taskToEdit = null, projects = [], defaultProjectId = null }) {
  const { user } = useContext(AuthContext);

  // Managers and admins can assign to anyone
  // Members can only assign to other members (NOT managers/admins)
  // Everyone can assign tasks now
  const canAssign = true; 

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [assignee, setAssignee] = useState('');
  const [projectId, setProjectId] = useState('');
  const [users, setUsers] = useState([]);
  const [file, setFile] = useState(null);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/auth/users`);
        setUsers(res.data);
      } catch (err) {
        console.error('Failed to fetch users', err);
      }
    };
    if (isOpen) fetchUsers();
  }, [isOpen]);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setPriority(taskToEdit.priority || 'Medium');
      setAssignee(taskToEdit.assignee?._id || taskToEdit.assignee || '');
      setProjectId(taskToEdit.project?._id || taskToEdit.project || '');
      setAttachmentUrl(taskToEdit.attachment || '');
      setDueDate(taskToEdit.dueDate ? new Date(taskToEdit.dueDate).toISOString().split('T')[0] : '');
    } else {
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setDueDate('');
      setAssignee('');
      setProjectId(defaultProjectId || '');
      setAttachmentUrl('');
      setFile(null);
    }
    setError('');
  }, [taskToEdit, isOpen]);

  if (!isOpen) return null;

  // Filter assignable users to ONLY include those with the 'member' role
  const assignableUsers = users.filter(u => u.role === 'member');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let finalAttachment = attachmentUrl;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await axios.post(`${API_URL}/api/tasks/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalAttachment = uploadRes.data.fileUrl;
      }

      const taskData = {
        title,
        description,
        priority,
        dueDate,
        assignee: assignee || null,
        project: projectId || null,
        attachment: finalAttachment
      };

      if (taskToEdit) {
        await axios.put(`${API_URL}/api/tasks/${taskToEdit._id}`, taskData);
      } else {
        taskData.status = 'To Do';
        await axios.post(`${API_URL}/api/tasks`, taskData);
      }
      onTaskCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{taskToEdit ? 'Edit Task' : 'Create New Task'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center space-x-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-3 py-2 text-sm">
              <Info size={14} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Task Title *</label>
            <input
              required
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 transition-all outline-none dark:text-white"
              placeholder="E.g., Design Landing Page"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows="2"
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 transition-all outline-none resize-none dark:text-white"
              placeholder="Add some details..."
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Assign To
                <span className="ml-1.5 text-xs font-normal bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">Members list</span>
              </label>
              <select
                value={assignee}
                onChange={e => setAssignee(e.target.value)}
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 transition-all outline-none dark:text-white"
              >
                <option value="">Unassigned</option>
                {assignableUsers.map(u => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Project</label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 transition-all outline-none dark:text-white"
              >
                <option value="">No Project (Inbox)</option>
                {projects.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 transition-all outline-none dark:text-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 transition-all outline-none dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Attachment</label>
              <div className="flex items-center w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 overflow-hidden">
                <input
                  type="file"
                  onChange={e => setFile(e.target.files[0])}
                  className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>
              {attachmentUrl && !file && (
                <div className="mt-1 flex items-center space-x-1 text-xs text-indigo-500">
                  <Paperclip size={12} /> <span>Current File Attached</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-md active:scale-95 disabled:opacity-70">
              {loading ? 'Saving...' : (taskToEdit ? 'Save Changes' : 'Create Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
