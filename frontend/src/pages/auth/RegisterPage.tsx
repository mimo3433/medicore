import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import api from '@/lib/axios';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '', fullName: '', role: 'PATIENT' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedPrivacy || !agreedTerms) {
      setError('You must agree to the Privacy Policy and Terms & Conditions to create an account.');
      return;
    }
    setLoading(true);
    try {
      setError('');
      await api.post('/auth/register', formData);
      navigate('/login');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Registration failed. Please try again.';
      setError(msg);
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} required />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
            </div>
            <div>
              <Label>Role</Label>
              <select className="w-full h-10 rounded-md border px-3" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                <option value="PATIENT">Patient</option>
                <option value="DOCTOR">Doctor</option>
              </select>
            </div>
            <div className="space-y-2 pt-2">
              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedPrivacy}
                  onChange={(e) => setAgreedPrivacy(e.target.checked)}
                  className="mt-1"
                  required
                />
                <span>
                  I agree to the <Link to="/privacy" target="_blank" className="text-blue-600 hover:underline">Privacy Policy</Link>
                </span>
              </label>
              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-1"
                  required
                />
                <span>
                  I agree to the <Link to="/terms" target="_blank" className="text-blue-600 hover:underline">Terms & Conditions</Link>
                </span>
              </label>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading || !agreedPrivacy || !agreedTerms}>
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm">
            Already have an account? <Link to="/login" className="text-blue-600">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
