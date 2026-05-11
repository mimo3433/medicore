import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Star, MapPin, Calendar, DollarSign, Languages, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

export default function DoctorSearchPage() {
  const { user } = useAuthStore();
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['doctors', searchQuery, user?.id],
    queryFn: () => api.get(`/doctors?search=${encodeURIComponent(searchQuery)}`).then(res => {
      const result = res.data.data;
      // Filter out current user's own doctor profile if present
      if (user?.id && result?.doctors) {
        result.doctors = result.doctors.filter((d: any) => d.userId !== user.id);
      }
      return result;
    }),
  });

  const doctors = data?.doctors || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  return (
    <div className="space-y-8">
      {/* Hero Search Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYtMi42ODYgNi02cy0yLjY4Ni02LTYtNi02IDIuNjg2LTYgNiAyLjY4NiA2IDYgNnptMCAwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative">
          <h1 className="text-4xl font-bold mb-2">Find Your Doctor</h1>
          <p className="text-blue-100 mb-6">Search by name, specialty, or condition</p>
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                className="pl-12 h-14 text-lg bg-white border-0 shadow-lg rounded-xl text-gray-900 placeholder:text-gray-400"
                placeholder="e.g. Dr. Smith, Cardiology, Dentist..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <Button type="submit" className="h-14 px-8 rounded-xl shadow-lg bg-indigo-500 hover:bg-indigo-600 transition-all hover:scale-105">
              Search
            </Button>
          </form>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {isLoading ? (
            <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Searching...</span>
          ) : (
            <>
              <span className="font-semibold text-gray-900">{data?.pagination?.total || 0}</span> doctors found
            </>
          )}
        </p>
      </div>

      {/* Doctor Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors?.map((doctor: any) => (
          <Card key={doctor.id} className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-white">
            <div className="relative h-24 bg-gradient-to-r from-blue-500 to-indigo-600">
              <div className="absolute -bottom-10 left-6">
                <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-lg">
                  <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-2xl font-bold text-blue-600">
                    {doctor.fullName?.charAt(0) || 'D'}
                  </div>
                </div>
              </div>
            </div>
            <CardContent className="pt-12 pb-6 px-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{doctor.fullName}</h3>
                  <p className="text-blue-600 font-medium">{doctor.specialization}</p>
                </div>
                <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-semibold text-yellow-700">{doctor.rating || '0.0'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 text-sm text-gray-600">
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{doctor.clinicAddress || 'Address not listed'}</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span>${doctor.consultationFee || 0}</span>
                </div>
                {doctor.languages?.length > 0 && (
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg col-span-2">
                    <Languages className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{doctor.languages.join(', ')}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <span className="text-sm text-gray-500">{doctor.totalReviews || 0} reviews</span>
                <Link to={`/doctors/${doctor.id}`}>
                  <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-200 transition-all hover:scale-105">
                    <Calendar className="w-4 h-4 mr-2" />
                    Book Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {!isLoading && doctors.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No doctors found</h3>
          <p className="text-gray-500">Try adjusting your search terms or browse all doctors</p>
        </div>
      )}
    </div>
  );
}
