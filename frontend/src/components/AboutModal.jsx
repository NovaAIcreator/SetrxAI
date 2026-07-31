// AboutModal.jsx
// About SetrxAI — Professional English Version

import Logo from './Logo';

export default function AboutModal({ onClose, onOpenPrivacy, onOpenTerms }) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[85vh] overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl p-6 shadow-2xl animate-fadeInUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <Logo size={44} />

          <h2 className="mt-3 text-lg font-bold bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 bg-clip-text text-transparent">
            SetrxAI
          </h2>

          <p className="text-xs text-zinc-500 mt-1">
            Powerful AI for Learning, Coding, Creativity & Productivity
          </p>

          <div className="w-full mt-5 text-left">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-2">
              About SetrxAI
            </h3>

            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              SetrxAI is an advanced multi-mode AI assistant designed to help
              you learn, create, solve problems, and work more efficiently.
              Whether you need everyday assistance, study support, programming
              help, or AI-powered image generation, SetrxAI brings everything
              together in one simple and intelligent platform.
            </p>
          </div>

          <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-3 text-left w-full mt-5">
            <h3 className="font-semibold text-zinc-900 dark:text-white">
              AI Modes
            </h3>

            <p>
              💬{" "}
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                General
              </span>{" "}
              — Natural conversations, everyday questions, writing assistance,
              and instant answers.
            </p>

            <p>
              📚{" "}
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                Study
              </span>{" "}
              — Detailed explanations, structured notes, revision material,
              summaries, and exam preparation.
            </p>

            <p>
              💻{" "}
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                Coding
              </span>{" "}
              — High-quality code generation, debugging, project guidance, and
              step-by-step technical explanations.
            </p>
          </div>

          <div className="text-sm text-zinc-600 dark:text-zinc-400 text-left w-full mt-5">
            <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
              Key Features
            </h3>

            <ul className="list-disc pl-5 space-y-2">
              <li>AI-powered conversations with multiple intelligent models</li>

              <li>
                Chat History and Projects for logged-in users with seamless
                continuation
              </li>

              <li>
                AI Image Generation with searchable personal image gallery
              </li>

              <li>
                Upload PDFs, documents, text files, and images for AI analysis
              </li>

              <li>Voice input and text-to-speech support</li>

              <li>Fast, secure, and continuously improving AI experience</li>
            </ul>
          </div>

          <div className="text-sm text-zinc-600 dark:text-zinc-400 text-left w-full mt-5">
            <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
              Our Mission
            </h3>

            <p className="leading-relaxed">
              Our mission is to make advanced AI accessible to everyone by
              providing powerful tools that improve learning, creativity,
              productivity, and everyday problem-solving through a simple and
              reliable experience.
            </p>
          </div>

          <div className="text-xs text-zinc-500 text-left w-full mt-5 space-y-1">
            <p>
              <span className="font-medium">Version:</span> 1.0
            </p>

            <p>
              <span className="font-medium">Support:</span>{" "}
              <a
                href="mailto:support@setrxai.com"
                className="text-purple-500 hover:underline"
              >
                support@setrxai.com
              </a>
            </p>
          </div>

          <div className="flex gap-2 w-full text-xs mt-6 mb-4">
            <button
              onClick={onOpenPrivacy}
              className="flex-1 py-2 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
            >
              Privacy Policy
            </button>

            <button
              onClick={onOpenTerms}
              className="flex-1 py-2 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
            >
              Terms & Conditions
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-xl py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}