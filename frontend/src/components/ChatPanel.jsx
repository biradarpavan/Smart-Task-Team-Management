import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { MessageSquare, X, Send, Users, User, ChevronRight, Minimize2, Maximize2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import API_URL from '../config';

const socket = io(API_URL);

export default function ChatPanel() {
  const { user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState('group'); // 'group' or userId
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      if (activeTab === 'group') {
        fetchGroupMessages();
      } else {
        fetchPrivateMessages(activeTab);
      }
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Socket listeners
    socket.on('receive_message', (msg) => {
      if (activeTab === 'group') {
        setMessages((prev) => [...prev, msg]);
      }
    });

    if (user) {
      const userId = user.id || user._id;
      socket.on(`receive_private_${userId}`, (msg) => {
        if (activeTab === msg.sender._id || activeTab === msg.recipient) {
          setMessages((prev) => [...prev, msg]);
        }
      });
    }

    return () => {
      socket.off('receive_message');
      if (user) {
        socket.off(`receive_private_${user.id || user._id}`);
      }
    };
  }, [activeTab, user]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/users`);
      setUsers(res.data.filter(u => u._id !== (user.id || user._id)));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGroupMessages = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/chat/group`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPrivateMessages = async (otherUserId) => {
    try {
      const res = await axios.get(`${API_URL}/api/chat/private/${otherUserId}`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const msgData = {
      senderId: user.id || user._id,
      content: input,
      isGroup: activeTab === 'group',
      recipientId: activeTab === 'group' ? null : activeTab
    };

    socket.emit('send_message', msgData);
    setInput('');
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:bg-indigo-700 transition-all z-50 flex items-center space-x-2 group"
      >
        <MessageSquare size={24} />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-semibold whitespace-nowrap">Team Chat</span>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 w-96 ${isMinimized ? 'h-14' : 'h-[500px]'} bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-50 transition-all duration-300`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-indigo-600 rounded-t-2xl text-white">
        <div className="flex items-center space-x-2">
          <MessageSquare size={20} />
          <span className="font-bold">
            {activeTab === 'group' ? 'Group Chat' : `Chat with ${selectedUser?.name}`}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-white/20 rounded transition-colors">
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar (User List) */}
            <div className="w-20 border-r border-gray-100 dark:border-gray-700 overflow-y-auto flex flex-col items-center py-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
              <button 
                onClick={() => { setActiveTab('group'); setSelectedUser(null); }}
                className={`p-2 rounded-xl transition-all ${activeTab === 'group' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                title="Group Chat"
              >
                <Users size={24} />
              </button>
              <div className="w-10 h-px bg-gray-200 dark:bg-gray-700" />
              {users.map(u => (
                <button
                  key={u._id}
                  onClick={() => { setActiveTab(u._id); setSelectedUser(u); }}
                  className={`relative p-0.5 rounded-full border-2 transition-all ${activeTab === u._id ? 'border-indigo-600 scale-110 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}
                  title={u.name}
                >
                  <img src={u.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-10 h-10 rounded-full object-cover" alt={u.name} />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                </button>
              ))}
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                {messages.map((msg, i) => {
                  const isMe = msg.sender._id === (user.id || user._id);
                  return (
                    <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {!isMe && activeTab === 'group' && (
                        <img src={msg.sender.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-6 h-6 rounded-full mr-2 mt-1 object-cover" />
                      )}
                      <div className="max-w-[80%] flex flex-col">
                        {!isMe && activeTab === 'group' && (
                          <span className="text-[10px] text-gray-500 mb-0.5 ml-1">{msg.sender.name}</span>
                        )}
                        <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none shadow-sm'}`}>
                          {msg.content}
                        </div>
                        <span className={`text-[9px] text-gray-400 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-100 dark:border-gray-700 flex items-center space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={activeTab === 'group' ? 'Message everyone...' : `Message ${selectedUser?.name}...`}
                  className="flex-1 bg-gray-50 dark:bg-gray-900 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                />
                <button type="submit" className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors">
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
