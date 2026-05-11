import { Stethoscope, Mail, Phone, MapPin, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold">MediCore</span>
            </div>
            <p className="text-blue-200 text-sm">
              Your trusted healthcare platform for booking appointments with verified doctors.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-blue-200 text-sm">
              <li><Link to="/doctors" className="hover:text-white transition-colors">Find Doctors</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-blue-200 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                support@medicore.com
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                +1 (555) 123-4567
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                123 Healthcare Ave, NY
              </li>
            </ul>
          </div>

          {/* For Doctors */}
          <div>
            <h3 className="font-semibold mb-4">For Doctors</h3>
            <ul className="space-y-2 text-blue-200 text-sm">
              <li><Link to="/register" className="hover:text-white transition-colors">Join as Doctor</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Doctor Login</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-blue-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-blue-300 text-sm">
            © {new Date().getFullYear()} MediCore. All rights reserved.
          </p>
          <p className="text-blue-300 text-sm flex items-center gap-1">
            Made with <Heart className="w-4 h-4 text-red-400 fill-red-400" /> for better healthcare
          </p>
        </div>
      </div>
    </footer>
  );
}
