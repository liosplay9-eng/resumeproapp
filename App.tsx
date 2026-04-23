import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, AuthProvider } from './AuthContext';
import AppLayout from './AppLayout';

// FIXED IMPORT PATHS
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Textarea } from './components/ui/textarea';
import { Badge } from './components/ui/badge';
import { ScrollArea } from './components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './components/ui/accordion';
import { Dialog, DialogContent } from './components/ui/dialog';

import {
  Rocket,
  FileText,
  CheckCircle,
  Trophy,
  Star,
  Bell,
  Plus,
  Download,
  Trash2,
  Wand2,
  Search,
  ChevronRight,
  LogOut
} from 'lucide-react';

import { auth } from './lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

import { geminiService } from './services/gemini';
import { Toaster, toast } from 'sonner';
import confetti from 'canvas-confetti';
import { exportToPdf } from './lib/exportUtils';

// MAIN APP
export default function App() {
  const [showingSplash, setShowingSplash] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <AuthProvider>
      <Toaster position="top-center" />
      <AppContent
        showingSplash={showingSplash}
        setShowingSplash={setShowingSplash}
        showTutorial={showTutorial}
        setShowTutorial={setShowTutorial}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </AuthProvider>
  );
}

// SPLASH SCREEN
function SplashScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-indigo-600 flex items-center justify-center">
      <Rocket className="w-24 h-24 text-white" />
    </div>
  );
}

// AUTH SCREEN
function AuthScreen() {
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success('Login Success');
    } catch {
      toast.error('Login Failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <Button onClick={handleGoogleSignIn}>
        Continue with Google
      </Button>
    </div>
  );
}

// DASHBOARD
function DashboardScreen({ onNavigate }: any) {
  return (
    <div className="space-y-4">
      <Button onClick={() => onNavigate('builder')}>Resume Builder</Button>
      <Button onClick={() => onNavigate('ats')}>ATS Checker</Button>
      <Button onClick={() => onNavigate('prep')}>Interview Prep</Button>
      <Button onClick={() => onNavigate('profile')}>Profile</Button>
    </div>
  );
}

// PROFILE
function ProfileScreen() {
  const { user } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="space-y-4">
      <h2>{user?.displayName}</h2>
      <p>{user?.email}</p>

      <Button onClick={handleLogout}>
        <LogOut className="w-4 h-4 mr-2" />
        Logout
      </Button>
    </div>
  );
}

// BUILDER
function ResumeBuilderScreen() {
  const [name, setName] = useState('');

  return (
    <div className="space-y-4">
      <Input
        placeholder="Enter Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <Button>Generate Resume</Button>
    </div>
  );
}

// ATS
function AtsCheckerScreen() {
  return (
    <div>
      <Button>Analyze ATS Score</Button>
    </div>
  );
}

// PREP
function InterviewPrepScreen() {
  return (
    <div>
      <Button>Generate Interview Questions</Button>
    </div>
  );
}

// APP CONTENT
function AppContent({
  showingSplash,
  setShowingSplash,
  activeTab,
  setActiveTab
}: any) {
  const { user, loading } = useAuth();

  if (showingSplash)
    return <SplashScreen onComplete={() => setShowingSplash(false)} />;

  if (loading) return null;

  if (!user) return <AuthScreen />;

  return (
    <AppLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'dashboard' && (
        <DashboardScreen onNavigate={setActiveTab} />
      )}

      {activeTab === 'builder' && <ResumeBuilderScreen />}
      {activeTab === 'ats' && <AtsCheckerScreen />}
      {activeTab === 'prep' && <InterviewPrepScreen />}
      {activeTab === 'profile' && <ProfileScreen />}
    </AppLayout>
  );
}
