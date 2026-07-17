import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Orders from './pages/Orders';
import Verifications from './pages/Verifications';
import MapPreview from './pages/MapPreview';
import Feedbacks from './pages/Feedbacks';

function Private({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('egofind_admin_token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <Private>
              <AdminLayout />
            </Private>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="orders" element={<Orders />} />
          <Route path="verifications" element={<Verifications />} />
          <Route path="map" element={<MapPreview />} />
          <Route path="feedbacks" element={<Feedbacks />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
