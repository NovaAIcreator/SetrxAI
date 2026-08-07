// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📁 FILE LOCATION: frontend/src/main.jsx
//    (Existing main.jsx ko REPLACE karo is code se)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React from 'react';
import ReactDOM from 'react-dom/client';

// ── NEW: Router + Helmet imports ──
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* HelmetProvider: SEO meta tags ka kaam karta hai */}
    <HelmetProvider>
      {/* BrowserRouter: URL routing enable karta hai */}
      <BrowserRouter>
        <Routes>
          {/* 
            ── URL ROUTES ──
            /          → General AI (home page)
            /general   → General AI
            /study     → Study AI Tutor
            /coding    → Coding AI Assistant
            
            defaultMode prop se App ko pata chalta hai
            kaunsa mode start me select karna hai
          */}
          <Route path="/"        element={<App defaultMode="general" />} />
          <Route path="/general" element={<App defaultMode="general" />} />
          <Route path="/study"   element={<App defaultMode="study"   />} />
          <Route path="/coding"  element={<App defaultMode="coding"  />} />

          {/* 404 — koi aur URL to home pe bhejo */}
          <Route path="*"        element={<App defaultMode="general" />} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
  
