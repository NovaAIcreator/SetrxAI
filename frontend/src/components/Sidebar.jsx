// Sidebar.jsx
// Home, New Chat, New Project, Search, Projects list, aur Recents section

import { useState } from 'react';
import { Home, Plus, FolderPlus, Folder, ChevronDown, ChevronRight, Trash2, MessageSquare, Search, X } from 'lucide-react';

export default function Sidebar({
  sessions, projects, activeId, onSelect, onNew, onDelete,
  onNewProject, onNewChatInProject, onDeleteProject, onHome,
  isOpen, onClose, onOpenAbout, onOpenPrivacy, onOpenTerms,
}) {
  const [expandedProjects, setExpandedProjects] = useState({});
  const [creatingProject, setCreatingProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleProject = (id) => {
    setExpandedProjects((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateProject = () => {
    if (projectName.trim()) {
      onNewProject(projectName.trim());
      setProjectName('');
    }
    setCreatingProject(false);
  };

  const recentSessions = sessions
    .filter((s) => !s.project_id)
    .filter((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/60 z-20 md:hidden backdrop-blur-sm transition-opacity" onClick={onClose} />}

      <aside
        className={`fixed md:static z-30 top-0 left-0 h-full w-64 sm:w-72
          bg-white/70 dark:bg-black/30 backdrop-blur-xl border-r border-zinc-300/50 dark:border-purple-500/10
          flex flex-col transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Top action buttons */}
        <div className="p-3 space-y-1.5">
          <button
            onClick={onHome}
            className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-white/5 transition-all duration-200"
          >
            <Home size={16} /> Home
          </button>

          <button
            onClick={onNew}
            className="w-full flex items-center justify-center gap-2 rounded-xl
              bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500
              text-white text-sm font-medium py-2.5 shadow-lg shadow-purple-500/20 transition-all duration-200 hover:scale-[1.02] active:scale-95"
          >
            <Plus size={16} /> New Chat
          </button>

          <button
            onClick={() => setCreatingProject(true)}
            className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-white/5 transition-all duration-200 border border-dashed border-zinc-300 dark:border-white/10"
          >
            <FolderPlus size={16} /> New Project
          </button>

          {creatingProject && (
            <div className="flex gap-1.5 animate-fadeInUp">
              <input
                autoFocus
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                placeholder="Project name..."
                className="flex-1 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-300 dark:border-white/10 px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleCreateProject}
                className="px-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs transition-colors"
              >
                Add
              </button>
            </div>
          )}

          {/* ---- Chat search ---- */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-300 dark:border-white/10 pl-8 pr-8 py-2 text-xs outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-3 pb-3">
          {/* Projects section */}
          {projects.length > 0 && !searchQuery && (
            <div>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide px-2 mb-1">Projects</p>
              <div className="space-y-1">
                {projects.map((p) => {
                  const projectSessions = sessions.filter((s) => s.project_id === p.id);
                  const isExpanded = expandedProjects[p.id];
                  return (
                    <div key={p.id}>
                      <div
                        onClick={() => toggleProject(p.id)}
                        className="group flex items-center gap-2 rounded-xl px-2.5 py-2 cursor-pointer text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-white/5 transition-all duration-200"
                      >
                        <span className="transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                          <ChevronDown size={14} />
                        </span>
                        <Folder size={14} className="shrink-0 opacity-70" />
                        <span className="truncate flex-1 font-medium">{p.name}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteProject(p.id); }}
                          className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-500 transition-all duration-200 hover:scale-110"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="ml-5 pl-2 border-l border-zinc-300 dark:border-white/10 space-y-1 animate-fadeInUp">
                          <div
                            onClick={() => onNewChatInProject(p.id)}
                            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 cursor-pointer text-xs text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-all duration-200"
                          >
                            <Plus size={12} /> New chat in project
                          </div>
                          {projectSessions.map((s) => (
                            <div
                              key={s.id}
                              onClick={() => onSelect(s.id)}
                              className={`group flex items-center gap-2 rounded-lg px-2.5 py-1.5 cursor-pointer text-xs truncate transition-all duration-200
                                ${activeId === s.id
                                  ? 'bg-purple-600/15 text-purple-700 dark:text-purple-300'
                                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-white/5'}`}
                            >
                              <span className="truncate flex-1">{s.title}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
                                className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-500 shrink-0 transition-all duration-200"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recents section */}
          <div>
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide px-2 mb-1">
              {searchQuery ? 'Search Results' : 'Recents'}
            </p>
            <div className="space-y-1">
              {recentSessions.length === 0 && (
                <p className="text-xs text-zinc-500 text-center mt-4 px-2">
                  {searchQuery ? 'No chats found' : 'No chat history yet'}
                </p>
              )}
              {recentSessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => onSelect(s.id)}
                  className={`group flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer text-sm truncate transition-all duration-200
                    ${activeId === s.id
                      ? 'bg-purple-600/15 text-purple-700 dark:text-purple-300'
                      : 'text-zinc-700 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-white/5'}`}
                >
                  <MessageSquare size={14} className="shrink-0 opacity-60" />
                  <span className="truncate flex-1">{s.title}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
                    className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-500 shrink-0 transition-all duration-200 hover:scale-110"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-zinc-300/50 dark:border-purple-500/10 text-center">
          <p className="text-xs text-zinc-500 mb-1.5">SetrxAI ⚡</p>
          <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500">
            <button onClick={onOpenAbout} className="hover:text-purple-500 transition-colors">About</button>
            <span>·</span>
            <button onClick={onOpenPrivacy} className="hover:text-purple-500 transition-colors">Privacy</button>
            <span>·</span>
            <button onClick={onOpenTerms} className="hover:text-purple-500 transition-colors">Terms</button>
          </div>
        </div>
      </aside>
    </>
  );
}