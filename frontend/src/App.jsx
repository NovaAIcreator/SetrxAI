// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📁 FILE LOCATION: frontend/src/App.jsx
//    (Existing App.jsx ko REPLACE karo is code se)
//
// ✅ KYA BADLA:
//    1. Line 1  → SEOHead import add kiya (NEW)
//    2. Line 2  → useNavigate import add kiya (NEW)
//    3. Function → defaultMode prop add kiya
//    4. mode useState → defaultMode se initialize hoga
//    5. useEffect → mode change hone pe URL bhi change hoga
//    6. JSX → <SEOHead mode={mode} /> add kiya header mein
//
// ✅ BAAKI SAARA CODE BILKUL SAME HAI — KUCH NAHI TUTA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // ← NEW (line 1 change)
import SEOHead from './components/SEOHead';      // ← NEW (line 2 change)

import ModeSelector from './components/ModeSelector';
import ChatWindow from './components/ChatWindow';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import UserMenu from './components/UserMenu';
import AboutModal from './components/AboutModal';
import PrivacyModal from './components/PrivacyModal';
import TermsModal from './components/TermsModal';
import ProfileModal from './components/ProfileModal';
import Logo from './components/Logo';
import { api, getToken } from './api';

const USER_CACHE_KEY = 'setrxai_user_cache';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CHANGE #1: function mein defaultMode prop add kiya
// Pehle tha:  export default function App() {
// Ab hai:     export default function App({ defaultMode = 'general' }) {
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function App({ defaultMode = 'general' }) {
  const navigate = useNavigate(); // ← NEW: URL change karne ke liye

  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CHANGE #2: mode ko defaultMode se initialize karo
  // Pehle tha:  const [mode, setMode] = useState('general');
  // Ab hai:     const [mode, setMode] = useState(defaultMode);
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const [mode, setMode] = useState(defaultMode);

  const [theme, setTheme] = useState(() => localStorage.getItem('setrxai_theme') || 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('setrxai_theme', theme);
  }, [theme]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CHANGE #3: Jab mode change ho to URL bhi update ho
  // (Google ko alag pages dikhne ke liye zaroori)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    navigate(`/${mode}`, { replace: true });
  }, [mode]);

  // ── Baaki ka EXACT same code hai — kuch nahi badla ──

  useEffect(() => {
    const token = getToken();
    if (!token) {
      startGuestSession();
      setCheckingAuth(false);
      return;
    }

    const cachedUser = localStorage.getItem(USER_CACHE_KEY);
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch (e) { /* corrupt cache, ignore */ }
    }
    setCheckingAuth(false);

    api.getMe()
      .then(({ user }) => {
        setUser(user);
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
        loadEverything();
      })
      .catch((err) => {
        if (err.status === 401) {
          localStorage.removeItem('setrxai_token');
          localStorage.removeItem(USER_CACHE_KEY);
          setUser(null);
          startGuestSession();
        } else {
          console.warn('Auth verify failed (DB/network issue), keeping cached login:', err.message);
          if (cachedUser) {
            loadEverything().catch(() => startGuestSession());
          } else {
            startGuestSession();
          }
        }
      });
  }, []);

  const startGuestSession = () => {
    setSessions([]);
    setProjects([]);
    setActiveId('guest');
    setMessages([]);
  };

  const loadEverything = async () => {
    let sessionsData = [];
    let projectsData = [];

    try {
      sessionsData = await api.getSessions();
    } catch (err) {
      console.warn('Sessions load failed:', err.message);
    }

    try {
      projectsData = await api.getProjects();
    } catch (err) {
      console.warn('Projects load failed:', err.message);
    }

    setSessions(sessionsData);
    setProjects(projectsData);

    if (sessionsData.length > 0) {
      selectSession(sessionsData[0].id, sessionsData[0].mode);
    } else if (activeId === 'guest' || !activeId) {
      createNewSession();
    }
  };

  const handleLoginSuccess = async (loggedInUser) => {
    setActiveId(null);
    setMessages([]);
    setUser(loggedInUser);
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(loggedInUser));
    setShowLogin(false);
    await loadEverything();
  };

  const handleLogout = () => {
    localStorage.removeItem('setrxai_token');
    localStorage.removeItem(USER_CACHE_KEY);
    setUser(null);
    setShowProfile(false);
    startGuestSession();
  };

  const handleAccountDeleted = () => {
    localStorage.removeItem('setrxai_token');
    localStorage.removeItem(USER_CACHE_KEY);
    setUser(null);
    setShowProfile(false);
    startGuestSession();
  };

  const createNewSession = async (projectId = null) => {
    if (!user) { startGuestSession(); return; }
    try {
      const newSession = await api.createSession(mode, projectId);
      setSessions((prev) => [newSession, ...prev]);
      setActiveId(newSession.id);
      setMessages([]);
      setSidebarOpen(false);
    } catch (err) {
      console.error('New session create failed:', err.message);
    }
  };

  const selectSession = async (id, sessionMode) => {
    setActiveId(id);
    if (sessionMode) setMode(sessionMode);
    try {
      const msgs = await api.getMessages(id);
      setMessages(msgs);
    } catch (err) {
      console.error('Messages load failed:', err.message);
      setMessages([]);
    }
    setSidebarOpen(false);
  };

  const deleteSession = async (id) => {
    try {
      await api.deleteSession(id);
    } catch (err) {
      console.error('Delete session failed:', err.message);
    }
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeId === id) {
      const remaining = sessions.filter((s) => s.id !== id);
      if (remaining.length > 0) selectSession(remaining[0].id, remaining[0].mode);
      else createNewSession();
    }
  };

  const handleNewProject = async (name) => {
    try {
      const newProject = await api.createProject(name);
      setProjects((prev) => [newProject, ...prev]);
    } catch (err) {
      console.error('Project create failed:', err.message);
      alert('Project banane mein problem hui.');
    }
  };

  const handleDeleteProject = async (id) => {
    try {
      await api.deleteProject(id);
    } catch (err) {
      console.error('Project delete failed:', err.message);
    }
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setSessions((prev) => prev.filter((s) => s.project_id !== id));
  };

  const handleHome = () => {
    createNewSession();
  };

  useEffect(() => {
    if (!activeId || activeId === 'guest' || messages.length === 0) return;
    setSessions((prev) =>
      prev.map((s) => (s.id === activeId && s.title === 'New Chat' && messages[0]?.content
        ? { ...s, title: messages[0].content.slice(0, 40) }
        : s))
    );
  }, [messages]);

  if (checkingAuth) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-[#0a0a12] dark:to-[#12081f]">
        <Logo size={48} />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-[#0a0a12] dark:to-[#12081f] text-zinc-900 dark:text-zinc-100 overflow-hidden">

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          CHANGE #4: SEOHead yahan add kiya
          Ye sirf meta tags set karta hai — UI mein kuch nahi dikhta
          Mode change hote hi Google-wale title/description change ho jayenge
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <SEOHead mode={mode} />

      {/* ── BAAKI POORA JSX BILKUL SAME HAI ── */}

      <Sidebar
        sessions={sessions}
        projects={projects}
        activeId={activeId}
        onSelect={(id) => selectSession(id, sessions.find(s => s.id === id)?.mode)}
        onNew={() => createNewSession()}
        onDelete={deleteSession}
        onNewProject={handleNewProject}
        onNewChatInProject={(projectId) => createNewSession(projectId)}
        onDeleteProject={handleDeleteProject}
        onHome={handleHome}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenAbout={() => setShowAbout(true)}
        onOpenPrivacy={() => setShowPrivacy(true)}
        onOpenTerms={() => setShowTerms(true)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 py-3 border-b border-zinc-300/50 dark:border-purple-500/10 flex items-center justify-between backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Logo size={28} />
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 bg-clip-text text-transparent">
              SetrxAI
            </h1>
          </div>
          <UserMenu
            user={user}
            onLogout={handleLogout}
            onAboutClick={() => setShowAbout(true)}
            onLoginClick={() => setShowLogin(true)}
            onProfileClick={() => setShowProfile(true)}
          />
        </header>

        <ModeSelector
          mode={mode}
          setMode={setMode}
          theme={theme}
          toggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="flex-1 min-h-0">
          <ChatWindow
            mode={mode}
            sessionId={activeId}
            messages={messages}
            setMessages={setMessages}
            isGuest={!user}
          />
        </div>
      </div>

      {showLogin && <Login onSuccess={handleLoginSuccess} onClose={() => setShowLogin(false)} />}
      {showAbout && (
        <AboutModal
          onClose={() => setShowAbout(false)}
          onOpenPrivacy={() => { setShowAbout(false); setShowPrivacy(true); }}
          onOpenTerms={() => { setShowAbout(false); setShowTerms(true); }}
        />
      )}
      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
      {showProfile && (
        <ProfileModal
          user={user}
          theme={theme}
          toggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          onLogout={handleLogout}
          onClose={() => setShowProfile(false)}
          onAccountDeleted={handleAccountDeleted}
          onUserUpdated={(updatedUser) => {
            setUser(updatedUser);
            localStorage.setItem(USER_CACHE_KEY, JSON.stringify(updatedUser));
          }}
          sessionsCount={sessions.length}
        />
      )}
    </div>
  );
}
