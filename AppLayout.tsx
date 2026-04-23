import { motion } from 'framer-motion';
import { Download, FileText, Layout, Rocket, Settings, Star, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';

export default function AppLayout({ children, activeTab, onTabChange }: any) {
  const { userData } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Home', icon: Layout },
    { id: 'builder', label: 'Builder', icon: Rocket },
    { id: 'ats', label: 'ATS Check', icon: FileText },
    { id: 'files', label: 'My Files', icon: Download },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#1e293b]/80 backdrop-blur-md border-b border-[#334155] z-50 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Rocket className="text-white w-5 h-5" />
          </div>
          <h1 className="font-bold text-xl tracking-tight hidden sm:block text-white">ResumePro AI</h1>
        </div>

        <div className="flex items-center gap-4">
          {!userData?.isPro && (
            <Button size="sm" className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-none shadow-lg shadow-indigo-500/20 flex items-center gap-1 font-bold">
              <Star className="w-4 h-4 fill-white" />
              <span className="text-xs">Go Pro</span>
            </Button>
          )}
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Streak</span>
            <span className="text-sm font-bold text-orange-500">🔥 {userData?.streakCount || 0}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mt-16 mb-20 px-4 py-6 max-w-lg mx-auto w-full">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[#1e293b] border-t border-[#334155] z-50 flex items-center justify-around px-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 relative ${
                isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-indigo-500/10' : ''}`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-[1px] w-8 h-1 bg-indigo-500 rounded-b-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
