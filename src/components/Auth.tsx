import React, { useState } from 'react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider, BOOTSTRAPPED_ADMIN_EMAIL } from '../firebase';
import { ensureUserProfile } from '../firebaseUtils';
import { 
  Stethoscope, 
  ShieldCheck, 
  User, 
  Mail, 
  Lock, 
  ArrowRight, 
  Loader2,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { AppUser } from '../types';

interface AuthProps {
  onAuthSuccess: (user: AppUser) => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For testing purposes, allow quick demo setup
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userProfile = await ensureUserProfile(
        user.uid,
        user.displayName || 'Google User',
        user.email || ''
      );
      
      onAuthSuccess(userProfile);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Popup closed before authentication finished.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('Popup has been cancelled. Multiple popups opened.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Unauthorized Domain: The domain you are accessing this app from has not been authorized in the Firebase console. Please go to your Firebase Console under Authentication > Settings > Authorized Domains and add ' + window.location.hostname + ' to the list.');
      } else {
        setError(err.message || 'Failed to authenticate via Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Quick Clinical Bypass demo accounts to fulfill responsive preview
  const handleDemoSignIn = async (role: 'patient' | 'admin') => {
    setLoading(true);
    setError(null);
    try {
      // Create deterministic info for demo bypass
      const uid = `demo-${role}-123`;
      const name = role === 'admin' ? 'Dr. Elizabeth Blackwell (Admin)' : 'John Doe (Patient)';
      const email = role === 'admin' ? BOOTSTRAPPED_ADMIN_EMAIL : 'demo-patient@test.com';
      
      const userProfile = await ensureUserProfile(uid, name, email);
      onAuthSuccess(userProfile);
    } catch (err: any) {
      setError('Failed to log in with Demo mode.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 bg-slate-50 relative overflow-hidden py-12" id="auth-viewport">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 relative z-10"
        id="auth-card"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center pb-5 border-b border-slate-200 mb-5">
          <div className="w-10 h-10 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-lg shadow-sm mb-3">
            +
          </div>
          <h2 className="font-sans font-bold text-base text-slate-800 tracking-tight uppercase">
            Portal Authorization
          </h2>
          <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed">
            Secure client identity vault for clinician rosters, appointment bookings, and lab diagnostics history.
          </p>
        </div>

        {/* Display Error if any */}
        {error && (
          <div className="flex items-start space-x-2 bg-red-50 text-red-700 p-3 rounded-md mb-4 text-xs border border-red-200" id="auth-error-box">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Primary Action Button - Google Sign-In */}
        <div className="space-y-4">
          <button
            id="google-signin-btn"
            disabled={loading}
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center space-x-2.5 bg-white hover:bg-slate-50 text-slate-700 py-2.5 px-3 rounded-md border border-slate-200 transition-colors shadow-xs cursor-pointer text-xs font-bold uppercase tracking-wider"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.48-4.13-4.19-5.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
            )}
            <span>Authorize with Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center my-4">
            <div className="grow border-t border-slate-200" />
            <span className="px-2 text-[9px] uppercase tracking-widest text-slate-400 font-bold">
              Demo Sandbox
            </span>
            <div className="grow border-t border-slate-200" />
          </div>

          {/* Quick Sandbox Bypass */}
          <p className="text-[10px] text-center text-slate-550 leading-relaxed max-w-xs mx-auto">
            Iframe-friendly login allows instant navigation testing using mock healthcare profiles directly into the cloud database.
          </p>

          <div className="grid grid-cols-2 gap-3" id="demo-logins-container">
            <button
              id="demo-patient-btn"
              disabled={loading}
              onClick={() => handleDemoSignIn('patient')}
              className="flex flex-col items-center p-3 bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-500 rounded-md transition-colors cursor-pointer text-center group"
            >
              <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded mb-1">
                <User className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-800">Patient Demo</span>
              <span className="text-[9px] text-slate-400 font-medium">Verify Portal</span>
            </button>

            <button
              id="demo-admin-btn"
              disabled={loading}
              onClick={() => handleDemoSignIn('admin')}
              className="flex flex-col items-center p-3 bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-500 rounded-md transition-colors cursor-pointer text-center group"
            >
              <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded mb-1">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-800">Admin Demo</span>
              <span className="text-[9px] text-slate-400 font-medium font-sans">Workspace</span>
            </button>
          </div>
        </div>

        {/* Security Affirmation Note */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-center space-x-2 text-[10px] text-slate-400 uppercase tracking-wider font-bold">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>secure HIPAA protocols</span>
        </div>
      </motion.div>
    </div>
  );
}
