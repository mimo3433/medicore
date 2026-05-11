import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import PageTransition from './components/ui/PageTransition';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DoctorSearchPage from './pages/DoctorSearchPage';
import DoctorProfilePage from './pages/DoctorProfilePage';
import BookingPage from './pages/BookingPage';
import PatientDashboard from './pages/dashboard/PatientDashboard';
import DoctorDashboard from './pages/dashboard/DoctorDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import ProfilePage from './pages/ProfilePage';
import ScheduleManagementPage from './pages/ScheduleManagementPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
        <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
        <Route path="/privacy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
        <Route path="/terms" element={<PageTransition><TermsAndConditions /></PageTransition>} />
        <Route path="/doctors" element={<PageTransition><DoctorSearchPage /></PageTransition>} />
        <Route path="/doctors/:id" element={<PageTransition><DoctorProfilePage /></PageTransition>} />
        <Route
          path="/booking/:doctorId"
          element={
            <ProtectedRoute requiredRole="PATIENT">
              <PageTransition><BookingPage /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/patient"
          element={
            <ProtectedRoute requiredRole="PATIENT">
              <PageTransition><PatientDashboard /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/doctor"
          element={
            <ProtectedRoute requiredRole="DOCTOR">
              <PageTransition><DoctorDashboard /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <PageTransition><AdminDashboard /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <PageTransition><ProfilePage /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedules"
          element={
            <ProtectedRoute requiredRole="DOCTOR">
              <PageTransition><ScheduleManagementPage /></PageTransition>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Layout>
  );
}

export default App;
