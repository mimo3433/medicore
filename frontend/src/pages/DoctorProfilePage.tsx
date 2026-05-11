import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, MapPin, Clock, GraduationCap, MessageSquare, Send } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

export default function DoctorProfilePage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const { data: doctor, refetch } = useQuery({
    queryKey: ['doctor', id],
    queryFn: () => api.get(`/doctors/${id}`).then(res => res.data.data),
  });

  const reviewMutation = useMutation({
    mutationFn: () => api.post(`/doctors/${id}/reviews`, { rating, comment }),
    onSuccess: () => {
      setComment('');
      setRating(5);
      refetch();
    },
  });

  if (!doctor) return <div>Loading...</div>;

  const reviews = doctor.reviews || [];
  const isPatient = user?.role === 'PATIENT';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{doctor.fullName}</CardTitle>
          <p className="text-xl text-gray-600">{doctor.specialization}</p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="font-semibold">{doctor.rating || '0.0'}</p>
                <p className="text-sm text-gray-600">{doctor.totalReviews || 0} reviews</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-semibold">{doctor.clinicAddress || 'Address not listed'}</p>
                <p className="text-sm text-gray-600">Clinic Address</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <GraduationCap className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-semibold">{doctor.qualification}</p>
                <p className="text-sm text-gray-600">Qualification</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-semibold">${doctor.consultationFee}</p>
                <p className="text-sm text-gray-600">Consultation fee</p>
              </div>
            </div>
          </div>
          <div className="mb-6">
            <h3 className="font-semibold mb-2">About</h3>
            <p className="text-gray-600">{doctor.bio || 'No bio available'}</p>
          </div>
          <Link to={`/booking/${doctor.id}`}>
            <Button size="lg" className="w-full">Book Appointment</Button>
          </Link>
        </CardContent>
      </Card>

      {/* Reviews Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Patient Reviews ({reviews.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-gray-500">No reviews yet.</p>
          ) : (
            reviews.map((review: any) => (
              <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{review.patient?.fullName || 'Anonymous'}</span>
                  <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                {review.comment && <p className="text-gray-600 text-sm">{review.comment}</p>}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Review Form */}
      {isPatient && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Write a Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Rating</label>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1"
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Comment</label>
                <textarea
                  className="w-full mt-1 rounded-md border px-3 py-2 min-h-[80px]"
                  placeholder="Share your experience..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
              <Button
                onClick={() => reviewMutation.mutate()}
                disabled={reviewMutation.isPending}
                className="w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                {reviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
              </Button>
              {reviewMutation.isError && (
                <p className="text-sm text-red-600">
                  {(reviewMutation.error as any)?.response?.data?.message || 'Failed to submit review'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
