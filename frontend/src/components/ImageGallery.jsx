// ImageGallery.jsx
// Saari generated images ek jagah — prompt se search bhi kar sakte ho

import { useState, useEffect, useCallback } from 'react';
import { Search, X, Download, Trash2, ImageIcon, Loader2 } from 'lucide-react';
import { api } from '../api';

export default function ImageGallery({ onClose }) {
  const [images, setImages] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async (q) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getImages(q);
      setImages(data);
    } catch (err) {
      setError(err.message || 'Gallery load nahi ho payi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(''); }, [load]);

  const handleSearch = (e) => {
    e.preventDefault();
    load(query);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Ye image gallery se delete kar dein?')) return;
    try {
      await api.deleteImage(id);
      setImages((prev) => prev.filter((img) => img.id !== id));
      setSelected((prev) => (prev?.id === id ? null : prev));
    } catch (err) {
      alert(err.message || 'Delete nahi ho paya');
    }
  };

  const handleDownload = async (url, e) => {
    e?.stopPropagation();
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objUrl;
      link.download = `setrxai-image-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(objUrl);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div
        className="w-full max-w-3xl h-[80vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col animate-fadeInUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-white/10 shrink-0">
          <h2 className="text-lg font-bold bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 bg-clip-text text-transparent">
            Image Gallery
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2 px-5 py-3 border-b border-zinc-200 dark:border-white/10 shrink-0">
          <div className="flex-1 flex items-center gap-2 bg-zinc-100 dark:bg-white/5 rounded-xl px-3 py-2">
            <Search size={16} className="text-zinc-500 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Prompt se search karo..."
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <button type="submit" className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-sm font-medium shrink-0 transition-all">
            Search
          </button>
        </form>

        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="h-full flex items-center justify-center text-zinc-500 gap-2 text-sm">
              <Loader2 size={18} className="animate-spin" /> Loading...
            </div>
          )}

          {!loading && error && (
            <div className="h-full flex items-center justify-center text-red-500 text-sm text-center px-4">{error}</div>
          )}

          {!loading && !error && images.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-sm gap-2 text-center px-4">
              <ImageIcon size={32} className="opacity-40" />
              {query ? 'Is search se koi image nahi mili' : 'Abhi tak koi image generate nahi ki hai'}
            </div>
          )}

          {!loading && !error && images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((img) => (
                <div
                  key={img.id}
                  onClick={() => setSelected(img)}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-zinc-100 dark:bg-white/5 cursor-pointer shadow-sm hover:shadow-lg transition-all duration-200"
                >
                  <img src={img.url} alt={img.prompt} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end p-2 opacity-0 group-hover:opacity-100">
                    <p className="text-white text-[11px] line-clamp-2">{img.prompt}</p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(img.id, e)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <button
            onClick={(e) => handleDownload(selected.url, e)}
            className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all hover:scale-105 active:scale-95"
          >
            <Download size={18} /> Download
          </button>
          <button
            onClick={() => setSelected(null)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-90"
          >
            <X size={22} />
          </button>
          <div className="max-w-full max-h-full flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <img src={selected.url} alt={selected.prompt} className="max-w-full max-h-[75vh] rounded-xl shadow-2xl object-contain" />
            <p className="text-white/80 text-xs text-center max-w-lg px-4">{selected.prompt}</p>
          </div>
        </div>
      )}
    </div>
  );
}