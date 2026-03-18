import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import Dashboard from './pages/Dashboard/Dashboard';
import Discovery from './pages/Discovery/Discovery';
import Messages from './pages/Messages/Messages';
import Profile from './pages/Profile/Profile';
import Network from './pages/Network/Network';
import Home from './pages/Home/Home';
import AddEvent from './pages/AddEvent/AddEvent';
import Onboarding from './pages/Onboarding/Onboarding';
import AdminDashboard from './pages/Admin/AdminDashboard';
import './App.css';

const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user?.role === 'admin' ? children : <Navigate to="/" />;
};

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="main-content-full">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/discovery" element={<Discovery />} />
            <Route path="/network" element={<Network />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/add-event" element={<AddEvent />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
