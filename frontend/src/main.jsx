import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.jsx';
import Blog from './pages/Blog.jsx';
import BlogPost from './pages/BlogPost.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"        element={<App defaultMode="general" />} />
          <Route path="/general" element={<App defaultMode="general" />} />
          <Route path="/study"   element={<App defaultMode="study"   />} />
          <Route path="/coding"  element={<App defaultMode="coding"  />} />
          <Route path="/blog"    element={<Blog />}     />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="*"        element={<App defaultMode="general" />} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
