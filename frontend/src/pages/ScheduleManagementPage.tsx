import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Calendar, Clock, Plus, Trash2, CalendarDays, CheckCircle, X } from 'lucide-react';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function ScheduleManagementPage() {
  const [newSchedule, setNewSchedule] = useState({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 30,
  });
  const [confirmation, setConfirmation] = useState<any>(null);

  const { data: schedules, refetch } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => api.get('/schedules').then(res => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/schedules', data),
    onSuccess: () => refetch(),
    onError: (error: any) => {
      alert(`Error creating schedule: ${error.response?.data?.message || error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/schedules/${id}`),
    onSuccess: () => refetch(),
    onError: (error: any) => {
      alert(`Error deleting schedule: ${error.response?.data?.message || error.message}`);
    },
  });

  const generateSlotsMutation = useMutation({
    mutationFn: ({ scheduleId, startDate, endDate }: any) =>
      api.post(`/schedules/${scheduleId}/generate-slots`, { startDate, endDate }),
    onSuccess: (res) => {
      setConfirmation(res.data.data);
      refetch();
    },
    onError: (error: any) => {
      alert(`Error generating slots: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newSchedule);
  };

  const handleGenerateSlots = (scheduleId: string) => {
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    console.log('Generating slots:', { scheduleId, startDate, endDate });
    generateSlotsMutation.mutate({ scheduleId, startDate, endDate });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Schedule Management</h1>

      {/* Confirmation Card */}
      {confirmation && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">
                    {confirmation.count} slots generated successfully!
                  </p>
                  <p className="text-sm text-green-700">
                    Matched {confirmation.matchedDays} days in the selected range
                  </p>
                  {confirmation.slots && confirmation.slots.length > 0 && (
                    <div className="mt-2 text-sm text-green-700">
                      <p className="font-medium mb-1">Sample slots created:</p>
                      <div className="flex flex-wrap gap-2">
                        {confirmation.slots.map((slot: any, i: number) => (
                          <span key={i} className="bg-green-100 px-2 py-1 rounded text-xs">
                            {slot.startTime} - {slot.endTime}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setConfirmation(null)} className="text-green-700 hover:text-green-900">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Schedule Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateSchedule} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Day of Week</label>
              <select
                className="w-full p-2 border rounded-lg"
                value={newSchedule.dayOfWeek}
                onChange={(e) => setNewSchedule({ ...newSchedule, dayOfWeek: parseInt(e.target.value) })}
              >
                {DAYS_OF_WEEK.map(day => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Time</label>
                <Input
                  type="time"
                  value={newSchedule.startTime}
                  onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Time</label>
                <Input
                  type="time"
                  value={newSchedule.endTime}
                  onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Slot Duration (minutes)</label>
              <Input
                type="number"
                value={newSchedule.slotDuration}
                onChange={(e) => setNewSchedule({ ...newSchedule, slotDuration: parseInt(e.target.value) })}
                min={15}
                step={15}
              />
            </div>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Add Schedule'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Schedules */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Your Schedules</h2>
        {!schedules || schedules.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No schedules created yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {schedules?.map((schedule: any) => (
              <Card key={schedule.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold">{DAYS_OF_WEEK.find(d => d.value === schedule.dayOfWeek)?.label}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {schedule.startTime} - {schedule.endTime}
                        </p>
                        <p className="text-sm text-gray-500">{schedule.slotDuration} min slots</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          console.log('Button clicked, scheduleId:', schedule.id);
                          handleGenerateSlots(schedule.id);
                        }}
                        disabled={generateSlotsMutation.isPending}
                      >
                        Generate Slots
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(schedule.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
