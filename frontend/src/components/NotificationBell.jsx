import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Bell, CheckCheck, Trash2, Clock } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import API_URL from '../config';

export default function NotificationBell({ addToast }) {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();

    // Listen for real-time notifications via socket
    const socket = io(API_URL);
    const userId = user?.id || user?._id;

    socket.on(`notification_${userId}`, (data) => {
      // Show toast immediately if online
      addToast('info', '🔔 New Reminder', data.message, 5000);
      // Refresh the notification list
      fetchNotifications();
    });

    return () => socket.disconnect();
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/notifications`);
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`${API_URL}/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.put(`${API_URL}/api/notifications/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API_URL}/api/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchNotifications(); }}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Notifications"
      >
        <Bell size={20} className={`${unreadCount > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'} transition-colors`} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center space-x-2">
              <Bell size={16} className="text-indigo-600 dark:text-indigo-400" />
              <span className="font-bold text-gray-800 dark:text-white text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="flex items-center space-x-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold" title="Mark all as read">
                <CheckCheck size={14} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500 space-y-2">
                <Bell size={32} className="opacity-30" />
                <p className="text-sm font-medium">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n._id}
                  onClick={() => !n.isRead && markAsRead(n._id)}
                  className={`flex items-start space-x-3 px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 cursor-pointer group transition-colors ${
                    n.isRead
                      ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                      : 'bg-indigo-50/60 dark:bg-indigo-900/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                  }`}
                >
                  {/* Unread dot */}
                  <div className="flex-shrink-0 mt-1.5">
                    {n.isRead
                      ? <div className="w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-600" />
                      : <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    }
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {n.sender && (
                      <div className="flex items-center space-x-1.5 mb-1">
                        <img src={n.sender.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="" className="w-4 h-4 rounded-full object-cover" />
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{n.sender.name}</span>
                      </div>
                    )}
                    <p className={`text-xs leading-snug ${n.isRead ? 'text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200 font-medium'}`}>
                      {n.message}
                    </p>
                    <div className="flex items-center space-x-1 mt-1.5">
                      <Clock size={10} className="text-gray-400" />
                      <span className="text-[10px] text-gray-400">{timeAgo(n.createdAt)}</span>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={e => deleteNotification(n._id, e)}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                    title="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-400 text-center">{notifications.length} total notification{notifications.length !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
