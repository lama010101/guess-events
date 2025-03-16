
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import WebScraperAdmin from "./pages/WebScraperAdmin";
import UserProfile from "./pages/UserProfile";
import ProtectedRoutes from "./components/ProtectedRoutes";
import { ThemeProvider } from "./components/ThemeProvider";

// Initialize QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

function App() {
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for hydration to avoid SSR issues
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider defaultTheme="light" storageKey="historyguess-theme">
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/profile/:id" element={<UserProfile />} />

              {/* Protected routes - Admin only */}
              <Route path="/admin" element={
                <ProtectedRoutes>
                  <Admin />
                </ProtectedRoutes>
              } />
              <Route path="/admin/scraper" element={
                <ProtectedRoutes>
                  <WebScraperAdmin />
                </ProtectedRoutes>
              } />

              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </ThemeProvider>
      </AuthProvider>
      
      <Toaster position="top-center" closeButton richColors />
    </QueryClientProvider>
  );
}

export default App;
