import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, DollarSign, Star, CheckCircle, AlertCircle, Loader2, XCircle, CheckSquare } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Link } from 'react-router-dom';

export default function DoctorDashboard() {
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['doctor-profile'],
    queryFn: () => api.get('/doctors/me/profile').then(res => res.data.data),
  });

  const { data: appointmentsResponse, isLoading: appointmentsLoading, refetch } = useQuery({
    queryKey: ['doctor-appointments'],
    queryFn: () => api.get('/appointments/doctor').then(res => res.data.data),
  });

  const appointments = appointmentsResponse?.appointments || [];

  const isLoading = profileLoading || appointmentsLoading;

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/appointments/${id}/status`, { status }),
    onSuccess: () => refetch(),
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Failed to update status';
      console.error('Confirm error:', msg);
      alert(`Error: ${msg}`);
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.put(`/appointments/${id}/complete`),
    onSuccess: () => refetch(),
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Failed to complete appointment';
      console.error('Complete error:', msg);
      alert(`Error: ${msg}`);
    },
  });

  const isAppointmentTimePassed = (apt: any) => {
    if (!apt.slot?.date || !apt.slot?.startTime) return false;
    const aptDate = new Date(apt.slot.date);
    const [h, m] = apt.slot.startTime.split(':');
    aptDate.setHours(parseInt(h), parseInt(m), 0, 0);
    return new Date() >= aptDate;
  };

  const stats = {
    today: appointments?.filter((a: any) => {
      const today = new Date().toISOString().split('T')[0];
      return a.createdAt?.startsWith(today) || false;
    }).length || 0,
    pending: appointments?.filter((a: any) => a.status === 'PENDING').length || 0,
    confirmed: appointments?.filter((a: any) => a.status === 'CONFIRMED').length || 0,
    completed: appointments?.filter((a: any) => a.status === 'COMPLETED').length || 0,
    totalPatients: new Set(appointments?.map((a: any) => a.patientId)).size || 0,
    earnings: appointments?.filter((a: any) => a.status === 'COMPLETED').length * (profile?.consultationFee || 0),
    rating: profile?.rating || 0,
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
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-white/10 opacity-20" />
        <div className="relative">
          <h1 className="text-3xl font-bold mb-2">Welcome back, Dr. {profile?.fullName?.split(' ')[1] || profile?.fullName}</h1>
          <p className="text-blue-100">{profile?.specialization} | {profile?.experience || 0}+ years experience</p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
              <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
              <span className="font-semibold">{stats.rating}</span>
            </div>
            <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
              <CheckCircle className="w-4 h-4 text-green-300" />
              <span>{stats.confirmed} confirmed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Calendar className="h-5 w-5 text-blue-600" />} label="Today" value={stats.today} color="blue" />
        <StatCard icon={<AlertCircle className="h-5 w-5 text-amber-600" />} label="Pending" value={stats.pending} color="amber" />
        <StatCard icon={<Users className="h-5 w-5 text-emerald-600" />} label="Patients" value={stats.totalPatients} color="emerald" />
        <StatCard icon={<DollarSign className="h-5 w-5 text-purple-600" />} label="Earnings" value={`$${stats.earnings}`} color="purple" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Appointments List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Appointments</h2>
            <span className="text-sm text-gray-500">{appointments.length} total</span>
          </div>
          {appointments?.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No appointments yet</p>
                <p className="text-sm text-gray-400 mt-1">Patients will appear here once they book</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt: any) => (
                <Card key={apt.id} className="hover:shadow-md transition-shadow border-l-4" style={{
                  borderLeftColor: apt.status === 'CONFIRMED' ? '#22c55e' : apt.status === 'PENDING' ? '#f59e0b' : apt.status === 'CANCELLED' ? '#ef4444' : '#3b82f6'
                }}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                          {apt.patient?.fullName?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{apt.patient?.fullName || `Patient #${apt.patientId?.slice(0, 6)}`}</p>
                          <p className="text-sm text-gray-500">{apt.reason || 'General consultation'}</p>
                          {apt.slot && (
                            <p className="text-xs text-gray-400">
                              {new Date(apt.slot.date).toLocaleDateString()} at {apt.slot.startTime}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {apt.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => updateStatusMutation.mutate({ id: apt.id, status: 'CONFIRMED' })}
                              disabled={updateStatusMutation.isPending}
                            >
                              <CheckSquare className="w-3 h-3 mr-1" />
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateStatusMutation.mutate({ id: apt.id, status: 'CANCELLED' })}
                              disabled={updateStatusMutation.isPending}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Cancel
                            </Button>
                          </>
                        )}
                        {apt.status === 'CONFIRMED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-300 text-blue-700"
                            onClick={() => completeMutation.mutate(apt.id)}
                            disabled={completeMutation.isPending || !isAppointmentTimePassed(apt)}
                            title={!isAppointmentTimePassed(apt) ? 'Cannot complete before scheduled time' : ''}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Complete
                          </Button>
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          apt.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                          apt.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          apt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {apt.status}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Profile Quick View */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Your Profile</h2>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 space-y-4">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-3xl font-bold text-blue-600">
                  {profile?.fullName?.charAt(0) || 'D'}
                </div>
                <h3 className="mt-3 font-bold text-gray-900">{profile?.fullName}</h3>
                <p className="text-blue-600 text-sm">{profile?.specialization}</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Fee</span>
                  <span className="font-medium">${profile?.consultationFee || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Duration</span>
                  <span className="font-medium">{profile?.consultationDuration || 30} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Experience</span>
                  <span className="font-medium">{profile?.experience || 0} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Languages</span>
                  <span className="font-medium">{profile?.languages?.join(', ') || '-'}</span>
                </div>
              </div>
              <Link to="/profile">
                <Button variant="outline" className="w-full">Edit Profile</Button>
              </Link>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) {
  const bgColors: Record<string, string> = {
    blue: 'bg-blue-50',
    amber: 'bg-amber-50',
    emerald: 'bg-emerald-50',
    purple: 'bg-purple-50',
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
