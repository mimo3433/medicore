import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, CheckCircle, XCircle, Stethoscope, Search, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Link } from 'react-router-dom';

export default function PatientDashboard() {
  const { data: response, isLoading } = useQuery({
    queryKey: ['patient-appointments'],
    queryFn: () => api.get('/appointments/my').then(res => res.data.data),
  });

  const appointments = response?.appointments || [];

  const stats = {
    upcoming: appointments?.filter((a: any) => a.status === 'CONFIRMED' || a.status === 'PENDING').length || 0,
    completed: appointments?.filter((a: any) => a.status === 'COMPLETED').length || 0,
    cancelled: appointments?.filter((a: any) => a.status === 'CANCELLED').length || 0,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-white/10 opacity-20" />
        <div className="relative">
          <h1 className="text-3xl font-bold mb-2">Your Health Dashboard</h1>
          <p className="text-emerald-100">Manage your appointments and health records</p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
              <Calendar className="w-4 h-4 text-emerald-200" />
              <span>{stats.upcoming} upcoming</span>
            </div>
            <Link to="/doctors">
              <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0">
                <Search className="w-4 h-4 mr-2" />
                Find Doctor
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <StatCard icon={<Calendar className="h-5 w-5 text-blue-600" />} label="Upcoming" value={stats.upcoming} color="blue" />
        <StatCard icon={<CheckCircle className="h-5 w-5 text-emerald-600" />} label="Completed" value={stats.completed} color="emerald" />
        <StatCard icon={<XCircle className="h-5 w-5 text-red-600" />} label="Cancelled" value={stats.cancelled} color="red" />
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Recent Appointments</h2>
        {appointments?.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="py-12 text-center">
              <Stethoscope className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No appointments yet</p>
              <Link to="/doctors">
                <Button>Book Your First Appointment</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {appointments?.slice(0, 8).map((appointment: any) => (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow border-l-4" style={{
                borderLeftColor: appointment.status === 'CONFIRMED' ? '#22c55e' : appointment.status === 'PENDING' ? '#f59e0b' : appointment.status === 'CANCELLED' ? '#ef4444' : '#3b82f6'
              }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                        {appointment.doctor?.fullName?.charAt(0) || 'D'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Dr. {appointment.doctor?.fullName || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{appointment.doctor?.specialization} | {new Date(appointment.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {appointment.slot?.startTime || 'TBD'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        appointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                        appointment.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        appointment.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) {
  const bgColors: Record<string, string> = {
    blue: 'bg-blue-50',
    emerald: 'bg-emerald-50',
    red: 'bg-red-50',
  };
  return (
    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={`${bgColors[color]} p-3 rounded-xl`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
