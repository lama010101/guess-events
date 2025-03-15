
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import UserProfile from "./pages/UserProfile";
import WebScraperAdmin from "./pages/WebScraperAdmin";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoutes from "./components/ProtectedRoutes";
import { Toaster as SonnerToaster } from "sonner";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/round/:roundId" element={<Index />} />
          <Route path="/game/:sessionId" element={<Index />} />
          <Route path="/game/:sessionId/round/:roundId" element={<Index />} />
          <Route path="/leaderboard" element={<Index />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoutes requiredRole="admin">
                <Admin />
              </ProtectedRoutes>
            } 
          />
          <Route 
            path="/admin/scraper" 
            element={
              <ProtectedRoutes requiredRole="admin">
                <WebScraperAdmin />
              </ProtectedRoutes>
            } 
          />
          <Route path="/profile/:userId" element={<UserProfile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
        <SonnerToaster position="top-right" closeButton richColors />
      </Router>
    </AuthProvider>
  );
}

export default App;
