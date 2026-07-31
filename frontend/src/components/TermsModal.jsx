// TermsModal.jsx
// Terms & Conditions

import { X } from 'lucide-react';

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: [
      "By using SetrxAI, you agree to these Terms & Conditions. If you do not agree with these terms, please do not use the service."
    ],
  },
  {
    title: "2. Service Description",
    body: [
      "SetrxAI is an AI-powered assistant that provides chat, study assistance, coding support, image generation, and other AI-powered features.",
      "Some features such as Chat History, Projects, and Image Gallery are only available to logged-in users."
    ],
  },
  {
    title: "3. Account Responsibility",
    body: [
      "You are responsible for maintaining the security of your account and password.",
      "You are responsible for all activities performed through your account.",
      "If you believe your account has been compromised, please contact us immediately."
    ],
  },
  {
    title: "4. Acceptable Use",
    body: [
      "Do not use SetrxAI for illegal, abusive, harmful, or fraudulent activities.",
      "Do not generate or distribute content involving harassment, hate speech, violence, or copyright infringement.",
      "Do not attempt to reverse engineer, disrupt, exploit, or abuse the service."
    ],
  },
  {
    title: "5. AI Content Disclaimer",
    body: [
      "AI-generated responses and images may occasionally be inaccurate, incomplete, or outdated.",
      "Do not rely solely on SetrxAI for medical, legal, financial, or other critical decisions.",
      "We do not guarantee the accuracy of AI-generated content."
    ],
  },
  {
    title: "6. Intellectual Property",
    body: [
      "You retain ownership of the content you create using SetrxAI.",
      "The SetrxAI name, logo, branding, and design are protected and may not be copied without permission."
    ],
  },
  {
    title: "7. Service Availability",
    body: [
      "SetrxAI relies on third-party AI providers, so temporary downtime, slower responses, or service interruptions may occur.",
      "We may modify, improve, add, or remove features at any time without prior notice."
    ],
  },
  {
    title: "8. Account Suspension or Termination",
    body: [
      "Accounts violating these Terms may be suspended or permanently terminated.",
      "You may request permanent deletion of your account by contacting our support team."
    ],
  },
  {
    title: "9. Limitation of Liability",
    body: [
      "SetrxAI is provided on an 'as is' and 'as available' basis.",
      "To the maximum extent permitted by law, SetrxAI shall not be liable for indirect or consequential damages arising from the use of the service."
    ],
  },
  {
    title: "10. Changes to These Terms",
    body: [
      "These Terms may be updated from time to time. Continued use of SetrxAI after changes means you accept the updated Terms."
    ],
  },
  {
    title: "11. Contact",
    body: [
      "For questions regarding these Terms, contact us at support@setrxai.com."
    ],
  },
];

export default function TermsModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl p-6 shadow-2xl animate-fadeInUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 bg-clip-text text-transparent">
            Terms & Conditions
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