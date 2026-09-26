import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      {/* Simple Header */}
      <header className="border-b border-slate-200 py-4 px-6 md:px-12 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight text-slate-900">
          Helio
        </Link>
        <nav className="space-x-4">
          <Link href="/terms" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            Terms of Service
          </Link>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto py-12 px-6 sm:py-20 lg:px-8">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-8">
          Privacy Policy
        </h1>
        <div className="prose prose-slate prose-lg max-w-none text-slate-700 space-y-6">
          <p className="font-medium text-slate-900">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <p>
            This Privacy Policy describes how Helio ("we", "us", or "our") collects, uses, and discloses your personal information when you use our website and chatbot platform (the "Services").
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">1. Information We Collect</h2>
          <p>We collect information you provide directly to us, including:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Account Information:</strong> Name, email address, password, and billing details when you register for an account.</li>
            <li><strong>Platform Data:</strong> Knowledge base documents, FAQs, and business information you upload to train your chatbot.</li>
            <li><strong>Integration Data:</strong> When you connect third-party services (like Google Calendar), we securely store the authentication tokens required to perform actions (like booking appointments) on your behalf.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">2. End-User Data (Your Customers)</h2>
          <p>
            When end-users interact with a Helio chatbot on your website, we process and store the chat transcripts, contact information (leads), and appointment details. As a business user of Helio, you are the Data Controller of your end-users' data, and Helio acts as a Data Processor. We do not sell or use your end-users' data for marketing purposes.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">3. How We Use Information</h2>
          <p>We use the collected information to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide, maintain, and improve the Services.</li>
            <li>Process transactions and send related billing information.</li>
            <li>Facilitate third-party integrations (e.g., creating calendar events).</li>
            <li>Send technical notices, security alerts, and support messages.</li>
            <li>Monitor and analyze trends, usage, and activities in connection with the Services.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">4. Sharing of Information</h2>
          <p>
            We do not sell your personal information. We may share information with third-party service providers who perform services on our behalf (e.g., hosting providers, payment processors, and foundational AI models like OpenAI or Anthropic used for processing chat messages). These third parties are bound by strict confidentiality obligations.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">5. Google Workspace API Data</h2>
          <p>
            Helio's use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google API Services User Data Policy</a>, including the Limited Use requirements. We only request scopes necessary to schedule appointments (e.g., `calendar.events`) and do not read your personal emails or unrelated calendar events.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">6. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no internet transmission is completely secure, and we cannot guarantee absolute security.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">7. Your Rights</h2>
          <p>
            Depending on your location, you may have the right to access, correct, delete, or restrict the processing of your personal data. To exercise these rights, please contact us.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">8. Contact Us</h2>
          <p>
            If you have any questions or concerns about this Privacy Policy, please contact us at privacy@helio.chat.
          </p>
        </div>
      </main>

      <footer className="bg-slate-50 border-t border-slate-200 py-12 mt-12">
        <div className="max-w-4xl mx-auto px-6 text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} Helio Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
