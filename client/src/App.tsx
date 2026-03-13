import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Community from "./pages/Community";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./globals.css";
import LenisScroll from "./components/LenisScroll";
import Generate from "./pages/Generate";
import MyGeneration from "./pages/MyGeneration";
import YtPreview from "./pages/YtPreview";
import { useEffect } from "react";
import { Toaster } from 'react-hot-toast'
import PrivacyPolicy from "./pages/PrivacyPolicy"
import TermsOfService from "./pages/TermsOfService";
import About from "./pages/About";
import ContactUs from "./pages/ContactUs";
import { SignIn, SignUp, RedirectToSignIn, UserProfile } from "@clerk/clerk-react";
import { useAuth } from "@clerk/clerk-react";
import Analytics from './pages/analytics';
import DailyBoost from "./pages/DailyBoost";
import HowToUse from "./pages/how-to-use";
import CoachWidget from './components/CoachWidget';
import Credits from "./pages/Credits";

// 🔒 Composant qui protège les pages — si pas connecté, redirige vers login
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null; // attend que Clerk charge
  if (!isSignedIn) return <RedirectToSignIn />;
  return <>{children}</>;
};

export default function App() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <>
      <Toaster />
      <LenisScroll />
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/generate" element={<Generate />} />
        <Route path="/generate/:id" element={<Generate />} />
        <Route path="/preview" element={<YtPreview />} />
        <Route path="/Community" element={<Community />} />
        <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
        <Route path="/TermsOfService" element={<TermsOfService />} />
        <Route path="/About" element={<About />} />
        <Route path="/ContactUs" element={<ContactUs />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/daily-boost" element={<DailyBoost />} />
        <Route path="/how-to-use" element={<HowToUse />} />
        <Route path="/credits" element={<ProtectedRoute><Credits /></ProtectedRoute>} />

        

        {/* Pages Clerk pour login/signup */}
        <Route path="/sign-in/*" element={
  <div className="min-h-screen flex items-center justify-center pt-24 relative">
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <div className="absolute left-1/2 top-20 -translate-x-1/2 w-245 h-115 bg-linear-to-tr from-pink-800/35 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute right-12 bottom-10 w-105 h-55 bg-linear-to-bl from-red-700/35 to-transparent rounded-full blur-2xl"></div>
    </div>
    <SignIn 
      routing="path" 
      path="/sign-in"
      signUpUrl="/sign-up"
    />
  </div>
} />

<Route path="/sign-up/*" element={
  <div className="min-h-screen flex items-center justify-center pt-24 relative">
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <div className="absolute left-1/2 top-20 -translate-x-1/2 w-245 h-115 bg-linear-to-tr from-pink-800/35 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute right-12 bottom-10 w-105 h-55 bg-linear-to-bl from-red-700/35 to-transparent rounded-full blur-2xl"></div>
    </div>
    <SignUp 
      routing="path" 
      path="/sign-up"
      signInUrl="/sign-in"
    />  
  </div>
} />
        {/* Page protégée — seulement si connecté */}
        <Route path="/my-generation" element={
          <ProtectedRoute>
            <MyGeneration />
          </ProtectedRoute>
        } />
      </Routes>
      <Footer />
      <CoachWidget />
    </>
  );
}