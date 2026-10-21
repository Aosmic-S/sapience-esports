
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import Index from "./pages/Index";
import Register from "./pages/Register";
import Calendar from "./pages/Calendar";
import Rules from "./pages/Rules";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Leaderboard from "./pages/Leaderboard";
import TeamLogin from "./pages/TeamLogin";
import TeamDashboard from "./pages/TeamDashboard";
import Brackets from "./pages/Brackets";
import PlayerLogin from "./pages/PlayerLogin";
import PlayerProfile from "./pages/PlayerProfile";
import ResetPassword from "./pages/ResetPassword";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import { SiteFooter } from './components/SiteFooter';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/index" element={<Index />} />
          <Route path="/register" element={<Register />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/team-login" element={<TeamLogin />} />
          <Route path="/player-login" element={<PlayerLogin />} />
          <Route path="/player-profile" element={<PlayerProfile />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/team-dashboard" element={<TeamDashboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/brackets" element={<Brackets />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <SiteFooter />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
