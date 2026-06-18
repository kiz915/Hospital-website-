import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { ensureUserProfile, seedDoctorsIfEmpty } from './firebaseUtils';
import { AppUser } from './types';
import Navbar from './components/Navbar';
import Homepage from './components/Homepage';
import Departments from './components/Departments';
import Doctors from './components/Doctors';
import Auth from './components/Auth';
import PatientDashboard from './components/PatientDashboard';
import AdminPanel from './components/AdminPanel';
import BookingModal from './components/BookingModal';
import { Loader2, Heart, HeartCrack, Clipboard, ShieldX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [currentView, setCurrentView] = useState<string>('home');
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  
  // Scheduling States
  const [bookingOpen, setBookingOpen] = useState(false);
  const [preselectedDocId, setPreselectedDocId] = useState<string | undefined>(undefined);
  const [redirectAfterAuth, setRedirectAfterAuth] = useState<string | null>(null);

  useEffect(() => {
    // 1. Seed doctor lists on load if they do not exist
    seedDoctorsIfEmpty();

    // 2. Track authentications states
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthChecking(true);
      if (firebaseUser) {
        try {
          const profile = await ensureUserProfile(
            firebaseUser.uid,
            firebaseUser.displayName || 'Google User',
            firebaseUser.email || ''
          );
          setUser(profile);
          
          // Execute auth redirect if buffered
          if (redirectAfterAuth) {
            setCurrentView(redirectAfterAuth);
            setRedirectAfterAuth(null);
          } else if (currentView === 'auth') {
            setCurrentView(profile.role === 'admin' ? 'admin' : 'patient');
          }
        } catch (error) {
          console.error('Error establishing user session profile:', error);
        }
      } else {
        setUser(null);
        if (currentView === 'patient' || currentView === 'admin') {
          setCurrentView('home');
        }
      }
      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, [redirectAfterAuth, currentView]);

  const handleNavigate = (view: string) => {
    setErrorBanner(null);
    if ((view === 'patient' || view === 'admin') && !user) {
      setRedirectAfterAuth(view);
      setCurrentView('auth');
      return;
    }
    
    if (view === 'admin' && user?.role !== 'admin') {
      setCurrentView('home');
      return;
    }

    setCurrentView(view);
  };

  const handleBookingTrigger = (docId?: string) => {
    if (!user) {
      // Prompt user to sign in first, but buffer their intent!
      setPreselectedDocId(docId);
      setRedirectAfterAuth('patient');
      setCurrentView('auth');
      setErrorBanner('Please authenticate into your secure medical workspace to schedule consultations.');
      return;
    }
    setPreselectedDocId(docId);
    setBookingOpen(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setCurrentView('home');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Graceful state notifier alerts
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return (
          <Homepage 
            user={user} 
            onNavigate={handleNavigate} 
            onBookingTrigger={() => handleBookingTrigger()} 
          />
        );
      case 'departments':
        return (
          <Departments 
            onBookingTrigger={() => handleBookingTrigger()} 
          />
        );
      case 'doctors':
        return (
          <Doctors 
            onBookDoctor={(docId) => handleBookingTrigger(docId)} 
          />
        );
      case 'patient':
        if (!user) return <div />;
        return <PatientDashboard user={user} />;
      case 'admin':
        if (!user || user.role !== 'admin') return <div />;
        return <AdminPanel user={user} />;
      case 'auth':
        return (
          <Auth 
            onAuthSuccess={(validatedUser) => {
              setUser(validatedUser);
              const destination = redirectAfterAuth || (validatedUser.role === 'admin' ? 'admin' : 'patient');
              setCurrentView(destination);
              setRedirectAfterAuth(null);
            }} 
          />
        );
      default:
        return <Homepage user={user} onNavigate={handleNavigate} onBookingTrigger={() => handleBookingTrigger()} />;
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center" id="global-clinical-loader">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mb-3" />
        <span className="font-sans font-extrabold text-slate-800 text-lg tracking-tight">GreenValley Medical Hub</span>
        <span className="text-xs text-slate-400 mt-1 font-semibold uppercase tracking-wider">Establishing encrypted clinical firewall...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/30 flex flex-col justify-between" id="global-hospital-viewport">
      <div>
        {/* Navigation */}
        <Navbar 
          user={user} 
          currentView={currentView}
          onNavigate={handleNavigate}
          onSignIn={() => handleNavigate('auth')}
          onSignOut={handleSignOut}
        />

        {/* Temporary warning/alert banners */}
        {errorBanner && (
          <div className="bg-emerald-50 border-b border-emerald-100 text-emerald-800 text-xs font-semibold py-3 px-4 text-center flex items-center justify-center space-x-2 animate-fade-in" id="error-banner">
            <span>{errorBanner}</span>
            <button onClick={() => setErrorBanner(null)} className="text-emerald-600 font-bold hover:opacity-75 pl-2 cursor-pointer">✕</button>
          </div>
        )}

        {/* Main core content viewport */}
        <main className="pb-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Hospital Footer */}
      <footer className="bg-slate-900 text-white border-t border-slate-800 py-12" id="clinical-utility-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-emerald-400" id="footer-brand">
              <Clipboard className="h-5 w-5" />
              <span className="font-sans font-bold text-lg tracking-tight text-white">
                GreenValley<span className="text-emerald-400">Health</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Certified primary clinic healthcare setups with clinical research centers, diagnostic services, and non-invasive cardiovascular imaging chambers.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300 mb-4">Navigations</h4>
            <div className="flex flex-col space-y-2 text-xs text-slate-400">
              <button onClick={() => handleNavigate('home')} className="hover:text-emerald-400 text-left cursor-pointer">Hospital Home</button>
              <button onClick={() => handleNavigate('departments')} className="hover:text-emerald-400 text-left cursor-pointer">Our Departments</button>
              <button onClick={() => handleNavigate('doctors')} className="hover:text-emerald-400 text-left cursor-pointer">Find Doctors</button>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300 mb-4">Patient Portal</h4>
            <div className="flex flex-col space-y-3 text-xs text-slate-400">
              <button onClick={() => handleNavigate('patient')} className="hover:text-emerald-400 text-left cursor-pointer">Appointments</button>
              <button onClick={() => handleNavigate('patient')} className="hover:text-emerald-400 text-left cursor-pointer">Health Records Vault</button>
              {user?.role === 'admin' && (
                <button onClick={() => handleNavigate('admin')} className="hover:text-amber-400 font-bold text-left cursor-pointer text-emerald-400">Operations Desk</button>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300 mb-4">Quality Standards</h4>
            <div className="text-slate-400 text-xs space-y-2">
              <p>HIPAA Standard Audited</p>
              <p>Joint Commission International Approved</p>
              <p>Clinical Firewall Protected</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-8 border-t border-slate-800/80 text-center text-slate-500 text-xs">
          <p>© {new Date().getFullYear()} GreenValley Health Group. Fully encrypted Firebase Firestore cloud ledger. All data secure.</p>
        </div>
      </footer>

      {/* Roster Appointment Scheduler Popup */}
      <AnimatePresence>
        {bookingOpen && user && (
          <BookingModal
            user={user}
            preselectedDoctorId={preselectedDocId}
            onClose={() => {
              setBookingOpen(false);
              setPreselectedDocId(undefined);
            }}
            onSuccess={() => {
              setBookingOpen(false);
              setPreselectedDocId(undefined);
              setCurrentView('patient'); // route to view their booking slot directly
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
