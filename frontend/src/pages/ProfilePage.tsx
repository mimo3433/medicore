import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/auth/me').then(res => res.data.data),
    enabled: !!user,
  });

  const [editForm, setEditForm] = useState<any>({});

  const updateProfile = useMutation({
    mutationFn: (data: any) => {
      if (user?.role === 'DOCTOR') {
        return api.put('/doctors/me/profile', data);
      }
      // For patients, use the auth me endpoint or a generic update
      // Since there's no dedicated patient profile endpoint, we'll create one in the backend
      return api.put('/auth/me', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditing(false);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!profile) return <div className="text-center py-16">Not logged in</div>;

  const handleEdit = () => {
    setEditForm(user?.role === 'DOCTOR' ? profile.doctor || {} : profile.patient || {});
    setIsEditing(true);
  };

  const handleSave = () => {
    const payload = { ...editForm };
    // Convert languages string to array for doctors
    if (user?.role === 'DOCTOR' && payload.languages) {
      payload.languages = typeof payload.languages === 'string'
        ? payload.languages.split(',').map((s: string) => s.trim()).filter(Boolean)
        : payload.languages;
    }
    // Convert string numbers to actual numbers
    if (payload.experience) payload.experience = parseInt(payload.experience);
    if (payload.consultationFee) payload.consultationFee = parseFloat(payload.consultationFee);
    updateProfile.mutate(payload);
  };

  const renderPatientView = () => {
    const patient = profile.patient || {};
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <InfoItem label="Full Name" value={patient.fullName || '-'} />
          <InfoItem label="Email" value={profile.email} />
          <InfoItem label="Gender" value={patient.gender || '-'} />
          <InfoItem label="Date of Birth" value={patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '-'} />
          <InfoItem label="Phone" value={patient.phone || '-'} />
          <InfoItem label="Blood Group" value={patient.bloodGroup || '-'} />
        </div>
        <InfoItem label="Address" value={patient.address || '-'} />
        <InfoItem label="Allergies" value={patient.allergies || '-'} />
        <InfoItem label="Emergency Contact" value={patient.emergencyContact || '-'} />
        <InfoItem label="Role" value={profile.role} />
      </div>
    );
  };

  const renderDoctorView = () => {
    const doctor = profile.doctor || {};
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <InfoItem label="Full Name" value={doctor.fullName || '-'} />
          <InfoItem label="Email" value={profile.email} />
          <InfoItem label="Specialization" value={doctor.specialization || '-'} />
          <InfoItem label="Qualification" value={doctor.qualification || '-'} />
          <InfoItem label="Experience" value={doctor.experience ? `${doctor.experience} years` : '-'} />
          <InfoItem label="Consultation Fee" value={doctor.consultationFee ? `$${doctor.consultationFee}` : '-'} />
          <InfoItem label="Rating" value={doctor.rating ? `${doctor.rating} / 5` : '-'} />
          <InfoItem label="Verified" value={doctor.isVerified ? 'Yes' : 'No'} />
        </div>
        <InfoItem label="Clinic Location" value={doctor.clinicLocation || '-'} />
        <InfoItem label="Clinic Address" value={doctor.clinicAddress || '-'} />
        <InfoItem label="Bio" value={doctor.bio || '-'} />
        <InfoItem label="Languages" value={doctor.languages?.join(', ') || '-'} />
        <InfoItem label="Role" value={profile.role} />
      </div>
    );
  };

  const renderEditForm = () => {
    if (user?.role === 'DOCTOR') {
      return (
        <div className="space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input value={editForm.fullName || ''} onChange={(e) => setEditForm({...editForm, fullName: e.target.value})} />
          </div>
          <div>
            <Label>Specialization</Label>
            <Input value={editForm.specialization || ''} onChange={(e) => setEditForm({...editForm, specialization: e.target.value})} />
          </div>
          <div>
            <Label>Qualification</Label>
            <Input value={editForm.qualification || ''} onChange={(e) => setEditForm({...editForm, qualification: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Experience (years)</Label>
              <Input type="number" value={editForm.experience || ''} onChange={(e) => setEditForm({...editForm, experience: e.target.value})} />
            </div>
            <div>
              <Label>Consultation Fee</Label>
              <Input type="number" value={editForm.consultationFee || ''} onChange={(e) => setEditForm({...editForm, consultationFee: e.target.value})} />
            </div>
          </div>
          <div>
            <Label>Bio</Label>
            <textarea
              className="w-full rounded-md border px-3 py-2 min-h-[80px]"
              value={editForm.bio || ''}
              onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
            />
          </div>
          <div>
            <Label>Clinic Location</Label>
            <Input value={editForm.clinicLocation || ''} onChange={(e) => setEditForm({...editForm, clinicLocation: e.target.value})} placeholder="e.g. New York, NY" />
          </div>
          <div>
            <Label>Clinic Address</Label>
            <Input value={editForm.clinicAddress || ''} onChange={(e) => setEditForm({...editForm, clinicAddress: e.target.value})} placeholder="e.g. 123 Main St, Suite 100" />
          </div>
          <div>
            <Label>Languages (comma separated)</Label>
            <Input value={Array.isArray(editForm.languages) ? editForm.languages.join(', ') : editForm.languages || ''} onChange={(e) => setEditForm({...editForm, languages: e.target.value})} />
          </div>
        </div>
      );
    }

    // Patient edit form
    return (
      <div className="space-y-4">
        <div>
          <Label>Full Name</Label>
          <Input value={editForm.fullName || ''} onChange={(e) => setEditForm({...editForm, fullName: e.target.value})} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={editForm.phone || ''} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} />
        </div>
        <div>
          <Label>Address</Label>
          <Input value={editForm.address || ''} onChange={(e) => setEditForm({...editForm, address: e.target.value})} />
        </div>
        <div>
          <Label>Allergies</Label>
          <Input value={editForm.allergies || ''} onChange={(e) => setEditForm({...editForm, allergies: e.target.value})} />
        </div>
        <div>
          <Label>Emergency Contact</Label>
          <Input value={editForm.emergencyContact || ''} onChange={(e) => setEditForm({...editForm, emergencyContact: e.target.value})} />
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>My Profile</CardTitle>
          {!isEditing ? (
            <Button variant="outline" onClick={handleEdit}>Edit Profile</Button>
          ) : (
            <div className="space-x-2">
              <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={updateProfile.isPending}>
                {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isEditing ? renderEditForm() : (
            user?.role === 'DOCTOR' ? renderDoctorView() : renderPatientView()
          )}
          {updateProfile.isError && (
            <p className="text-red-600 text-sm mt-4">
              {(updateProfile.error as any)?.response?.data?.message || 'Failed to update profile'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
