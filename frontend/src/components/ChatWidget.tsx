import { useState } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';

const FAQS: Record<string, string> = {
  'how to book': 'To book an appointment: 1) Search for a doctor, 2) Click on the doctor\'s profile, 3) Click "Book Appointment", 4) Select a date and time, 5) Complete payment.',
  'cancel appointment': 'You can cancel appointments from your Patient Dashboard. Go to "My Appointments" and click "Cancel" on the appointment. Please cancel at least 24 hours in advance.',
  'payment': 'We accept credit/debit cards via Stripe. Payments are processed securely. You\'ll be charged when you confirm your booking.',
  'doctor': 'To register as a doctor: 1) Click "Get Started", 2) Select "Doctor" role, 3) Fill in your qualifications and experience, 4) Submit for verification.',
  'reset password': 'Click "Forgot Password" on the login page. Enter your email and we\'ll send you a reset link.',
  'contact': 'For support, email us at support@medicore.com or call +1 (555) 123-4567',
  'refund': 'Refunds are processed if you cancel 24+ hours before your appointment. Contact support for refund requests.',
  'default': 'I can help with booking appointments, cancellation, payments, doctor registration, password reset, and refunds. What do you need help with?',
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'bot', text: string }>>([
    { role: 'bot', text: 'Hi! I\'m MediCore\'s assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');

  const getBotResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();
    for (const [key, response] of Object.entries(FAQS)) {
      if (lowerInput.includes(key)) {
        return response;
      }
    }
    return FAQS.default;
  };

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');

    setTimeout(() => {
      const botResponse = getBotResponse(userMessage);
      setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
    }, 500);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-white rounded-2xl shadow-2xl w-80 max-h-96 flex flex-col border border-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <span className="font-semibold">MediCore Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded-full p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-64">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your question..."
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSend}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
