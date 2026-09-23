import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEOHead from './components/SEOHead';
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

export default function App({ defaultMode = 'general' }) {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [mode, setMode] = useState(defaultMode);
  const [theme, setTheme] = useState(function () {
    return localStorage.getItem('setrxai_theme') || 'light';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(function () {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('setrxai_theme', theme);
  }, [theme]);

  useEffect(
    function () {
      navigate('/' + mode, { replace: true });
    },
    [mode]
  );

  useEffect(function () {
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
      } catch (e) {}
    }
    setCheckingAuth(false);

    api
      .getMe()
      .then(function (res) {
        setUser(res.user);
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(res.user));
        return loadEverything();
      })
      .catch(function (err) {
        if (err.status === 401) {
          localStorage.removeItem('setrxai_token');
          localStorage.removeItem(USER_CACHE_KEY);
          setUser(null);
          startGuestSession();
        } else {
          console.warn('Auth verify failed:', err.message);
          if (cachedUser) {
            loadEverything().catch(function () {
              startGuestSession();
            });
          } else {
            startGuestSession();
          }
        }
      });
  }, []);

  function startGuestSession() {
    setSessions([]);
    setProjects([]);
    setActiveId('guest');
    setMessages([]);
  }

  async function loadEverything() {
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

    setProjects(projectsData);

    // Always open a NEW blank chat (old chats stay in sidebar)
    try {
      const newSession = await api.createSession(mode, null);
      const rest = sessionsData.filter(function (s) {
        return s.id !== newSession.id;
      });
      setSessions([newSession].concat(rest));
      setActiveId(newSession.id);
      setMessages([]);
    } catch (err) {
      console.error('New session on load failed:', err.message);
      setSessions(sessionsData);
      setActiveId(null);
      setMessages([]);
    }
  }

  async function handleLoginSuccess(loggedInUser) {
    setActiveId(null);
    setMessages([]);
    setUser(loggedInUser);
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(loggedInUser));
    setShowLogin(false);
    await loadEverything();
  }

  function handleLogout() {
    localStorage.removeItem('setrxai_token');
    localStorage.removeItem(USER_CACHE_KEY);
    setUser(null);
    setShowProfile(false);
    startGuestSession();
  }

  function handleAccountDeleted() {
    localStorage.removeItem('setrxai_token');
    localStorage.removeItem(USER_CACHE_KEY);
    setUser(null);
    setShowProfile(false);
    startGuestSession();
  }

  async function createNewSession(projectId) {
    if (!getToken()) {
      startGuestSession();
      return;
    }
    try {
      const newSession = await api.createSession(mode, projectId || null);
      setSessions(function (prev) {
        return [newSession].concat(prev);
      });
      setActiveId(newSession.id);
      setMessages([]);
      setSidebarOpen(false);
    } catch (err) {
      console.error('New session create failed:', err.message);
    }
  }

  async function selectSession(id, sessionMode) {
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
  }

  async function deleteSession(id) {
    try {
      await api.deleteSession(id);
    } catch (err) {
      console.error('Delete session failed:', err.message);
    }
    setSessions(function (prev) {
      return prev.filter(function (s) {
        return s.id !== id;
      });
    });
    if (activeId === id) {
      createNewSession();
    }
  }

  async function handleNewProject(name) {
    try {
      const newProject = await api.createProject(name);
      setProjects(function (prev) {
        return [newProject].concat(prev);
      });
    } catch (err) {
      console.error('Project create failed:', err.message);
      alert('Project banane mein problem hui.');
    }
  }

  async function handleDeleteProject(id) {
    try {
      await api.deleteProject(id);
    } catch (err) {
      console.error('Project delete failed:', err.message);
    }
    setProjects(function (prev) {
      return prev.filter(function (p) {
        return p.id !== id;
      });
    });
    setSessions(function (prev) {
      return prev.filter(function (s) {
        return s.project_id !== id;
      });
    });
  }

  function handleHome() {
    createNewSession();
  }

  useEffect(
    function () {
      if (!activeId || activeId === 'guest' || messages.length === 0) return;
      setSessions(function (prev) {
        return prev.map(function (s) {
          if (
            s.id === activeId &&
            s.title === 'New Chat' &&
            messages[0] &&
            messages[0].content
          ) {
            return Object.assign({}, s, {
              title: messages[0].content.slice(0, 40),
            });
          }
          return s;
        });
      });
    },
    [messages]
  );

  if (checkingAuth) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-50 dark:bg-[#0a0a0b]">
        <Logo size={48} />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex bg-zinc-50 dark:bg-[#0a0a0b] text-zinc-900 dark:text-zinc-100 overflow-hidden">
      <SEOHead mode={mode} />

      <Sidebar
        sessions={sessions}
        projects={projects}
        activeId={activeId}
        onSelect={function (id) {
          const s = sessions.find(function (x) {
            return x.id === id;
          });
          selectSession(id, s && s.mode);
        }}
        onNew={function () {
          createNewSession();
        }}
        onDelete={deleteSession}
        onNewProject={handleNewProject}
        onNewChatInProject={function (projectId) {
          createNewSession(projectId);
        }}
        onDeleteProject={handleDeleteProject}
        onHome={handleHome}
        isOpen={sidebarOpen}
        onClose={function () {
          setSidebarOpen(false);
        }}
        onOpenAbout={function () {
          setShowAbout(true);
        }}
        onOpenPrivacy={function () {
          setShowPrivacy(true);
        }}
        onOpenTerms={function () {
          setShowTerms(true);
        }}
        onOpenProfile={function () {
          setShowProfile(true);
        }}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 py-3 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={28} />
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              SetrxAI
            </h1>
          </div>
          <UserMenu
            user={user}
            onLogout={handleLogout}
            onAboutClick={function () {
              setShowAbout(true);
            }}
            onLoginClick={function () {
              setShowLogin(true);
            }}
            onProfileClick={function () {
              setShowProfile(true);
            }}
          />
        </header>

        <ModeSelector
          onMenuClick={function () {
            setSidebarOpen(true);
          }}
        />

        <div className="flex-1 min-h-0">
          <ChatWindow
            mode={mode}
            setMode={setMode}
            sessionId={activeId}
            messages={messages}
            setMessages={setMessages}
            isGuest={!user}
          />
        </div>
      </div>

      {showLogin && (
        <Login
          onSuccess={handleLoginSuccess}
          onClose={function () {
            setShowLogin(false);
          }}
        />
      )}
      {showAbout && (
        <AboutModal
          onClose={function () {
            setShowAbout(false);
          }}
          onOpenPrivacy={function () {
            setShowAbout(false);
            setShowPrivacy(true);
          }}
          onOpenTerms={function () {
            setShowAbout(false);
            setShowTerms(true);
          }}
        />
      )}
      {showPrivacy && (
        <PrivacyModal
          onClose={function () {
            setShowPrivacy(false);
          }}
        />
      )}
      {showTerms && (
        <TermsModal
          onClose={function () {
            setShowTerms(false);
          }}
        />
      )}
      {showProfile && (
        <ProfileModal
          user={user}
          theme={theme}
          toggleTheme={function () {
            setTheme(function (t) {
              return t === 'dark' ? 'light' : 'dark';
            });
          }}
          onLogout={handleLogout}
          onClose={function () {
            setShowProfile(false);
          }}
          onAccountDeleted={handleAccountDeleted}
          onUserUpdated={function (updatedUser) {
            setUser(updatedUser);
            localStorage.setItem(USER_CACHE_KEY, JSON.stringify(updatedUser));
          }}
          sessionsCount={sessions.length}
        />
      )}
    </div>
  );
}
