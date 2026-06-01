import { useState, useEffect } from 'react';
import { GlowCard } from './components/ui/spotlight-card';
import { LogIn, User, LogOut, ArrowRight, Video, Sparkles, X, Mail, Key } from 'lucide-react';
import { auth, loginWithGoogle, registerWithEmail, loginWithEmail, logout, isConfigured } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [guestMode, setGuestMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

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

  const handleGoogleLogin = async () => {
    setAuthError('');
    try {
      const loggedInUser = await loginWithGoogle();
      if (loggedInUser) {
        window.location.href = 'http://localhost:3005/dashboard';
      }
    } catch (err: any) {
      setAuthError(err.message || 'Failed to login with Google');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isRegistering) {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
      window.location.href = 'http://localhost:3005/dashboard';
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Check your credentials.');
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
    <div className="min-h-screen w-full bg-[#0a0a0a] text-white flex flex-col items-center p-4 overflow-x-hidden relative">
      {/* Header */}
      <header className="w-full max-w-6xl mx-auto flex justify-center items-center py-8 z-10">
        <div className="flex items-center gap-3">
          <div>
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
              <rect x="2" y="2" width="28" height="28" rx="8" stroke="url(#logo-gradient)" strokeWidth="2.5"/>
              <circle cx="16" cy="16" r="7" stroke="url(#logo-gradient)" strokeWidth="2.5"/>
              <circle cx="23.5" cy="8.5" r="2" fill="url(#logo-gradient)"/>
              <defs>
                <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32">
                  <stop stopColor="#a855f7"/>
                  <stop offset="1" stopColor="#06b6d4"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Reel<span className="text-cyan-400">Brain</span>
          </h1>
        </div>
      </header>

      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/20 blur-[120px] pointer-events-none" />
      
      <div className="text-center z-10 mt-12 mb-16 max-w-3xl">
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
        <GlowCard glowColor="insta" className="flex flex-col items-center text-center w-full max-w-[320px] h-auto p-8">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
            <LogIn size={32} className="text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Save & Access</h3>
          <p className="text-gray-400 text-sm mb-8 flex-1">
            Sign in securely to store your extracted summaries in the cloud. Access your data from any device, anytime.
          </p>
          <button 
            onClick={() => setShowLoginModal(true)}
            className="w-full bg-white text-black font-semibold py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            Sign In Securely
          </button>
        </GlowCard>

        {/* Option 2: Guest Mode */}
        <GlowCard glowColor="insta" className="flex flex-col items-center text-center w-full max-w-[320px] h-auto p-8">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
            <User size={32} className="text-white" />
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

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-8 relative shadow-2xl animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-2xl font-bold text-center mb-2">
              {isRegistering ? 'Create an Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-400 text-center text-sm mb-6">
              {isRegistering ? 'Sign up to safely store your summaries in the cloud.' : 'Log in to access your saved summaries.'}
            </p>

            {authError && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg mb-6">
                {authError}
              </div>
            )}

            <button 
              onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-gray-200 text-black font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-3 mb-6"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z" fill="#4285F4"/><path d="M12.2401 24.0008C15.4766 24.0008 18.2059 22.9382 20.1945 21.1039L16.3276 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11388 19.252 6.45946 17.1399 5.50705 14.3003H1.5166V17.3912C3.55371 21.4434 7.7029 24.0008 12.2401 24.0008Z" fill="#34A853"/><path d="M5.50253 14.3003C5.00023 12.8099 5.00023 11.1961 5.50253 9.70575V6.61481H1.51649C-0.18551 10.0056 -0.18551 14.0004 1.51649 17.3912L5.50253 14.3003Z" fill="#FBBC04"/><path d="M12.2401 4.74966C13.9509 4.7232 15.6044 5.36697 16.8434 6.54867L20.2695 3.12262C18.1001 1.0855 15.2208 -0.034466 12.2401 0.000808666C7.7029 0.000808666 3.55371 2.55822 1.5166 6.61481L5.50264 9.70575C6.45064 6.86173 9.10947 4.74966 12.2401 4.74966Z" fill="#EA4335"/></svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-gray-500 text-sm">or</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 outline-none focus:border-cyan-500 transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 outline-none focus:border-cyan-500 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-2.5 px-4 rounded-lg transition-colors mt-2"
              >
                {isRegistering ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-gray-400 text-sm mt-6">
              {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button 
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setAuthError('');
                }}
                className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
              >
                {isRegistering ? 'Log in' : 'Create one'}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
