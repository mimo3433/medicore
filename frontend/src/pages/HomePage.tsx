import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Stethoscope, Calendar, Shield, Clock, Users, HeartPulse, Search } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function HomePage() {
  const { user } = useAuthStore();
  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYtMi42ODYgNi02cy0yLjY4Ni02LTYtNi02IDIuNjg2LTYgNiAyLjY4NiA2IDYgNnptMCAwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvZz48L3N2Zz4=')] opacity-20" />
        <div className="relative px-8 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-8 border border-white/20">
            <HeartPulse className="w-4 h-4" />
            Trusted by 10,000+ patients
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            Healthcare Made<br />
            <span className="text-blue-200">Simple & Accessible</span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-10">
            Book appointments with top healthcare professionals in minutes. Your health is our top priority.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/doctors">
              <Button size="lg" className="gap-2 bg-white text-blue-700 hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all hover:scale-105 font-semibold h-14 px-8">
                <Search className="w-5 h-5" />
                Find a Doctor
              </Button>
            </Link>
            {!user && (
              <Link to="/register">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/20 h-14 px-8 backdrop-blur-sm">
                  Get Started Free
                </Button>
              </Link>
            )}
            {user && (
              <Link to={user.role === 'DOCTOR' ? '/dashboard/doctor' : '/dashboard/patient'}>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/20 h-14 px-8 backdrop-blur-sm">
                  Go to Dashboard
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatItem icon={<Users className="w-6 h-6" />} value="500+" label="Expert Doctors" />
        <StatItem icon={<Calendar className="w-6 h-6" />} value="50k+" label="Bookings Made" />
        <StatItem icon={<Clock className="w-6 h-6" />} value="2min" label="Avg. Booking Time" />
        <StatItem icon={<Shield className="w-6 h-6" />} value="100%" label="Secure Payments" />
      </section>

      {/* Features */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Why Choose MediCore?</h2>
          <p className="text-gray-600 max-w-xl mx-auto">We connect you with the best healthcare professionals for a seamless experience</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Stethoscope className="w-8 h-8 text-blue-600" />}
            title="Expert Doctors"
            desc="Access a network of verified, experienced healthcare professionals across all specialties"
            color="blue"
          />
          <FeatureCard
            icon={<Calendar className="w-8 h-8 text-purple-600" />}
            title="Instant Booking"
            desc="Schedule appointments in seconds with real-time availability and instant confirmations"
            color="purple"
          />
          <FeatureCard
            icon={<Shield className="w-8 h-8 text-emerald-600" />}
            title="Secure & Private"
            desc="End-to-end encrypted payments and HIPAA-compliant data protection for your safety"
            color="emerald"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 p-10 md:p-16 text-center text-white shadow-xl">
        <div className="relative">
          <h2 className="text-3xl font-bold mb-4">Ready to Take Control of Your Health?</h2>
          <p className="text-emerald-100 mb-8 max-w-lg mx-auto">Join thousands of patients who trust MediCore for their healthcare needs</p>
          {!user ? (
            <Link to="/register">
              <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg font-semibold h-14 px-8 transition-all hover:scale-105">
                Create Your Account
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          ) : (
            <Link to={user.role === 'DOCTOR' ? '/dashboard/doctor' : '/dashboard/patient'}>
              <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg font-semibold h-14 px-8 transition-all hover:scale-105">
                Go to Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}

function StatItem({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="text-center p-6 bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 mb-3">
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

function FeatureCard({ icon, title, desc, color }: { icon: React.ReactNode; title: string; desc: string; color: string }) {
  const bgColors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100',
    purple: 'bg-purple-50 border-purple-100',
    emerald: 'bg-emerald-50 border-emerald-100',
  };
  return (
    <div className={`p-8 rounded-2xl border hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${bgColors[color]}`}>
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{desc}</p>
    </div>
  );
}
