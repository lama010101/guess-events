
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import UserProfile from "./pages/UserProfile";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoutes from "./components/ProtectedRoutes";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/round/:roundId" element={<Index />} />
          <Route path="/game/:sessionId" element={<Index />} />
          <Route path="/game/:sessionId/round/:roundId" element={<Index />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoutes requiredRole="admin">
                <Admin />
              </ProtectedRoutes>
            } 
          />
          <Route path="/profile/:userId" element={<UserProfile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;
