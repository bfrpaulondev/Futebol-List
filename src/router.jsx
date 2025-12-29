// -.-.-.-
import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { authService } from '@services/authService';

// Layout
import { Navigation } from '@components/layout/Navigation';

// Pages
import { Login } from '@pages/Login';
import { Dashboard } from '@pages/Dashboard';
import { Teams } from '@pages/Teams';
import { Chat } from '@pages/Chat';
import { Finances } from '@pages/Finances';
import { SuggestionForm } from '@pages/SuggestionForm';
import { Profile } from '@pages/Profile';
import { RateSkills } from '@pages/RateSkills';
import { Coletes } from '@pages/Coletes';
import { DrawAnimated } from '@pages/DrawAnimated';
import { NotFound } from '@pages/NotFound';

// -.-.-.-
// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <>
      {children}
      <Navigation />
    </>
  );
};

// -.-.-.-
// Public Route (redirect if authenticated)
const PublicRoute = ({ children }) => {
  if (authService.isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// -.-.-.-
export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    )
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    )
  },
  {
    path: '/teams',
    element: (
      <ProtectedRoute>
        <Teams />
      </ProtectedRoute>
    )
  },
  {
    path: '/chat',
    element: (
      <ProtectedRoute>
        <Chat />
      </ProtectedRoute>
    )
  },
  {
    path: '/finances',
    element: (
      <ProtectedRoute>
        <Finances />
      </ProtectedRoute>
    )
  },
  {
    path: '/suggestion-form',
    element: (
      <ProtectedRoute>
        <SuggestionForm />
      </ProtectedRoute>
    )
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    )
  },
  {
    path: '/rate-skills',
    element: (
      <ProtectedRoute>
        <RateSkills />
      </ProtectedRoute>
    )
  },
  {
    path: '/coletes',
    element: (
      <ProtectedRoute>
        <Coletes />
      </ProtectedRoute>
    )
  },
  {
    path: '/draw-animated',
    element: (
      <ProtectedRoute>
        <DrawAnimated />
      </ProtectedRoute>
    )
  },
  {
    path: '*',
    element: <NotFound />
  }
]);
