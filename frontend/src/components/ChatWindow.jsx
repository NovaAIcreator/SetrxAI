// ChatWindow.jsx

import { useState, useEffect, useRef } from 'react';
import { Paperclip, Mic, Send, X, FileText } from 'lucide-react';
import Message from './Message';
import { api } from '../api';

function TypingDots() {
  return (
    <div className="flex gap-2 sm:gap-3 justify-start mb-4 px-2 sm:px-4">
      <div className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-xs animate-pulse">✨</div>
      <div className="flex items-center gap-1.5 bg-white dark:bg-white/[0.06] border border-zinc-200 dark:border-white/10 rounded-2xl rounded-bl-md px-4 py-3.5">
        <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce1" style={{ animationDelay: '0s' }} />
        <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce1" style={{ animationDelay: '0.2s' }} />
        <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce1" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  );
}

export default function ChatWindow({ mode, sessionId, messages, setMessages, isGuest }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [waitingFirstChunk, setWaitingFirstChunk] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [isListening, setIsListening] = useState(false);

  const [attachedFile, setAttachedFile] = useState(null);
  const [parsingFile, setParsingFile] = useState(false);
  const [fileError, setFileError] = useState('');

  const scrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // ---- Smart scroll: history khulte hi bottom pe jump, naya msg bhejte hi smooth scroll,
  // AI streaming ke dauraan scroll disturb nahi hoga ----
  const isNewSessionLoad = useRef(true);
  const shouldScrollRef = useRef(false);

  useEffect(() => {
    isNewSessionLoad.current = true;
  }, [sessionId]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (isNewSessionLoad.current) {
      // History load hui — turant last message pe jump (koi animation nahi)
      container.scrollTop = container.scrollHeight;
      isNewSessionLoad.current = false;
    } else if (shouldScrollRef.current) {
      // User ne abhi message bheja — smoothly neeche scroll karo
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      shouldScrollRef.current = false;
    }
    // else: AI answer stream ho raha hai — scroll ko chhedo mat
  }, [messages]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? prev + ' ' + transcript : transcript));
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Voice input ye browser support nahi karta. Chrome try karo.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      setImagePreview({ mimeType: file.type, data: base64, previewUrl: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => setImagePreview(null);

  const handleDocSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileError('');
    setParsingFile(true);
    setAttachedFile(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];
      try {
        const result = await api.parseFile(file.name, file.type, base64);
        setAttachedFile({ name: result.fileName, text: result.text });
      } catch (err) {
        console.error('File parse error:', err);
        setFileError(err.message || 'File parse nahi ho payi');
      } finally {
        setParsingFile(false);
        e.target.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setAttachedFile(null);
    setFileError('');
  };

  const sendMessage = async () => {
    if ((!input.trim() && !imagePreview && !attachedFile) || loading) return;

    const displayText = input || (attachedFile ? `📄 "${attachedFile.name}" ke baare mein poochha` : '(Image bheji gayi)');
    const userMessage = { role: 'user', content: displayText };
    const updatedMessages = [...messages, userMessage];
    shouldScrollRef.current = true;
    setMessages(updatedMessages);

    const imageToSend = imagePreview ? { mimeType: imagePreview.mimeType, data: imagePreview.data } : null;
    const fileToSend = attachedFile ? { name: attachedFile.name, text: attachedFile.text } : null;

    setInput('');
    setImagePreview(null);
    setAttachedFile(null);
    setLoading(true);
    setWaitingFirstChunk(true);
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const response = await api.chatStream(mode, updatedMessages, isGuest ? null : sessionId, imageToSend, fileToSend);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.replace('data:', '').trim();
          if (!jsonStr) continue;

          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.chunk) {
              setWaitingFirstChunk(false);
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: updated[updated.length - 1].content + parsed.chunk,
                };
                return updated;
              });
            }
            if (parsed.error) {
              setWaitingFirstChunk(false);
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: `⚠️ ${parsed.error}` };
                return updated;
              });
            }
          } catch (e) { /* skip incomplete chunk */ }
        }
      }
    } catch (err) {
      setWaitingFirstChunk(false);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: '⚠️ Connection error, please try again.' };
        return updated;
      });
    } finally {
      setLoading(false);
      setWaitingFirstChunk(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const displayMessages = waitingFirstChunk ? messages.slice(0, -1) : messages;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto py-4 max-w-5xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-zinc-500 text-sm sm:text-base px-4 text-center animate-fadeInUp">
            Ask SetrxAI anything — {mode} mode active
          </div>
        )}
        {displayMessages.map((msg, i) => (
          <Message key={i} role={msg.role} content={msg.content} />
        ))}
        {waitingFirstChunk && <TypingDots />}
      </div>

      <div className="p-3 sm:p-4">
        <div className="max-w-5xl mx-auto">
          {imagePreview && (
            <div className="mb-2 relative inline-block animate-fadeInUp">
              <img src={imagePreview.previewUrl} alt="preview" className="h-20 rounded-lg border border-zinc-300 dark:border-white/10 shadow-md" />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-90"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {parsingFile && (
            <div className="mb-2 relative overflow-hidden flex items-center gap-2 bg-white dark:bg-white/[0.06] border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs animate-fadeInUp">
              <div className="shimmer-overlay" />
              <FileText size={16} className="text-purple-500 shrink-0 animate-soft-pulse" />
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">Reading file...</span>
            </div>
          )}

          {attachedFile && !parsingFile && (
            <div className="mb-2 flex items-center gap-2 bg-white dark:bg-white/[0.06] border border-purple-200 dark:border-purple-500/20 rounded-xl px-3 py-2 text-xs shadow-sm animate-fadeInUp">
              <FileText size={15} className="text-purple-500 shrink-0" />
              <span className="truncate flex-1 text-zinc-700 dark:text-zinc-300 font-medium">{attachedFile.name}</span>
              <button
                onClick={removeFile}
                className="shrink-0 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-90"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {fileError && (
            <div className="mb-2 text-xs text-red-500 animate-fadeInUp">⚠️ {fileError}</div>
          )}

          <div className="flex items-center gap-1 bg-white dark:bg-white/[0.06] border border-zinc-200 dark:border-white/10 rounded-2xl px-2 py-1.5 shadow-lg backdrop-blur-sm transition-shadow focus-within:shadow-xl focus-within:ring-2 focus-within:ring-purple-500/40">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageSelect}
              className="hidden"
            />
            <input
              type="file"
              accept=".pdf,.docx,.txt,.csv,.js,.jsx,.ts,.tsx,.py,.json,.md,.html,.css,.java,.c,.cpp,.xml,.yml,.yaml,.log"
              ref={docInputRef}
              onChange={handleDocSelect}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 p-2.5 rounded-xl text-zinc-500 hover:text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-500/10 transition-all duration-200 hover:scale-110 active:scale-95"
              title="Send image"
            >
              <Paperclip size={20} strokeWidth={2} />
            </button>

            <button
              onClick={() => docInputRef.current?.click()}
              disabled={parsingFile}
              className="shrink-0 p-2.5 rounded-xl text-zinc-500 hover:text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-500/10 transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-30"
              title="Send file (PDF/DOCX/code/text)"
            >
              <FileText size={20} strokeWidth={2} />
            </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-zinc-900 dark:text-zinc-100 text-sm sm:text-base px-1 py-2 outline-none max-h-32"
            />

            <button
              onClick={toggleListening}
              className={`shrink-0 p-2.5 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 ${
                isListening
                  ? 'text-red-500 bg-red-100 dark:bg-red-500/20 animate-pulse'
                  : 'text-zinc-500 hover:text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-500/10'
              }`}
              title="Click to Speak"
            >
              <Mic size={20} strokeWidth={2} />
            </button>

            <button
              onClick={sendMessage}
              disabled={loading}
              title="Send message"
              className="bg-gradient-to-br from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-50 text-white rounded-xl p-2.5 transition-all duration-200 shrink-0 hover:scale-110 active:scale-95 shadow-md"
            >
              <Send size={20} strokeWidth={2} className={loading ? 'animate-pulse' : ''} />
            </button>
          </div>
          <p className="text-[11px] text-zinc-500 text-center mt-1.5">
            Paperclip = attach image &nbsp;•&nbsp; Document icon = PDF/DOCX/code/text file
          </p>
        </div>
      </div>
    </div>
  );
}