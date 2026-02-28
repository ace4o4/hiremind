import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Report from "./pages/Report";
import NotFound from "./pages/NotFound";
import VirtualInterviewRoom from "./pages/VirtualInterviewRoom";
import AudioInterviewSetup from "./pages/AudioInterviewSetup";
import LiveAudioInterview from "./pages/LiveAudioInterview";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/auth" element={<Auth />} />
            <Route path="/report" element={
              <ProtectedRoute>
                <Report />
              </ProtectedRoute>
            } />
            <Route path="/virtual-room" element={
              <ProtectedRoute>
                <VirtualInterviewRoom />
              </ProtectedRoute>
            } />
            <Route path="/audio-setup" element={
              <ProtectedRoute>
                <AudioInterviewSetup />
              </ProtectedRoute>
            } />
            <Route path="/audio-interview" element={
              <ProtectedRoute>
                <LiveAudioInterview />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
