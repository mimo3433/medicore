import { FileText, AlertCircle, CheckCircle, XCircle, Scale, Gavel } from 'lucide-react';

export default function TermsAndConditions() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <FileText className="w-16 h-16 mx-auto mb-4 text-blue-600" />
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms and Conditions</h1>
        <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="space-y-8">
        <section className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Acceptance of Terms
          </h2>
          <p className="text-gray-600">
            By creating an account and using MediCore services, you agree to these terms. If you do not agree, please do not use our platform. Continued use after changes constitutes acceptance of updated terms.
          </p>
        </section>

        <section className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            User Responsibilities
          </h2>
          <ul className="space-y-2 text-gray-600">
            <li>• Provide accurate and truthful information at all times</li>
            <li>• Keep your login credentials secure and confidential</li>
            <li>• Cancel appointments at least 24 hours in advance</li>
            <li>• Arrive on time for scheduled appointments</li>
            <li>• Respect healthcare professionals and staff</li>
            <li>• Update your profile information when it changes</li>
          </ul>
        </section>

        <section className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            Prohibited Activities
          </h2>
          <ul className="space-y-2 text-gray-600">
            <li>• Sharing accounts with others</li>
            <li>• Booking appointments without intent to attend</li>
            <li>• Harassing or abusing staff or other users</li>
            <li>• Submitting false medical information</li>
            <li>• Using the platform for illegal purposes</li>
            <li>• Attempting to circumvent payment requirements</li>
          </ul>
        </section>

        <section className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-600" />
            Legal and Liability
          </h2>
          <ul className="space-y-2 text-gray-600">
            <li>• MediCore is not liable for medical advice given by doctors</li>
            <li>• We are not responsible for third-party content</li>
            <li>• Users indemnify MediCore for claims arising from their actions</li>
            <li>• Maximum liability limited to fees paid in the past 12 months</li>
          </ul>
        </section>

        <section className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Medical Disclaimer
          </h2>
          <p className="text-gray-600">
            MediCore is a platform for booking appointments. We do not provide medical advice. Always consult your healthcare provider for medical concerns. In case of medical emergency, call emergency services immediately.
          </p>
        </section>

        <section className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Gavel className="w-5 h-5 text-blue-600" />
            Dispute Resolution
          </h2>
          <ul className="space-y-2 text-gray-600">
            <li>• Disputes resolved through negotiation first</li>
            <li>• Binding arbitration available for unresolved disputes</li>
            <li>• Governing law: State/Country where MediCore is registered</li>
            <li>• Class action waivers apply</li>
          </ul>
        </section>

        <section className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-purple-600" />
            Intellectual Property
          </h2>
          <ul className="space-y-2 text-gray-600">
            <li>• All content on MediCore is protected by copyright</li>
            <li>• Users may not copy, reproduce, or redistribute content</li>
            <li>• Trademarks and logos are property of MediCore</li>
          </ul>
        </section>

        <section className="bg-gray-50 rounded-xl p-6 border">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Account Termination</h2>
          <ul className="space-y-2 text-gray-600">
            <li>• We reserve the right to suspend or terminate accounts for violations</li>
            <li>• Users may terminate their account at any time</li>
            <li>• Refund policy applies to prepaid services</li>
          </ul>
        </section>

        <section className="bg-gray-50 rounded-xl p-6 border">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Modification of Terms</h2>
          <p className="text-gray-600">
            We may modify these terms at any time. Users will be notified of material changes via email or platform notification. Continued use constitutes acceptance.
          </p>
        </section>
      </div>
    </div>
  );
}
