
import React, { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import axios from 'axios';
import { useDispatch } from 'react-redux';

import Home from './pages/Home.jsx';
import Auth from "./pages/Auth";
import InterviewPage from './pages/InterviewPage.jsx';
import InterviewHistory from './pages/InterviewHistory.jsx';
import Pricing from './pages/Pricing.jsx';
import InterviewReport from './pages/InterviewReport.jsx';

import { setUserData } from './redux/userSlice.js';

// Backend URL:
// Configure VITE_API_URL in Vercel for production.
export const ServerUrl =
  import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const getUser = async () => {
      try {
        const result = await axios.get(
          `${ServerUrl}/api/user/current-user`,
          {
            withCredentials: true,
          }
        );

        dispatch(setUserData(result.data));
      } catch (error) {
        console.error(
          'Unable to fetch current user:',
          error.response?.data || error.message
        );

        dispatch(setUserData(null));
      }
    };

    getUser();
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/interview" element={<InterviewPage />} />
      <Route path="/history" element={<InterviewHistory />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route
        path="/report/:id"
        element={<InterviewReport />}
      />
    </Routes>
  );
}

export default App;
