import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { ParticlesBackground } from "./components/ParticlesBackground";
import { useAuth } from "./context/AuthContext";
import { AuthPage } from "./pages/AuthPage";
import { ChatPage } from "./pages/ChatPage";

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/auth?mode=login" replace />;
  }
  return children;
};

export const App = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <ParticlesBackground />
      <div className="relative z-10 min-h-screen">
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
};
