import React, { useContext, useState, useEffect, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import axios from 'axios';
import { io } from 'socket.io-client';
import NewTaskModal from './NewTaskModal';
import EditProfileModal from './EditProfileModal';
import AnalyticsModal from './AnalyticsModal';
import TaskDetailModal from './TaskDetailModal';
import NotificationBell from './NotificationBell';
import ChatPanel from './ChatPanel';
import Sidebar from './Sidebar';
import Toast from './Toast';
import { Edit2, Trash2, Search, Filter, Moon, Sun, BarChart2, Bell, Paperclip, User, Layout } from 'lucide-react';
import API_URL from '../config';

const COLUMNS = ['To Do', 'In Progress', 'Review', 'Done'];

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [memberFilter, setMemberFilter] = useState('All');
  const [showRemainingOnly, setShowRemainingOnly] = useState(false);
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // Toast helpers
  const addToast = useCallback((type, title, message, duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, title, message, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Dark Mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    fetchTasks();
    fetchUsers();
    fetchProjects();
    const socket = io(API_URL);
    socket.on('task_updated', fetchTasks);
    return () => socket.disconnect();
  }, [activeProject]);

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/projects`);
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/users`);
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTasks = async () => {
    try {
      let url = `${API_URL}/api/tasks`;
      if (activeProject) {
        url += `?projectId=${activeProject._id}`; // Filter for specific project
      }
      const res = await axios.get(url);
      setTasks(res.data);
    } catch (err) {
      addToast('error', 'Sync Failed', 'Could not load tasks from server.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await axios.delete(`${API_URL}/api/tasks/${taskId}`);
      fetchTasks();
      addToast('success', 'Task Deleted', 'The task was removed successfully.');
    } catch (err) {
      addToast('error', 'Delete Failed', 'Could not delete the task.');
    }
  };

  const openEditModal = (task) => { setTaskToEdit(task); setIsModalOpen(true); };
  const openCreateModal = () => { setTaskToEdit(null); setIsModalOpen(true); };

  const handleRemindTask = async (e, task) => {
    e.stopPropagation();
    if (!task.assignee) {
      addToast('warning', 'No Assignee', 'Assign this task to a member before sending a reminder.');
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/api/tasks/${task._id}/remind`);
      addToast('success', '🔔 Reminder Sent!', `${res.data.recipientName} will see this notification in their bell when they are online or next time they log in.`, 5000);
    } catch (err) {
      addToast('error', 'Failed', err.response?.data?.message || 'Could not send reminder.');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':   return 'bg-red-100 text-red-700';
      case 'Medium': return 'bg-yellow-100 text-yellow-700';
      case 'Low':    return 'bg-green-100 text-green-700';
      default:       return 'bg-gray-100 text-gray-700';
    }
  };

  // canEditTask: blocks only the ASSIGNEE from editing/deleting
  // Drag (status update) is allowed for everyone including the assignee
  const canEditTask = (task) => {
    const currentId  = String(user?.id || user?._id);
    const creatorId  = task.createdBy ? String(task.createdBy?._id || task.createdBy) : null;
    const assigneeId = task.assignee  ? String(task.assignee?._id  || task.assignee)  : null;

    // Admins and managers can always edit anything
    if (user?.role === 'admin' || user?.role === 'manager') return true;

    // Legacy task with no createdBy → allow everyone
    if (!creatorId) return true;

    // Creator can ALWAYS edit their own task
    if (currentId === creatorId) return true;

    // Assignee but NOT creator → cannot edit or delete, only drag status
    if (assigneeId && currentId === assigneeId) return false;

    return true;
  };

  const onDragStart = () => setIsDragging(true);
  const onDragEnd = async (result) => {
    setIsDragging(false);
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // ALL users (including assignees) can drag to update status
    const draggedTask = tasks.find(t => t._id === draggableId);

    const newTasks = [...tasks];
    const taskIndex = newTasks.findIndex(t => t._id === draggableId);
    const movedTask = newTasks[taskIndex];
    newTasks[taskIndex] = { ...movedTask, status: destination.droppableId };
    setTasks(newTasks);

    try {
      await axios.put(`${API_URL}/api/tasks/${draggableId}`, { status: destination.droppableId });
      addToast('success', 'Status Updated', `"${movedTask.title}" moved to ${destination.droppableId}.`, 2500);
    } catch (err) {
      fetchTasks();
      addToast('error', 'Update Failed', 'Could not move task. Reverting...');
    }
  };

  return (
    <div className="flex h-screen bg-light dark:bg-gray-900 text-dark dark:text-gray-100 overflow-hidden transition-colors duration-300">
      
      {/* Sidebar Navigation */}
      <Sidebar 
        user={user}
        projects={projects} 
        activeProject={activeProject} 
        onSelectProject={setActiveProject}
        onProjectCreated={(newProj) => { setProjects([newProj, ...projects]); setActiveProject(newProj); }}
        onProjectDeleted={(projId) => { setProjects(projects.filter(p => p._id !== projId)); if(activeProject?._id === projId) setActiveProject(null); }}
        onLogout={handleLogout}
        onProfileClick={() => setIsProfileModalOpen(true)}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Toast Notifications */}
        <Toast toasts={toasts} removeToast={removeToast} />

        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 z-10">
          {/* Left: Project Info */}
          <div className="flex items-center space-x-4 w-1/3">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 tracking-tight">
              {activeProject ? activeProject.name : 'All Tasks'}
            </h1>
            {activeProject && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold border border-indigo-100 dark:border-indigo-800 uppercase tracking-wider">
                Project View
              </span>
            )}
          </div>

          {/* Middle: App Title */}
          <div className="flex-1 flex justify-center">
            <span className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-[0.2em] whitespace-nowrap">
              Smart Task <span className="text-indigo-600">Team Management</span>
            </span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-4 w-1/3 justify-end">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-gray-500" />}
            </button>
            <NotificationBell />
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-1" />
            <div className="flex items-center space-x-3">
              <div className="text-right hidden lg:block">
                <p className="text-xs font-bold text-gray-900 dark:text-white">{user?.name}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-tighter font-semibold">{user?.role}</p>
              </div>
              <img
                src={user?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                alt="Profile"
                className="w-9 h-9 rounded-full border-2 border-indigo-500/20 shadow-sm cursor-pointer hover:scale-105 transition-transform"
                onClick={() => setIsProfileModalOpen(true)}
              />
            </div>
          </div>
        </header>

      {/* Main Area */}
      <main className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC] dark:bg-gray-900">
        <div className="max-w-7xl mx-auto flex flex-col">
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 space-y-4 md:space-y-0">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight flex items-center space-x-3">
                {activeProject ? (
                  <>
                    <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: activeProject.color }} />
                    <span>{activeProject.name}</span>
                  </>
                ) : (
                  <span>All Tasks Workspace</span>
                )}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                Team workflow. {activeProject ? `Tasks for ${activeProject.name}.` : 'Viewing all tasks across the workspace.'}
              </p>
            </div>
            <div className="flex items-center space-x-3 w-full md:w-auto flex-wrap gap-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white text-sm w-44"
                />
              </div>
              <div className="relative">
                <select
                  value={priorityFilter}
                  onChange={e => setPriorityFilter(e.target.value)}
                  className="pl-3 pr-8 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white appearance-none text-sm"
                >
                  <option value="All">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <Filter className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
              </div>

              {/* Member Filter */}
              <div className="relative">
                <select
                  value={memberFilter}
                  onChange={e => setMemberFilter(e.target.value)}
                  className="pl-3 pr-8 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white appearance-none text-sm min-w-[120px]"
                >
                  <option value="All">All Members</option>
                  {users.map(u => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>
                <User className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
              </div>

              {/* Remaining Tasks Toggle */}
              <button
                onClick={() => setShowRemainingOnly(!showRemainingOnly)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm border transition-all ${
                  showRemainingOnly 
                    ? 'bg-amber-100 border-amber-300 text-amber-700 shadow-inner' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200'
                }`}
              >
                {showRemainingOnly ? 'Showing Pending' : 'Show Pending'}
              </button>

              <button onClick={() => setIsAnalyticsOpen(true)} className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">
                <BarChart2 size={16} /><span>Analytics</span>
              </button>
              <button onClick={openCreateModal} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2 rounded-lg font-semibold flex items-center space-x-2 shadow-md hover:shadow-indigo-500/30 active:scale-95 transition-all text-sm whitespace-nowrap">
                <span className="text-base leading-none">+</span><span>New Task</span>
              </button>
            </div>
          </div>

          {/* Kanban Board */}
          <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {COLUMNS.map(column => {
                // If "Show Pending" is ON, we only show To Do, In Progress, Review columns (or hide Done)
                if (showRemainingOnly && column === 'Done') return null;

                const columnTasks = tasks
                  .filter(t => t.status === column)
                  .filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()) || t.description?.toLowerCase().includes(searchTerm.toLowerCase()))
                  .filter(t => priorityFilter === 'All' ? true : t.priority === priorityFilter)
                  .filter(t => {
                    if (memberFilter === 'All') return true;
                    return t.assignee?._id === memberFilter;
                  });

                return (
                  <div key={column} className="bg-gray-200/60 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-200/60 dark:border-gray-700 flex flex-col min-h-[500px]">
                    <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center justify-between text-xs uppercase tracking-widest">
                      {column}
                      <span className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs py-0.5 px-2.5 rounded-full font-bold border border-gray-200 dark:border-gray-600">
                        {columnTasks.length}
                      </span>
                    </h3>

                    <Droppable droppableId={column}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 rounded-xl transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-50/60 dark:bg-indigo-900/20' : ''}`}
                        >
                          {columnTasks.map((task, index) => (
                            <Draggable key={task._id} draggableId={task._id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => !isDragging && setSelectedTask(task)}
                                  className={`relative bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-3 group cursor-pointer transition-all ${
                                    snapshot.isDragging
                                      ? 'shadow-xl scale-105 border-indigo-400 ring-2 ring-indigo-500/30 rotate-1'
                                      : 'hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-500/50'
                                  }`}
                                >
                                  {/* Edit/Delete/Bell — only for creator, manager, admin. Assignees can only drag. */}
                                  {canEditTask(task) && (
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 z-10">
                                      {/* Only show bell if there is an assignee AND it's not a self-assigned task */}
                                      {task.assignee && String(task.assignee._id || task.assignee) !== String(task.createdBy?._id || task.createdBy) && (
                                        <button
                                          onClick={e => handleRemindTask(e, task)}
                                          className="p-1.5 text-gray-400 hover:text-yellow-600 bg-white dark:bg-gray-700 rounded-lg shadow-sm transition-colors border border-gray-100 dark:border-gray-600"
                                          title="Send Reminder to Assignee"
                                        >
                                          <Bell size={13} />
                                        </button>
                                      )}
                                      <button
                                        onClick={e => { e.stopPropagation(); openEditModal(task); }}
                                        className="p-1.5 text-gray-400 hover:text-indigo-600 bg-white dark:bg-gray-700 rounded-lg shadow-sm transition-colors border border-gray-100 dark:border-gray-600"
                                        title="Edit Task"
                                      >
                                        <Edit2 size={13} />
                                      </button>
                                      <button
                                        onClick={e => { e.stopPropagation(); handleDeleteTask(task._id); }}
                                        className="p-1.5 text-gray-400 hover:text-red-600 bg-white dark:bg-gray-700 rounded-lg shadow-sm transition-colors border border-gray-100 dark:border-gray-600"
                                        title="Delete Task"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  )}

                                  {/* Drag-only badge for assignees — they can drag but not edit */}
                                  {!canEditTask(task) && (
                                    <span className="absolute top-2 right-2 text-[10px] bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-semibold border border-amber-200 dark:border-amber-800">Drag only</span>
                                  )}

                                  <p className="font-bold text-gray-800 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors pr-16 text-sm">{task.title}</p>
                                  {task.description && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2 leading-snug">{task.description}</p>
                                  )}

                                  <div className="mt-3 flex justify-between items-center">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                                    {task.dueDate && (
                                      <span className={`text-xs font-medium ${new Date(task.dueDate) < new Date() && task.status !== 'Done' ? 'text-red-500' : 'text-gray-400'}`}>
                                        {new Date(task.dueDate).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>

                                  {/* Assignee + Attachment + Assigned-by row */}
                                  <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-700">
                                    {/* Only show 'Assigned by' if the creator is NOT the current user */}
                                    {task.assignee && task.createdBy && String(task.createdBy._id || task.createdBy) !== String(user?.id || user?._id) && (
                                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mb-1.5">
                                        Assigned by <span className="font-bold text-gray-500 dark:text-gray-400">{task.createdBy.name}</span>
                                      </p>
                                    )}
                                    <div className="flex justify-between items-center">
                                      {task.assignee ? (
                                        <div className="flex items-center space-x-1.5">
                                          <img src={task.assignee.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="avatar" className="w-5 h-5 rounded-full border border-gray-200 dark:border-gray-600 object-cover" />
                                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate max-w-[70px]">{task.assignee.name}</span>
                                        </div>
                                      ) : (
                                        <span className="text-xs text-gray-400 italic">Unassigned</span>
                                      )}
                                      {task.attachment && (
                                        <a href={task.attachment} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 flex items-center space-x-1" title="View Attachment">
                                          <Paperclip size={12} /><span className="text-xs font-semibold">File</span>
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        </div>
      </main>

      {/* Modals */}
      <NewTaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onTaskCreated={() => { fetchTasks(); addToast('success', 'Task Saved', taskToEdit ? 'Task updated successfully.' : 'New task created!'); }} 
        taskToEdit={taskToEdit} 
        projects={projects}
        defaultProjectId={activeProject?._id}
      />
      <EditProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
      <AnalyticsModal isOpen={isAnalyticsOpen} onClose={() => setIsAnalyticsOpen(false)} tasks={tasks} />
      <TaskDetailModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onEdit={task => { openEditModal(task); }}
        onDelete={handleDeleteTask}
        canEdit={selectedTask ? canEditTask(selectedTask) : false}
      />
      <ChatPanel />
    </div>
  </div>
);
}
