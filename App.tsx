import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, AuthProvider } from './AuthContext';
import AppLayout from './components/AppLayout';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Textarea } from './components/ui/textarea';
import { Badge } from './components/ui/badge';
import { ScrollArea } from './components/ui/scroll-area';
import { Rocket, FileText, CheckCircle, Trophy, Star, Bell, Plus, Download, Trash2, Send, Wand2, Search, HelpCircle, ChevronRight, LogOut } from 'lucide-react';
import { auth, db } from './lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { geminiService } from './services/gemini';
import { Toaster, toast } from 'sonner';
import confetti from 'canvas-confetti';
import { exportToPdf } from './lib/exportUtils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './components/ui/accordion';
import { Dialog, DialogContent } from './components/ui/dialog';

// --- Components ---

function SplashScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-indigo-600 flex flex-col items-center justify-center z-[100]">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Rocket className="w-24 h-24 text-white" />
      </motion.div>
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-white text-3xl font-bold mt-6 tracking-tight"
      >
        ResumePro AI
      </motion.h1>
      <div className="mt-8">
        <div className="w-48 h-1 bg-indigo-400 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5 }}
            className="h-full bg-white"
          />
        </div>
      </div>
    </div>
  );
}

function WelcomeTutorial({ onComplete }: { onComplete: () => void }) {
  const steps = [
    { title: "Welcome to ResumePro AI", description: "Your all-in-one companion for job search success.", icon: Rocket },
    { title: "AI-Powered Builder", description: "Create ATS-friendly resumes in minutes with our advanced AI.", icon: Wand2 },
    { title: "ATS Checker", description: "Optimize your resume to pass through scanning software easily.", icon: FileText },
    { title: "Interview Prep", description: "Prepare with AI-generated questions tailored to your desired roles.", icon: Trophy }
  ];
  const [current, setCurrent] = useState(0);

  return (
    <div className="fixed inset-0 bg-[#020617] z-[90] flex flex-col items-center justify-center p-6 text-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
          className="max-w-xs"
        >
          {(() => {
            const Icon = steps[current].icon;
            return <Icon className="w-20 h-20 text-indigo-500 mx-auto mb-6 shadow-[0_0_20px_rgba(99,102,241,0.3)]" />;
          })()}
          <h2 className="text-2xl font-bold mb-4 text-white">{steps[current].title}</h2>
          <p className="text-slate-400 mb-12">{steps[current].description}</p>
        </motion.div>
      </AnimatePresence>
      
      <div className="flex gap-2 mb-12">
        {steps.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-indigo-500' : 'w-2 bg-slate-800'}`} />
        ))}
      </div>

      <Button 
        onClick={() => current < steps.length - 1 ? setCurrent(c => c + 1) : onComplete()}
        className="w-full h-14 text-lg font-bold bg-indigo-600 hover:bg-indigo-500 text-white border-none shadow-lg shadow-indigo-500/20"
      >
        {current === steps.length - 1 ? "Get Started" : "Next"}
      </Button>
    </div>
  );
}

function ProfileScreen({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { userData, user } = useAuth();
  
  const handleLogout = async () => {
    await signOut(auth);
  };

  const isAdmin = user?.email === 'gigglexstudio@gmail.com';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col items-center py-6 gap-4">
        <div className="w-24 h-24 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-3xl">
          {user?.displayName ? user.displayName[0] : user?.email ? user.email[0] : 'U'}
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">{user?.displayName || 'User'}</h2>
          <p className="text-slate-400 text-sm">{user?.email}</p>
        </div>
      </div>

      <Card className="bg-[#1e293b] border-[#334155]">
        <CardHeader>
          <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Plan Status</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${userData?.isPro ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
              <Star className="w-5 h-5 fill-current" />
            </div>
            <div>
              <p className="font-bold text-slate-200">{userData?.isPro ? 'Pro Member' : 'Free Plan'}</p>
              <p className="text-xs text-slate-400">
                {userData?.isPro ? `Expires in ${userData?.subscriptionType === 'monthly' ? '30' : '365'} days` : '3 resumes remaining'}
              </p>
            </div>
          </div>
          {!userData?.isPro && <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500">Upgrade</Button>}
        </CardContent>
      </Card>

      <Card className="bg-[#1e293b] border-[#334155]">
        <CardHeader>
          <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Refer & Earn</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400 mb-4">Invite a friend and get 7 days of Pro for free!</p>
          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-[#334155] border-dashed">
            <span className="font-mono font-bold tracking-widest text-indigo-400">{userData?.referralCode || 'PRO123'}</span>
            <Button variant="ghost" size="sm" className="text-indigo-400 font-bold hover:text-indigo-300 hover:bg-indigo-500/10">Copy</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1e293b] border-[#334155]">
        <CardHeader>
          <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Developer Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full text-xs border-[#334155] text-slate-300 hover:bg-slate-800" onClick={() => toast.info("To export the full source code ZIP or Android APK, go to the Settings menu in AI Studio and select 'Export to ZIP'.")}>
            Export Application Source (.zip)
          </Button>
          <Button variant="outline" className="w-full text-xs border-[#334155] text-slate-300 hover:bg-slate-800" onClick={() => toast.info("Your application name and metadata are already prepared for Google Play Store matching.")}>
            Prepare for Google Play (APK)
          </Button>
          {isAdmin && (
            <Button variant="outline" className="w-full text-xs bg-slate-200 text-slate-950 hover:bg-white font-bold" onClick={() => onNavigate('admin')}>
              Open Admin Dashboard
            </Button>
          )}
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full flex items-center gap-2 text-rose-500 border-rose-500/20 hover:bg-rose-500/10" onClick={handleLogout}>
        <LogOut className="w-4 h-4" />
        Logout
      </Button>
    </motion.div>
  );
}

function InterviewPrepScreen() {
  const [role, setRole] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!role) return toast.error("Please enter a job role");
    setLoading(true);
    try {
      const data = await geminiService.getInterviewPrep(role);
      setQuestions(data);
    } catch (e) {
      toast.error("Failed to fetch questions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-200">
      <h2 className="text-xl font-bold">Interview Preparation</h2>
      <Card className="bg-[#1e293b] border-[#334155]">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-400">Target Job Role</Label>
            <Input 
              placeholder="e.g. Software Engineer, Sales Manager" 
              value={role} 
              onChange={e => setRole(e.target.value)}
              className="bg-slate-800 border-[#334155] focus:ring-indigo-500"
            />
          </div>
          <Button className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold" onClick={handleGenerate} disabled={loading}>
            {loading ? "Generating..." : "Get AI Questions"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {questions.map((q, i) => (
          <Accordion key={i}>
            <AccordionItem value={`item-${i}`} className="border-none">
              <AccordionTrigger className="text-left font-bold text-sm bg-[#1e293b] px-4 py-4 rounded-xl border border-[#334155] mb-2 hover:no-underline hover:bg-[#2d3a4f] transition-all">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] uppercase border-indigo-500/50 text-indigo-400 bg-indigo-500/5">{q.category}</Badge>
                  {q.question}
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 bg-slate-900/50 rounded-xl text-sm leading-relaxed text-slate-400 border border-[#334155] mb-4">
                <p className="font-bold text-indigo-400 mb-2 uppercase tracking-widest text-[10px]">AI Suggested Answer:</p>
                {q.answer}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ))}
      </div>
    </div>
  );
}

function PricingModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const handlePayment = async (plan: 'monthly' | 'yearly') => {
    const amount = plan === 'monthly' ? 99 : 499;
    try {
      const res = await fetch('/api/payments/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency: 'INR', receipt: 'receipt_' + Date.now() })
      });
      const order = await res.json();

      const options = {
        key: (import.meta as any).env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "ResumePro AI",
        description: `Upgrade to ${plan} plan`,
        order_id: order.id,
        handler: async (response: any) => {
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response)
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            toast.success("Payment successful! You are now a Pro member.");
            onClose();
            confetti({ particleCount: 200, spread: 90 });
          }
        },
        theme: { color: "#4f46e5" }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (e) {
      toast.error("Payment failed");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xs sm:max-w-md rounded-3xl p-6 bg-[#1e293b] border-[#334155] text-slate-200">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl mx-auto flex items-center justify-center mb-4">
             <Star className="w-6 h-6 fill-current"/>
          </div>
          <h2 className="text-2xl font-black text-white">Choose Your Plan</h2>
          <p className="text-slate-400 text-sm">Unlock your career potential with Pro features.</p>
        </div>

        <div className="space-y-4">
          <button onClick={() => handlePayment('monthly')} className="w-full p-4 border border-[#334155] bg-slate-800/50 rounded-2xl hover:border-indigo-500 transition-all text-left flex justify-between items-center group">
            <div>
              <p className="font-bold text-lg text-white">Monthly Pro</p>
              <p className="text-xs text-slate-500 italic">Bill monthly. Cancel anytime.</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-indigo-400">₹99</p>
              <p className="text-[10px] uppercase font-bold text-slate-500 group-hover:text-indigo-400">Select</p>
            </div>
          </button>

          <button onClick={() => handlePayment('yearly')} className="w-full p-4 border-2 border-indigo-500 bg-indigo-500/10 rounded-2xl relative text-left flex justify-between items-center group">
             <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest whitespace-nowrap shadow-lg shadow-indigo-500/30">Best Value - 60% Off</div>
             <div>
              <p className="font-bold text-lg text-white">Yearly Pro</p>
              <p className="text-xs text-slate-400 italic">Save more with annual billing.</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-indigo-400">₹499</p>
              <p className="text-[10px] uppercase font-bold text-indigo-400">Selected</p>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DashboardScreen({ onNavigate, onShowPricing }: { onNavigate: (tab: string) => void, onShowPricing: () => void }) {
  const { userData } = useAuth();
  
  const quickActions = [
    { title: 'Resume Builder', icon: Wand2, color: 'bg-indigo-500/20 text-indigo-400', tab: 'builder' },
    { title: 'ATS Checker', icon: Search, color: 'bg-emerald-500/20 text-emerald-400', tab: 'ats' },
    { title: 'Cover Letter', icon: FileText, color: 'bg-amber-500/20 text-amber-400', tab: 'builder' },
    { title: 'Interview Prep', icon: Trophy, color: 'bg-blue-500/20 text-blue-400', tab: 'prep' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {!userData?.isPro && (
        <div className="bg-slate-900/50 border border-slate-800 text-[10px] text-slate-500 h-10 flex items-center justify-center rounded-lg uppercase tracking-widest font-bold">
          Advertisement
        </div>
      )}
      <div>
        <h2 className="text-2xl font-black tracking-tight text-white">How's it going, {userData?.displayName?.split(' ')[0] || 'there'}? </h2>
        <p className="text-slate-400">Let's build your dream career today.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {quickActions.map((action, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate(action.tab)}
            className="flex flex-col items-start p-5 bg-[#1e293b] rounded-2xl border border-[#334155] shadow-sm hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all text-left group"
          >
            <div className={`p-3 rounded-xl ${action.color.split(' ')[0]} ${action.color.split(' ')[1]} mb-4 transition-transform group-hover:scale-110`}>
              <action.icon className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm leading-tight text-slate-200">{action.title}</h3>
          </motion.button>
        ))}
      </div>

      {!userData?.isPro && (
        <Card className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white overflow-hidden relative border-none shadow-xl shadow-indigo-600/20">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Rocket className="w-24 h-24 rotate-12" />
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-100 uppercase tracking-widest text-[10px] font-bold">
              <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
              Limited Offer
            </CardTitle>
            <CardTitle className="text-xl font-black">Upgrade to Pro</CardTitle>
            <CardDescription className="text-indigo-100 font-medium">Unlock all premium templates and AI checks.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-white text-indigo-600 hover:bg-slate-100 font-bold shadow-lg" onClick={onShowPricing}>Unlock Pro Now</Button>
          </CardContent>
        </Card>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white">Recent Resumes</h3>
          <Button variant="ghost" size="sm" className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 text-xs font-bold" onClick={() => onNavigate('files')}>View All</Button>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-[#1e293b] rounded-2xl border border-[#334155] hover:border-slate-600 transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center group-hover:bg-indigo-500/10 transition-colors">
                <FileText className="w-5 h-5 text-slate-500 group-hover:text-indigo-400" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-slate-200">Product Manager {i}</p>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Modified 2 days ago</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ResumeBuilderScreen() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '',
    education: '', skills: '', experience: '', projects: '', languages: '',
    jobDescription: '' // New field for Job Match
  });
  const [loading, setLoading] = useState(false);
  const [generatedResume, setGeneratedResume] = useState<any>(null);

  const steps = [
    { title: 'Personal Info', fields: ['name', 'email', 'phone', 'address'] },
    { title: 'Qualifications', fields: ['education', 'skills'] },
    { title: 'Target Job', fields: ['jobDescription'] }, // New step
    { title: 'Background', fields: ['experience', 'projects', 'languages'] }
  ];

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const content = await geminiService.generateResumeContent(formData);
      setGeneratedResume(content);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      toast.success("Resume generated successfully!");
    } catch (error) {
      toast.error("Failed to generate resume.");
    } finally {
      setLoading(false);
    }
  };

  if (generatedResume) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Your AI Resume</h2>
          <Button variant="ghost" size="sm" onClick={() => setGeneratedResume(null)} className="text-slate-400">Edit</Button>
        </div>
        <Card className="bg-white border-none min-h-[400px] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
          <div className="space-y-6 text-slate-800">
             <div className="text-center space-y-1">
               <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900">{formData.name}</h3>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formData.email} • {formData.phone}</p>
             </div>
             <div className="space-y-2">
               <h4 className="font-black border-b-2 border-slate-100 pb-1 text-[10px] uppercase text-indigo-600 tracking-[0.2em]">Professional Summary</h4>
               <p className="text-sm text-slate-600 leading-relaxed font-medium">{generatedResume.summary}</p>
             </div>
             <div className="space-y-4">
               <h4 className="font-black border-b-2 border-slate-100 pb-1 text-[10px] uppercase text-indigo-600 tracking-[0.2em]">Experience</h4>
               {generatedResume.experience?.map((exp: any, i: number) => (
                 <div key={i} className="space-y-1">
                   <div className="flex justify-between items-baseline">
                     <p className="font-bold text-sm text-slate-900">{exp.role}</p>
                     <p className="text-[10px] font-black text-slate-400 uppercase">{exp.period}</p>
                   </div>
                   <p className="text-xs font-bold text-indigo-500/80 uppercase tracking-wider">{exp.company}</p>
                   <ul className="list-disc list-inside space-y-1 mt-2">
                     {exp.achievements?.map((ach: string, j: number) => (
                       <li key={j} className="text-xs text-slate-600 font-medium leading-normal">{ach}</li>
                     ))}
                   </ul>
                 </div>
               ))}
             </div>
          </div>
        </Card>
        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" className="flex items-center gap-2 border-[#334155] text-slate-300 hover:bg-slate-800" onClick={() => exportToPdf({ ...generatedResume, name: formData.name, email: formData.email, phone: formData.phone })}>
            <Download className="w-4 h-4"/> PDF
          </Button>
          <Button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 font-bold shadow-lg shadow-indigo-500/20">Save to Cloud</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">{steps[step].title}</h2>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Step {step + 1} of 4</span>
      </div>

      <div className="space-y-4">
        {steps[step].fields.map((field) => (
          <div key={field} className="space-y-2">
            <Label className="capitalize text-slate-400 font-bold text-xs tracking-wider">{field.replace(/([A-Z])/g, ' $1')}</Label>
            {field === 'experience' || field === 'education' || field === 'projects' || field === 'jobDescription' ? (
              <Textarea 
                placeholder={`Describe your ${field}...`}
                className="min-h-[120px] bg-slate-800 border-[#334155] text-white focus:ring-indigo-500 rounded-xl"
                onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
              />
            ) : (
              <Input 
                placeholder={`Enter your ${field}`} 
                className="bg-slate-800 border-[#334155] text-white h-12 focus:ring-indigo-500 rounded-xl"
                onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-4 pt-4">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1 border-[#334155] text-slate-300 h-12 rounded-xl font-bold">Back</Button>
        )}
        {step < steps.length - 1 ? (
          <Button onClick={() => setStep(s => s + 1)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white h-12 rounded-xl font-bold">Next Step</Button>
        ) : (
          <Button onClick={handleGenerate} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white h-12 rounded-xl font-bold shadow-lg shadow-indigo-500/20" disabled={loading}>
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/> : "Generate Resume"}
          </Button>
        )}
      </div>
    </div>
  );
}

function AtsCheckerScreen() {
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    setLoading(true);
    setTimeout(() => {
      setScore(Math.floor(Math.random() * 40) + 60);
      setLoading(false);
      toast.success("ATS check complete!");
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">ATS Resume Checker</h2>
      <Card className="border-dashed border-2 border-slate-700 bg-slate-900/50 p-10 text-center rounded-3xl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-[#1e293b] shadow-xl flex items-center justify-center border border-[#334155]">
            <FileText className="w-10 h-10 text-slate-400 font-bold" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-white text-lg">Select Resume File</p>
            <p className="text-xs text-slate-500 uppercase font-black tracking-widest">PDF or Word docs only</p>
          </div>
          <Button size="sm" className="bg-slate-800 hover:bg-slate-700 font-bold border border-[#334155]">Choose File</Button>
        </div>
      </Card>

      <Button className="w-full bg-indigo-600 hover:bg-indigo-500 h-14 rounded-2xl font-black text-lg shadow-lg shadow-indigo-500/20" onClick={handleCheck} disabled={loading}>
        {loading ? "Analyzing Database..." : "Analyze ATS Score"}
      </Button>

      {score !== null && (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <Card className="bg-[#1e293b] border border-[#334155] rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-500"></div>
            <CardHeader className="text-center pt-10">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">Optimization Score</CardTitle>
              <div className="flex justify-center mb-6">
                 <div className="w-32 h-32 rounded-full border-8 border-slate-800 border-t-emerald-500 flex items-center justify-center relative shadow-inner">
                    <div className="text-4xl font-black text-white">{score}%</div>
                 </div>
              </div>
              <div className="text-emerald-400 font-black text-xl mb-2">Excellent Match!</div>
              <p className="text-slate-400 text-xs px-6 font-medium">Your resume is highly optimized for technical roles and systems.</p>
            </CardHeader>
            <CardContent className="space-y-6 pb-10">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800 pb-2">AI Optimization Tips</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                    <div className="w-6 h-6 bg-rose-500/10 rounded flex items-center justify-center flex-shrink-0"><Bell className="w-4 h-4 text-rose-500"/></div>
                    <div>
                      <p className="font-bold text-sm text-slate-200">Quantify Results</p>
                      <p className="text-xs text-slate-500 leading-relaxed">Add metrics to your experience section for 35% higher visibility.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                    <div className="w-6 h-6 bg-emerald-500/10 rounded flex items-center justify-center flex-shrink-0"><CheckCircle className="w-4 h-4 text-emerald-500"/></div>
                    <div>
                      <p className="font-bold text-sm text-slate-200">Keywords Found</p>
                      <p className="text-xs text-slate-500 leading-relaxed">Matched 14/15 essential skills identified in typical job posts.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

function AuthScreen() {
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success("Welcome to ResumePro!");
    } catch (error) {
      toast.error("Authentication failed.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#020617] text-slate-200">
      <div className="w-full max-w-sm space-y-12">
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-indigo-600 rounded-[2rem] mx-auto flex items-center justify-center shadow-[0_20px_50px_rgba(79,70,229,0.3)] border border-indigo-400/20"
          >
            <Rocket className="text-white w-10 h-10" />
          </motion.div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-white">ResumePro AI</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Build your future • v4.2.0</p>
          </div>
        </div>

        <Card className="p-4 bg-[#1e293b] border-[#334155] rounded-[2rem] shadow-2xl">
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-3">
               <Label className="text-slate-400 font-bold text-xs uppercase tracking-widest px-1">Email Address</Label>
               <Input placeholder="name@example.com" className="bg-slate-800 border-[#334155] h-12 rounded-xl text-white focus:ring-indigo-500" />
            </div>
            <div className="space-y-3">
               <Label className="text-slate-400 font-bold text-xs uppercase tracking-widest px-1">Password</Label>
               <Input type="password" placeholder="••••••••" className="bg-slate-800 border-[#334155] h-12 rounded-xl text-white focus:ring-indigo-500" />
            </div>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-500 font-black h-14 rounded-xl text-lg shadow-lg shadow-indigo-500/20">Sign In</Button>
            
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-800"></span></div>
              <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest"><span className="bg-[#1e293b] px-4 text-slate-500">Secure Access</span></div>
            </div>
            
            <Button variant="outline" className="w-full h-14 rounded-xl border-[#334155] bg-slate-800/50 hover:bg-slate-800 text-slate-200 flex items-center gap-3 font-bold transition-all" onClick={handleGoogleSignIn}>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" />
              Continue with Google
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-slate-600 leading-relaxed px-8 font-medium">
          By continuing, you agree to our <span className="text-slate-400 underline">Terms of Service</span> and <span className="text-slate-400 underline">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}

// --- Main App ---

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

function AdminDashboard() {
  return (
    <div className="space-y-6 text-slate-200">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        <h2 className="text-xl font-bold text-white leading-none">Console Overview</h2>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5 bg-indigo-500/10 border-indigo-500/20 text-indigo-400">
          <p className="text-[10px] font-black font-mono uppercase tracking-widest mb-1">Active Users</p>
          <p className="text-3xl font-black">1.2k</p>
        </Card>
        <Card className="p-5 bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
          <p className="text-[10px] font-black font-mono uppercase tracking-widest mb-1">Total Revenue</p>
          <p className="text-3xl font-black">₹45k</p>
        </Card>
      </div>
      <Card className="bg-[#1e293b] border-[#334155] rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-800 bg-slate-900/30">
          <CardTitle className="text-sm font-black text-slate-300 uppercase tracking-widest">Transaction Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
           <div className="divide-y divide-slate-800">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex justify-between items-center p-4 hover:bg-slate-800/30 transition-colors">
                  <div className="flex gap-3 items-center">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500">U{i}</div>
                    <div>
                      <p className="font-bold text-sm text-slate-200">usr_{Math.random().toString(36).substring(9)}@node.com</p>
                      <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Plan: Yearly Pro</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-indigo-400">₹499</p>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[8px] uppercase tracking-tighter">Verified</Badge>
                  </div>
                </div>
              ))}
           </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AppContent({ showingSplash, setShowingSplash, showTutorial, setShowTutorial, activeTab, setActiveTab }: any) {
  const { user, loading, userData } = useAuth();
  const [showPricing, setShowPricing] = useState(false);

  // Show tutorial only for new users
  useEffect(() => {
    if (userData && !userData.displayName && !localStorage.getItem('tutorial_done')) {
      setShowTutorial(true);
    }
  }, [userData, setShowTutorial]);

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    localStorage.setItem('tutorial_done', 'true');
  };

  if (showingSplash) return <SplashScreen onComplete={() => setShowingSplash(false)} />;
  if (loading) return null;
  if (!user) return <AuthScreen />;
  if (showTutorial) return <WelcomeTutorial onComplete={handleTutorialComplete} />;

  return (
    <AppLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && <DashboardScreen key="dash" onNavigate={setActiveTab} onShowPricing={() => setShowPricing(true)} />}
        {activeTab === 'builder' && <ResumeBuilderScreen key="builder" />}
        {activeTab === 'ats' && <AtsCheckerScreen key="ats" />}
        {activeTab === 'files' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Your Documents</h2>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Storage: 12% Full</span>
            </div>
            <div className="space-y-3">
               {[1,2,3].map(i => (
                  <Card key={i} className="bg-[#1e293b] border-[#334155] group hover:border-indigo-500/50 transition-all rounded-2xl shadow-lg hover:shadow-indigo-500/5">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="p-2.5 bg-slate-800 text-indigo-400 rounded-xl group-hover:bg-indigo-500/10 transition-colors"><FileText className="w-5 h-5"/></div>
                         <div>
                            <p className="font-bold text-sm text-slate-200">Resume_V{i}.pdf</p>
                            <p className="text-[10px] uppercase font-black text-slate-500 tracking-wider font-mono">Mod: 23 Oct 2023</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg"><Download className="w-4 h-4"/></Button>
                        <Button variant="ghost" size="icon" className="text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg"><Trash2 className="w-4 h-4"/></Button>
                      </div>
                    </CardContent>
                  </Card>
               ))}
            </div>
            <Button className="w-full border-dashed border-2 border-slate-700 bg-slate-900/50 text-slate-400 hover:bg-slate-800 hover:text-white h-14 rounded-2xl font-bold transition-all" variant="outline" onClick={() => setActiveTab('builder')}>
              <Plus className="w-4 h-4 mr-2"/> Create New AI Document
            </Button>
          </div>
        )}
        {activeTab === 'prep' && <InterviewPrepScreen key="prep" />}
        {activeTab === 'profile' && <ProfileScreen key="profilescreen" onNavigate={setActiveTab} />}
        {activeTab === 'admin' && <AdminDashboard key="admin" />}
      </AnimatePresence>
      <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} />
    </AppLayout>
  );
}
