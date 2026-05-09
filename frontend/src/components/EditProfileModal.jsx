import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Camera, User as UserIcon, Lock, Trash2, ShieldAlert, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';

// Tabs for the modal
const TABS = ['Profile', 'Password', 'Account'];

export default function EditProfileModal({ isOpen, onClose }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Profile');

  // --- Profile State ---
  const [name, setName] = useState(user?.name || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // --- Password State ---
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ text: '', isError: false });

  // --- Delete Account State ---
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen) return null;

  // ---------- PROFILE HANDLERS ----------
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg('');
    try {
      let updatedUser = { ...user };
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        const avatarRes = await axios.post(`${API_URL}/api/auth/avatar`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        updatedUser = { ...updatedUser, ...avatarRes.data };
      }
      if (name !== user?.name) {
        const profileRes = await axios.put(`${API_URL}/api/auth/profile`, { name });
        updatedUser = { ...updatedUser, ...profileRes.data };
      }
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.location.reload();
    } catch (err) {
      setProfileMsg(err.response?.data?.message || 'Failed to update profile.');
      setProfileLoading(false);
    }
  };

  // ---------- PASSWORD HANDLERS ----------
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg({ text: '', isError: false });
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New passwords do not match.', isError: true });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'New password must be at least 6 characters.', isError: true });
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await axios.put(`${API_URL}/api/auth/password`, { oldPassword, newPassword });
      setPasswordMsg({ text: res.data.message, isError: false });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg({ text: err.response?.data?.message || 'Failed to change password.', isError: true });
    } finally {
      setPasswordLoading(false);
    }
  };

  // ---------- DELETE ACCOUNT HANDLERS ----------
  const handleDeleteAccount = async () => {
    setDeleteError('');
    if (!deletePassword) {
      setDeleteError('Please enter your password to confirm deletion.');
      return;
    }
    setDeleteLoading(true);
    try {
      await axios.delete(`${API_URL}/api/auth/account`, {
        data: { password: deletePassword }
      });
      logout();
      navigate('/register');
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete account.');
      setDeleteLoading(false);
    }
  };

  const roleBadgeColor = {
    admin: 'bg-red-100 text-red-700 border border-red-200',
    manager: 'bg-blue-100 text-blue-700 border border-blue-200',
    member: 'bg-green-100 text-green-700 border border-green-200',
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Account Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-xl leading-none">✕</button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                activeTab === tab
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-white dark:bg-gray-800'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab === 'Account' ? '⚠️ ' : ''}{tab}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ===== PROFILE TAB ===== */}
          {activeTab === 'Profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              {/* Avatar */}
              <div className="flex flex-col items-center space-y-3">
                <div className="relative group">
                  <img
                    src={avatarPreview || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                    alt="Avatar Preview"
                    className="w-24 h-24 rounded-full border-4 border-indigo-100 dark:border-indigo-900 object-cover"
                  />
                  <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera size={24} className="text-white" />
                  </label>
                  <input id="avatar-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Hover & click to upload a new photo</p>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${roleBadgeColor[user?.role] || 'bg-gray-100 text-gray-600'}`}>
                  {user?.role || 'member'}
                </span>
              </div>

              {profileMsg && <p className="text-red-500 text-sm text-center">{profileMsg}</p>}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-9 pr-4 border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg py-2.5 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                <button type="submit" disabled={profileLoading} className="px-4 py-2 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-70">
                  {profileLoading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          )}

          {/* ===== PASSWORD TAB ===== */}
          {activeTab === 'Password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Enter your current password, then choose a new one.</p>

              {passwordMsg.text && (
                <div className={`flex items-center space-x-2 p-3 rounded-lg text-sm font-medium ${passwordMsg.isError ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800'}`}>
                  <CheckCircle size={16} className="flex-shrink-0" />
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              {[
                { label: 'Current Password', value: oldPassword, setter: setOldPassword, placeholder: 'Your current password' },
                { label: 'New Password', value: newPassword, setter: setNewPassword, placeholder: 'Min. 6 characters' },
                { label: 'Confirm New Password', value: confirmPassword, setter: setConfirmPassword, placeholder: 'Re-enter new password' },
              ].map(({ label, value, setter, placeholder }) => (
                <div key={label}>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      required
                      type="password"
                      value={value}
                      onChange={e => setter(e.target.value)}
                      placeholder={placeholder}
                      className="w-full pl-9 pr-4 border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg py-2.5 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    />
                  </div>
                </div>
              ))}

              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                <button type="submit" disabled={passwordLoading} className="px-4 py-2 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-70">
                  {passwordLoading ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            </form>
          )}

          {/* ===== ACCOUNT DELETE TAB ===== */}
          {activeTab === 'Account' && (
            <div className="space-y-5">
              <div className="flex items-start space-x-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <ShieldAlert size={22} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-700 dark:text-red-400">Danger Zone</p>
                  <p className="text-sm text-red-600 dark:text-red-500 mt-1">Deleting your account is <strong>permanent and irreversible</strong>. All your data will be removed immediately.</p>
                </div>
              </div>

              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full py-2.5 rounded-lg font-semibold text-red-600 dark:text-red-400 border-2 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                >
                  I want to delete my account
                </button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Confirm with your Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={e => setDeletePassword(e.target.value)}
                        placeholder="Enter your password to confirm"
                        className="w-full pl-9 pr-4 border border-red-300 dark:border-red-700 dark:bg-gray-900 dark:text-white rounded-lg py-2.5 focus:ring-2 focus:ring-red-500 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {deleteError && <p className="text-red-500 text-sm">{deleteError}</p>}

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => { setConfirmDelete(false); setDeletePassword(''); setDeleteError(''); }}
                      className="flex-1 py-2.5 rounded-lg font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading}
                      className="flex-1 py-2.5 rounded-lg font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-md disabled:opacity-70 flex items-center justify-center space-x-2"
                    >
                      <Trash2 size={16} />
                      <span>{deleteLoading ? 'Deleting...' : 'Delete Account'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
