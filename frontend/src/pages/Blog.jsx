import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { blogs } from '../data/blogs';

export default function Blog() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const categories = ['All', 'Study', 'Coding', 'General'];
  const filtered = filter === 'All' ? blogs : blogs.filter(b => b.category === filter);

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', color: '#e2e8f0', fontFamily: 'Segoe UI, sans-serif' }}>
      <Helmet>
        <title>SetrxAI Blog — Free AI Tips for Students and Developers India</title>
        <meta name="description" content="Read SetrxAI blog for free AI tips, study guides, coding tutorials and more for Indian students and developers." />
      </Helmet>

      {/* NAV */}
      <nav style={{ background: '#1a1d2e', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2d3148' }}>
        <a href="/" style={{ fontWeight: 800, fontSize: '1.3rem', background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}>⚡ SetrxAI</a>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['/','/general','🌟'],  ['/study','📚'], ['/coding','💻']].map(([href,label]) => (
            <a key={href} href={href} style={{ color: '#94a3b8', textDecoration: 'none', padding: '6px 12px', borderRadius: 8, fontSize: '0.85rem' }}>{label}</a>
          ))}
        </div>
      </nav>

      {/* HERO */}
      <div style={{ textAlign: 'center', padding: '48px 24px 32px' }}>
        <div style={{ display: 'inline-block', background: '#6c63ff22', border: '1px solid #6c63ff', color: '#a78bfa', padding: '5px 14px', borderRadius: 20, fontSize: '0.8rem', marginBottom: 16 }}>📝 SetrxAI Blog</div>
        <h1 style={{ fontSize: 'clamp(1.6rem,4vw,2.2rem)', fontWeight: 800, marginBottom: 12 }}>
          Free AI Tips for{' '}
          <span style={{ background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Students & Developers
          </span>
        </h1>
        <p style={{ color: '#94a3b8', maxWidth: 500, margin: '0 auto' }}>Study guides, coding tutorials, and AI tips for Indian students — completely free!</p>
      </div>

      {/* FILTER */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap', padding: '0 16px' }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            style={{ background: filter === cat ? '#6c63ff' : '#1a1d2e', color: filter === cat ? '#fff' : '#94a3b8', border: '1px solid #2d3148', padding: '7px 18px', borderRadius: 20, cursor: 'pointer', fontSize: '0.85rem' }}>
            {cat === 'All' ? '🌟 All' : cat === 'Study' ? '📚 Study' : cat === 'Coding' ? '💻 Coding' : '🌐 General'}
          </button>
        ))}
      </div>

      {/* BLOG GRID */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px 80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
        {filtered.map(blog => (
          <div key={blog.id} onClick={() => navigate(`/blog/${blog.slug}`)}
            style={{ background: '#1a1d2e', border: '1px solid #2d3148', borderRadius: 16, padding: 20, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#6c63ff'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#2d3148'}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ background: '#6c63ff22', color: '#a78bfa', padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem' }}>
                {blog.category === 'Study' ? '📚' : blog.category === 'Coding' ? '💻' : '🌟'} {blog.category}
              </span>
              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{blog.readTime}</span>
            </div>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 8, lineHeight: 1.4 }}>{blog.title}</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: 12 }}>{blog.description.slice(0, 100)}...</p>
            <span style={{ color: '#6c63ff', fontSize: '0.82rem', fontWeight: 600 }}>Read more →</span>
          </div>
        ))}
      </div>

      <footer style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: '0.8rem', borderTop: '1px solid #1e293b' }}>
        © 2026 <a href="/" style={{ color: '#a78bfa' }}>SetrxAI</a> — Free AI for India 🇮🇳
      </footer>
    </div>
  );
          }
