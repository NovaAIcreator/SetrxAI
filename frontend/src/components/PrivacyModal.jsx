// PrivacyModal.jsx
// Privacy Policy — data collection, cookies, third-party services, user rights

import { X } from 'lucide-react';

const SECTIONS = [
  {
    title: "1. Information We Collect",
    body: [
      "We may collect information that you provide directly, including your name, email address, chat messages, uploaded files, and generated images.",
      "Basic technical information such as browser type, device information, and IP address may also be collected for security and service improvement."
    ],
  },
  {
    title: "2. How We Use Your Information",
    body: [
      "Your information is used to provide AI responses, save chat history, manage projects, generate images, and improve the overall experience.",
      "We may also use limited data to maintain security, detect abuse, and improve system reliability."
    ],
  },
  {
    title: "3. AI Processing",
    body: [
      "Some requests are processed through trusted third-party AI providers to generate responses or images.",
      "Only the information necessary to complete your request is shared with these providers."
    ],
  },
  {
    title: "4. Chat History & Projects",
    body: [
      "If you are logged in, your chat history, projects, and generated images may be stored securely so you can access them later.",
      "Guest conversations are not permanently linked to an account."
    ],
  },
  {
    title: "5. Data Security",
    body: [
      "We use reasonable security measures to protect your information from unauthorized access, misuse, or disclosure.",
      "However, no online service can guarantee complete security."
    ],
  },
  {
    title: "6. Data Sharing",
    body: [
      "We do not sell your personal information.",
      "Information is shared only with trusted service providers when required to operate SetrxAI or when legally required."
    ],
  },
  {
    title: "7. Cookies & Local Storage",
    body: [
      "SetrxAI may use cookies or browser local storage to keep you signed in, remember your preferences, and improve your experience."
    ],
  },
  {
    title: "8. Children's Privacy",
    body: [
      "Users under the required minimum age should use SetrxAI only with permission from a parent or legal guardian, where applicable."
    ],
  },
  {
    title: "9. Your Rights",
    body: [
      "You may request access, correction, or deletion of your personal data where permitted by applicable law."
    ],
  },
  {
    title: "10. Changes to This Policy",
    body: [
      "This Privacy Policy may be updated from time to time. Continued use of SetrxAI after updates means you accept the revised policy."
    ],
  },
  {
    title: "11. Contact",
    body: [
      "If you have questions about this Privacy Policy, please contact us at support@setrxai.com."
    ],
  },
];

export default function PrivacyModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl p-6 shadow-2xl animate-fadeInUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 bg-clip-text text-transparent">
            Privacy Policy
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors shrink-0">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-zinc-500 mb-5">Last updated: July 2026</p>

        <div className="space-y-5 text-sm text-zinc-600 dark:text-zinc-400">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{section.title}</h3>
              <ul className="list-disc pl-5 space-y-1 leading-relaxed">
                {section.body.map((line, i) => <li key={i}>{line}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-xl py-2 text-sm font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
}