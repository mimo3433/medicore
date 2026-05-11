import { Shield, Lock, Eye, Database, AlertTriangle } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <Shield className="w-16 h-16 mx-auto mb-4 text-blue-600" />
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="space-y-8">
        <section className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            Information We Collect
          </h2>
          <ul className="space-y-2 text-gray-600">
            <li>• Personal information: name, email, phone, address</li>
            <li>• Medical information: history, symptoms, conditions</li>
            <li>• Appointment data: scheduling, booking history</li>
            <li>• Payment data: processed securely via Stripe (PCI compliant)</li>
            <li>• Technical data: IP address, device information, browser type</li>
          </ul>
        </section>

        <section className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            How We Protect Your Data
          </h2>
          <ul className="space-y-2 text-gray-600">
            <li>• SSL/TLS encryption for all data in transit</li>
            <li>• AES-256 encryption for data at rest</li>
            <li>• Role-based access control for all personnel</li>
            <li>• Regular security audits and penetration testing</li>
            <li>• HIPAA-compliant data handling practices</li>
          </ul>
        </section>

        <section className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Data Retention and Deletion
          </h2>
          <ul className="space-y-2 text-gray-600">
            <li>• Account data retained while your account is active</li>
            <li>• Medical records kept for 7 years (legal requirement)</li>
            <li>• Appointment history retained for 3 years</li>
            <li>• You may request data deletion at any time</li>
            <li>• Payment data deleted after 1 year (Stripe policy)</li>
          </ul>
        </section>

        <section className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-blue-600" />
            Legal Compliance
          </h2>
          <ul className="space-y-2 text-gray-600">
            <li>• HIPAA (Health Insurance Portability and Accountability Act)</li>
            <li>• GDPR (General Data Protection Regulation) for EU users</li>
            <li>• CCPA (California Consumer Privacy Act) for California residents</li>
            <li>• PCI DSS (Payment Card Industry Data Security Standard)</li>
          </ul>
        </section>

        <section className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">Your Rights</h2>
          <ul className="space-y-2 text-blue-800">
            <li>• Access your personal data on request</li>
            <li>• Correct inaccurate information</li>
            <li>• Delete your account and associated data</li>
            <li>• Opt out of marketing communications</li>
            <li>• Data portability (export your data)</li>
            <li>• Lodge a complaint with data protection authorities</li>
          </ul>
        </section>

        <section className="bg-red-50 rounded-xl p-6 border border-red-200">
          <h2 className="text-xl font-semibold mb-4 text-red-900">Data Breach Notification</h2>
          <p className="text-red-800">
            In the event of a data breach affecting your personal information, we will notify you within 72 hours in accordance with applicable law.
          </p>
        </section>
      </div>
    </div>
  );
}
