import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Calendar } from 'lucide-react';

export default function BookingPage() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const queryClient = useQueryClient();

  const { data: doctor } = useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: () => api.get(`/doctors/${doctorId}`).then(res => res.data.data),
  });

  const { data: slots, isLoading: slotsLoading, error: slotsError } = useQuery({
    queryKey: ['slots', doctorId, selectedDate],
    queryFn: async () => {
      const url = `/schedules/${doctorId}/available?date=${selectedDate}`;
      console.log('Fetching slots from:', url);
      const res = await api.get(url);
      console.log('Slots response:', res.data);
      return res.data.data;
    },
  });

  const bookMutation = useMutation({
    mutationFn: (slotId: string) => api.post('/appointments', { doctorId, slotId }),
    onSuccess: () => {
      navigate('/dashboard/patient');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Booking failed';
      alert(msg);
      setSelectedSlot(null);
      queryClient.invalidateQueries({ queryKey: ['slots', doctorId, selectedDate] });
    },
  });

  const handleDateChange = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
    setSelectedSlot(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Book Appointment</h1>
      <Card>
        <CardHeader>
          <CardTitle>{doctor?.fullName}</CardTitle>
          <p className="text-gray-600">{doctor?.specialization}</p>
        </CardHeader>
        <CardContent>
          {/* Date Picker */}
          <div className="mb-6">
            <p className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Select Date
            </p>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => handleDateChange(-1)} disabled={selectedDate === new Date().toISOString().split('T')[0]}>
                Previous
              </Button>
              <span className="font-medium text-lg min-w-[200px] text-center">{formatDate(selectedDate)}</span>
              <Button variant="outline" onClick={() => handleDateChange(1)}>
                Next
              </Button>
            </div>
          </div>

          {/* Slots */}
          <div className="mb-4">
            <p className="font-semibold mb-3">Available Slots</p>
            {slotsLoading ? (
              <p className="text-gray-500">Loading slots...</p>
            ) : slotsError ? (
              <p className="text-red-500">Error loading slots: {(slotsError as any)?.response?.data?.message || (slotsError as any)?.message || 'Unknown error'}</p>
            ) : !slots || slots.length === 0 ? (
              <p className="text-gray-500">No available slots for this date</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((slot: any) => {
                  const isBooked = slot.status !== 'AVAILABLE';
                  const isSelected = selectedSlot === slot.id;
                  return (
                    <button
                      key={slot.id}
                      onClick={() => !isBooked && setSelectedSlot(slot.id)}
                      disabled={isBooked}
                      className={`relative rounded-lg border px-3 py-2 text-sm font-medium transition-colors text-center ${
                        isBooked
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                      }`}
                    >
                      <span className="block">{slot.startTime}</span>
                      {isBooked && <span className="block text-xs mt-0.5">Booked</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <Button
            className="w-full"
            disabled={!selectedSlot || bookMutation.isPending}
            onClick={() => selectedSlot && bookMutation.mutate(selectedSlot)}
          >
            {bookMutation.isPending ? 'Booking...' : 'Confirm Booking'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
