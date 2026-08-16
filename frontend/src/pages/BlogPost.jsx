import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getBlogBySlug } from '../data/blogs';

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const blog = getBlogBySlug(slug);

  if (!blog) return (
    <div style={{ minHeight: '100vh', background: '#0f1117', color: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <h1>Blog not found</h1>
      <button onClick={() => navigate('/blog')} style={{ background: '#6c63ff', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 10, cursor: 'pointer' }}>← Back to Blog</button>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', color: '#e2e8f0', fontFamily: 'Segoe UI, sans-serif' }}>
      <Helmet>
        <title>{blog.title}</title>
        <meta name="description" content={blog.description} />
        <meta name="keywords" content={blog.keywords} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://setrxai.onrender.com/blog/${blog.slug}`} />
        <meta property="og:title" content={blog.title} />
        <meta property="og:description" content={blog.description} />
      </Helmet>

      {/* NAV */}
      <nav style={{ background: '#1a1d2e', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2d3148', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/" style={{ fontWeight: 800, fontSize: '1.2rem', background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}>⚡ SetrxAI</a>
        <button onClick={() => navigate('/blog')} style={{ background: 'none', border: '1px solid #2d3148', color: '#94a3b8', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem' }}>← Blog</button>
      </nav>

      {/* CONTENT */}
      <article style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px 80px' }}>
        {/* Meta */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <span style={{ background: '#6c63ff22', color: '#a78bfa', padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem' }}>
            {blog.category === 'Study' ? '📚' : blog.category === 'Coding' ? '💻' : '🌟'} {blog.category}
          </span>
          <span style={{ color: '#94a3b8', fontSize: '0.8rem', alignSelf: 'center' }}>{blog.date} · {blog.readTime}</span>
        </div>

        {/* Blog content rendered */}
        <div style={{ lineHeight: 1.8, fontSize: '0.97rem' }}
          dangerouslySetInnerHTML={{
            __html: blog.content
              .replace(/^# (.+)$/gm, '<h1 style="font-size:1.8rem;font-weight:800;margin:0 0 20px;background:linear-gradient(135deg,#6c63ff,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent">$1</h1>')
              .replace(/^## (.+)$/gm, '<h2 style="font-size:1.25rem;font-weight:700;margin:32px 0 12px;color:#e2e8f0;border-left:3px solid #6c63ff;padding-left:12px">$1</h2>')
              .replace(/^### (.+)$/gm, '<h3 style="font-size:1.05rem;font-weight:700;margin:20px 0 8px;color:#a78bfa">$1</h3>')
              .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#e2e8f0">$1</strong>')
              .replace(/`([^`]+)`/g, '<code style="background:#1e2235;color:#a78bfa;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:0.88em">$1</code>')
              .replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre style="background:#0d1117;border:1px solid #2d3148;padding:16px;border-radius:10px;overflow-x:auto;font-family:monospace;font-size:0.85rem;margin:16px 0;color:#56d364">$1</pre>')
              .replace(/^- (.+)$/gm, '<li style="margin:6px 0;color:#cbd5e1;padding-left:4px">$1</li>')
              .replace(/(<li.*<\/li>\n?)+/g, '<ul style="margin:12px 0 12px 20px;list-style:disc">$&</ul>')
              .replace(/👉 \*\*(.+?)\*\*/g, '<div style="margin:24px 0;text-align:center"><a href="https://setrxai.onrender.com" style="background:linear-gradient(135deg,#6c63ff,#a78bfa);color:#fff;padding:12px 28px;border-radius:12px;text-decoration:none;font-weight:700;display:inline-block">$1</a></div>')
              .replace(/\n\n/g, '<br/><br/>')
          }}
        />

        {/* CTA Box */}
        <div style={{ background: 'linear-gradient(135deg,#1a1d2e,#21253a)', border: '1px solid #6c63ff40', borderRadius: 16, padding: 28, textAlign: 'center', marginTop: 48 }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚡</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8 }}>Try SetrxAI for Free!</h3>
          <p style={{ color: '#94a3b8', marginBottom: 20, fontSize: '0.9rem' }}>Study smarter, code faster — 100% free, no credit card needed.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/study" style={{ background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', color: '#fff', padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>📚 Study Mode</a>
            <a href="/coding" style={{ background: 'linear-gradient(135deg,#2ea043,#56d364)', color: '#fff', padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>💻 Coding Mode</a>
          </div>
        </div>
      </article>
    </div>
  );
      }
