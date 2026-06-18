import React, { useState } from 'react';
import { 
  Stethoscope, 
  Menu, 
  X, 
  LogIn, 
  LogOut, 
  LayoutDashboard, 
  ShieldAlert, 
  User, 
  Activity,
  Heart,
  Calendar
} from 'lucide-react';
import { AppUser } from '../types';

interface NavbarProps {
  user: AppUser | null;
  currentView: string;
  onNavigate: (view: string) => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

export default function Navbar({ user, currentView, onNavigate, onSignIn, onSignOut }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'departments', label: 'Departments' },
    { id: 'doctors', label: 'Our Doctors' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          {/* Logo */}
          <div className="flex items-center" id="navbar-logo-container">
            <button 
              onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }}
              className="flex items-center space-x-2.5 text-emerald-700 hover:opacity-90 cursor-pointer"
              id="navbar-brand-btn"
            >
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-xs">
                +
              </div>
              <span className="font-sans font-bold text-lg tracking-tight text-slate-800">
                GreenValley<span className="text-emerald-700">Health</span>
              </span>
            </button>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center space-x-5" id="navbar-desktop-menu">
            {navItems.map((item) => (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => onNavigate(item.id)}
                className={`font-sans text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer py-1.5 px-3 rounded-md ${
                  currentView === item.id 
                    ? 'bg-emerald-50 text-emerald-700' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}

            {/* App State Dashboards */}
            {user && (
              <button
                id="nav-patient"
                onClick={() => onNavigate('patient')}
                className={`flex items-center space-x-1.5 font-sans text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer py-1.5 px-3 rounded-md ${
                  currentView === 'patient'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Patient Portal</span>
              </button>
            )}

            {user && user.role === 'admin' && (
              <button
                id="nav-admin"
                onClick={() => onNavigate('admin')}
                className={`flex items-center space-x-1.5 font-sans text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50/80 px-3 py-1.5 rounded-md border border-slate-200 hover:bg-emerald-100 transition-colors cursor-pointer`}
              >
                <ShieldAlert className="h-3.5 w-3.5 text-emerald-700" />
                <span>Admin Workspace</span>
              </button>
            )}

            {/* Auth Actions */}
            <div className="border-l border-slate-200 h-6 pl-5 flex items-center">
              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                    <div className="h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold font-sans">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 truncate max-w-[100px]">
                      {user.name.split(' ')[0]}
                    </span>
                  </div>
                  <button
                    id="signout-desktop-btn"
                    onClick={onSignOut}
                    className="flex items-center space-x-1 font-sans text-xs font-bold uppercase text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <button
                  id="signin-desktop-btn"
                  onClick={onSignIn}
                  className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Interactive Portal</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden" id="navbar-mobile-toggle">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-50 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-emerald-50 px-2 pt-2 pb-4 space-y-1 shadow-inner" id="navbar-mobile-drawer">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); setMobileMenuOpen(false); }}
              className={`block w-full text-left px-4 py-3 rounded-lg font-sans text-base font-medium transition-colors cursor-pointer ${
                currentView === item.id 
                  ? 'bg-emerald-50 text-emerald-700 font-semibold' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}

          {user && (
            <button
              onClick={() => { onNavigate('patient'); setMobileMenuOpen(false); }}
              className={`flex items-center space-x-2 w-full text-left px-4 py-3 rounded-lg font-sans text-base font-medium transition-colors cursor-pointer ${
                currentView === 'patient' 
                  ? 'bg-emerald-50 text-emerald-700 font-semibold' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="h-5 w-5 text-emerald-600" />
              <span>Patient Portal</span>
            </button>
          )}

          {user && user.role === 'admin' && (
            <button
              onClick={() => { onNavigate('admin'); setMobileMenuOpen(false); }}
              className="flex items-center space-x-2 w-full text-left px-4 py-3 rounded-lg font-sans text-base font-semibold text-teal-800 bg-teal-50 transition-colors cursor-pointer border border-teal-100"
            >
              <ShieldAlert className="h-5 w-5 text-teal-600" />
              <span>Admin Workspace</span>
            </button>
          )}

          <div className="pt-4 pb-2 border-t border-slate-100 px-4">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="h-9 w-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate max-w-[200px]">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => { onSignOut(); setMobileMenuOpen(false); }}
                  className="flex items-center justify-center space-x-2 w-full bg-slate-50 hover:bg-slate-100 text-slate-700 py-2.5 rounded-lg text-sm font-medium border border-slate-200 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => { onSignIn(); setMobileMenuOpen(false); }}
                className="flex items-center justify-center space-x-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In Portal</span>
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
