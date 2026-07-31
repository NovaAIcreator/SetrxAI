// ProfileModal.jsx
// Advanced Profile page — ChatGPT/Claude jaisa. Account edit, password change,
// stats, appearance, aur danger zone — sab ek jagah, tabs mein organized.

import { useState } from 'react';
import { X, LogOut, Trash2, Sun, Moon, Mail, User, Lock, Check, MessageSquare, Pencil } from 'lucide-react';
import { api } from '../api';

const APP_VERSION = 'Setrx 1.0';

export default function ProfileModal({ user, theme, toggleTheme, onLogout, onClose, onAccountDeleted, onUserUpdated, sessionsCount = 0 }) {
  const [tab, setTab] = useState('account'); // 'account' | 'security' | 'appearance'

  // ---- Name edit ----
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');

  // ---- Password change ----
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // ---- Delete account ----
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const initial = user?.name?.charAt(0).toUpperCase() || '?';

  const handleSaveName = async () => {
    if (!nameInput.trim()) {
      setNameError('Naam khaali nahi ho sakta');
      return;
    }
    setSavingName(true);
    setNameError('');
    try {
      const { user: updatedUser } = await api.updateProfile(nameInput.trim());
      onUserUpdated(updatedUser);
      setEditingName(false);
    } catch (err) {
      setNameError(err.message || 'Update nahi ho paya');
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);
    setSavingPassword(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Password change nahi ho paya');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.deleteAccount();
      onAccountDeleted();
    } catch (err) {
      alert(err.message || 'Account delete nahi ho paya');
      setDeleting(false);
    }
  };

  const TabButton = ({ id, icon, label }) => (
    <button
      onClick={() => setTab(id)}
      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
        tab === id ? 'bg-purple-600/10 text-purple-600 dark:text-purple-400' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5'
      }`}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[88vh] overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl animate-fadeInUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-white/10 sticky top-0 bg-white dark:bg-zinc-900 z-10">
          <h2 className="text-lg font-bold bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 bg-clip-text text-transparent">
            Profile
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* User summary */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-zinc-200 dark:border-white/10">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-semibold shadow-md shrink-0">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-zinc-900 dark:text-white truncate text-lg">{user?.name}</p>
            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400">
                {APP_VERSION}
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-500 flex items-center gap-1">
                <MessageSquare size={10} /> {sessionsCount} chats
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3 overflow-x-auto">
          <TabButton id="account" icon={<User size={14} />} label="Account" />
          <TabButton id="security" icon={<Lock size={14} />} label="Security" />
          <TabButton id="appearance" icon={theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />} label="Appearance" />
        </div>

        {/* Tab content */}
        <div className="p-6 min-h-[220px]">
          {/* ---- ACCOUNT ---- */}
          {tab === 'account' && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-zinc-500 mb-1.5">Display Name</p>
                {!editingName ? (
                  <div className="flex items-center justify-between bg-zinc-100 dark:bg-white/5 rounded-xl px-4 py-3">
                    <span className="text-sm text-zinc-800 dark:text-zinc-200">{user?.name}</span>
                    <button
                      onClick={() => { setEditingName(true); setNameInput(user?.name || ''); }}
                      className="text-zinc-500 hover:text-purple-500 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      autoFocus
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-300 dark:border-white/10 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    {nameError && <p className="text-xs text-red-500">{nameError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingName(false); setNameError(''); }}
                        className="flex-1 py-2 rounded-lg border border-zinc-200 dark:border-white/10 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveName}
                        disabled={savingName}
                        className="flex-1 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                      >
                        {savingName ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-medium text-zinc-500 mb-1.5">Email</p>
                <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 rounded-xl px-4 py-3">
                  <Mail size={16} className="shrink-0 opacity-60" />
                  <span className="truncate">{user?.email}</span>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors border border-zinc-200 dark:border-white/10"
              >
                <LogOut size={16} /> Log Out
              </button>

              <div className="pt-3 border-t border-zinc-200 dark:border-white/10">
                <p className="text-xs font-medium text-red-500 mb-2">Danger Zone</p>
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="w-full flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border border-red-200 dark:border-red-500/20"
                  >
                    <Trash2 size={16} /> Delete Account
                  </button>
                ) : (
                  <div className="space-y-2 animate-fadeInUp">
                    <p className="text-xs text-red-500 px-1">
                      This permanently deletes your account, chats, and projects. This can't be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="flex-1 py-2 rounded-lg border border-zinc-200 dark:border-white/10 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleting}
                        className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                      >
                        {deleting ? 'Deleting...' : 'Yes, Delete'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---- SECURITY ---- */}
          {tab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-3">
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-1">Change Password</p>
              <input
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-300 dark:border-white/10 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="password"
                placeholder="New password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-300 dark:border-white/10 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500"
              />

              {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
              {passwordSuccess && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <Check size={13} /> Password updated successfully
                </p>
              )}

              <button
                type="submit"
                disabled={savingPassword}
                className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-medium transition-colors"
              >
                {savingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}

          {/* ---- APPEARANCE ---- */}
          {tab === 'appearance' && (
            <div>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-1">Theme</p>
              <p className="text-xs text-zinc-500 mb-3">Choose how SetrxAI looks on your device.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => theme !== 'light' && toggleTheme()}
                  className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-colors ${
                    theme === 'light' ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10' : 'border-zinc-200 dark:border-white/10'
                  }`}
                >
                  <Sun size={20} className="text-amber-500" />
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Light</span>
                </button>
                <button
                  onClick={() => theme !== 'dark' && toggleTheme()}
                  className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-colors ${
                    theme === 'dark' ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10' : 'border-zinc-200 dark:border-white/10'
                  }`}
                >
                  <Moon size={20} className="text-purple-500" />
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Dark</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-5 text-center">
          <p className="text-[11px] text-zinc-400">SetrxAI · {APP_VERSION}</p>
        </div>
      </div>
    </div>
  );
}