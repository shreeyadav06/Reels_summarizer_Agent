import { useState, useEffect } from 'react';
import { GlowCard } from './components/ui/spotlight-card';
import { LogIn, User, LogOut, ArrowRight, Video, Sparkles } from 'lucide-react';
import { auth, loginWithGoogle, logout, isConfigured } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [guestMode, setGuestMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth!, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const loggedInUser = await loginWithGoogle();
    if (loggedInUser) {
      window.location.href = 'http://localhost:3005/dashboard';
    }
  };

  const handleGuest = () => {
    window.location.href = 'http://localhost:3005/dashboard';
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setGuestMode(false);
  };

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-[#1a1a1a] text-white">Loading...</div>;
  }

  // Landing Page
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/20 blur-[120px] pointer-events-none" />
      
      <div className="text-center z-10 mb-16 max-w-3xl">
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6 text-sm text-cyan-400">
          <Sparkles size={16} /> <span>AI-Powered Extraction</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
          Extract Gold from <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Instagram Reels</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
          Instantly summarize posts, extract recipes, find coupons, and save internship links from any reel or short video.
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-stretch justify-center gap-8 z-10">
        
        {/* Option 1: Login */}
        <GlowCard glowColor="purple" className="flex flex-col items-center text-center w-full max-w-sm h-auto p-8 hover:-translate-y-2 transition-transform duration-300">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6 border border-purple-500/30">
            <LogIn size={32} className="text-purple-400" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Save & Access</h3>
          <p className="text-gray-400 text-sm mb-8 flex-1">
            Sign in securely to store your extracted summaries in the cloud. Access your data from any device, anytime.
          </p>
          <button 
            onClick={handleLogin}
            className="w-full bg-white text-black font-semibold py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            Sign In with Google
          </button>
        </GlowCard>

        {/* Option 2: Guest Mode */}
        <GlowCard glowColor="blue" className="flex flex-col items-center text-center w-full max-w-sm h-auto p-8 hover:-translate-y-2 transition-transform duration-300">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center mb-6 border border-cyan-500/30">
            <User size={32} className="text-cyan-400" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Try as Guest</h3>
          <p className="text-gray-400 text-sm mb-8 flex-1">
            Test the AI agent instantly without logging in. 
            <span className="text-amber-400/80 block mt-2">Data will be erased immediately upon refresh or closing the tab.</span>
          </p>
          <button 
            onClick={handleGuest}
            className="w-full bg-transparent border border-white/20 hover:bg-white/5 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            Continue as Guest <ArrowRight size={18} />
          </button>
        </GlowCard>

      </div>
    </div>
  );
}
