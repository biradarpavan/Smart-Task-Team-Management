import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Hash, Layout, Folder, ChevronRight, MoreVertical, PlusCircle, Trash2, LogOut, Settings } from 'lucide-react';
import API_URL from '../config';

export default function Sidebar({ user, activeProject, onSelectProject, projects, onProjectCreated, onProjectDeleted, onLogout, onProfileClick }) {
  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager';
  const [isAdding, setIsAdding] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    try {
      const res = await axios.post(`${API_URL}/api/projects`, {
        name: newProjectName,
        color: '#' + Math.floor(Math.random()*16777215).toString(16) // Random color
      });
      onProjectCreated(res.data);
      setNewProjectName('');
      setIsAdding(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async (e, projectId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure? This will NOT delete tasks, but they will become unassigned to this project.')) return;
    try {
      await axios.delete(`${API_URL}/api/projects/${projectId}`);
      onProjectDeleted(projectId);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <aside className="w-64 bg-[#1e293b] dark:bg-gray-900 text-gray-300 flex flex-col h-screen border-r border-gray-800 transition-all duration-300 overflow-hidden shrink-0">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Layout className="text-white" size={20} />
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">
            Workspace
          </h3>
          <button
            onClick={() => onSelectProject(null)}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${activeProject === null ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-gray-800'}`}
          >
            <Layout size={18} />
            <span className="font-medium">All Tasks</span>
          </button>
        </div>

        {/* Projects Section */}
        <div>
          <div className="flex justify-between items-center mb-4 px-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Projects
            </h3>
            {isManagerOrAdmin && (
              <button 
                onClick={() => setIsAdding(true)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <Plus size={16} />
              </button>
            )}
          </div>

          <div className="space-y-1">
            {projects.map((project) => (
              <button
                key={project._id}
                onClick={() => onSelectProject(project)}
                className={`w-full flex items-center justify-between group px-3 py-2 rounded-lg transition-all ${activeProject?._id === project._id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'hover:bg-gray-800 text-gray-400'}`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
                  <span className="font-medium truncate">{project.name}</span>
                </div>
                {isManagerOrAdmin && (
                  <button 
                    onClick={(e) => handleDeleteProject(e, project._id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition-all p-1"
                    title="Delete Project"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </button>
            ))}

            {isAdding && isManagerOrAdmin ? (
              <form onSubmit={handleAddProject} className="mt-2 px-2 animate-in slide-in-from-top-2 duration-200">
                <input
                  autoFocus
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Project name..."
                  className="w-full bg-gray-800 border border-indigo-500/50 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  onBlur={() => !newProjectName && setIsAdding(false)}
                />
              </form>
            ) : isManagerOrAdmin ? (
              <button 
                onClick={() => setIsAdding(true)}
                className="w-full flex items-center space-x-3 px-3 py-2 text-gray-500 hover:text-gray-300 transition-colors text-sm"
              >
                <PlusCircle size={14} />
                <span>Add Project</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="mt-auto p-4 bg-black/20 border-t border-gray-800">
        <div className="flex items-center justify-between group">
          <button 
            onClick={onProfileClick}
            className="flex items-center space-x-3 px-2 flex-1 hover:bg-white/5 py-2 rounded-lg transition-colors"
          >
            <div className="relative">
              <div className="w-2 h-2 bg-green-500 rounded-full absolute bottom-0 right-0 border-2 border-[#1e293b]" />
              <img 
                src={user?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                className="w-9 h-9 rounded-lg object-cover border border-gray-700"
                alt="Profile" 
              />
            </div>
            <div className="truncate text-left">
              <p className="text-xs font-bold text-white truncate leading-none mb-1">{user?.name || 'User Name'}</p>
              <p className="text-[10px] text-gray-500 truncate uppercase tracking-tighter">{user?.role || 'Team Member'}</p>
            </div>
          </button>
          <button 
            onClick={onLogout}
            className="p-2 text-gray-500 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
