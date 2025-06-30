import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import InterviewPage from './pages/InterviewPage';
import FeedbackPage from './pages/FeedbackPage';
import SettingsPage from './pages/SettingsPage';
import MyInterviewsPage from './pages/MyInterviewsPage';
import ReportsPage from './pages/ReportsPage';
import MentorPage from './pages/MentorPage';
import { InterviewProvider } from './context/InterviewContext';
import './App.css';

function App() {
  return (
    <InterviewProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="/interview" element={<InterviewPage />} />
            <Route path="/feedback/:id" element={<FeedbackPage />} />
            <Route path="/my-interviews" element={<MyInterviewsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/mentor" element={<MentorPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </Router>
    </InterviewProvider>
  );
}

export default App;