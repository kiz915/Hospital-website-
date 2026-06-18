import React from 'react';
import { 
  Heart, 
  ShieldCheck, 
  Activity, 
  Stethoscope, 
  Brain, 
  Baby, 
  Plus, 
  Clock, 
  PhoneCall, 
  Award,
  ChevronRight,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { AppUser } from '../types';

interface HomepageProps {
  user: AppUser | null;
  onNavigate: (view: string) => void;
  onBookingTrigger: () => void;
}

export default function Homepage({ user, onNavigate, onBookingTrigger }: HomepageProps) {
  const highlightCards = [
    {
      icon: <Stethoscope className="h-5 w-5 text-emerald-600" />,
      title: "Highly Qualified Clinicians",
      description: "Consult with certified specialists, university professors, and clinical researchers with international credentials."
    },
    {
      icon: <Award className="h-5 w-5 text-emerald-600" />,
      title: "Diagnostic Excellence",
      description: "Our laboratories feature state-of-the-art non-invasive imaging, precision biopsy, and rapid digital test results."
    },
    {
      icon: <ShieldCheck className="h-5 w-5 text-emerald-600" />,
      title: "HIPAA Certified Standards",
      description: "Your health records, appointments, and report documents remain locked behind our attribute-secured patient vault."
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen" id="homepage-viewport">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden py-12 sm:py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Text details */}
            <div className="lg:col-span-7 space-y-5" id="hero-headlines">
              <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                <Heart className="h-3 w-3 text-emerald-600 animate-pulse shrink-0" />
                <span>Next-Generation Healthcare Management</span>
              </div>
              <h1 className="font-sans font-bold text-3xl sm:text-4xl lg:text-5xl text-slate-800 tracking-tight leading-none">
                Clinical Excellence <br/>
                <span className="text-emerald-600">With Personalized care</span>
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm max-w-lg leading-relaxed">
                Welcome to GreenValley Health. Book consultations, view digital diagnostics reports, and communicate with top physicians in our clean, certified, state-of-the-art hospital framework.
              </p>

              {/* Action Buttons */}
              <div className="pt-1 flex flex-col sm:flex-row gap-3">
                <button
                  id="hero-book-btn"
                  onClick={onBookingTrigger}
                  className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-md text-xs font-bold tracking-tight transition-colors shadow-sm cursor-pointer"
                >
                  <span>Schedule Consultation</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  id="hero-dept-btn"
                  onClick={() => onNavigate('departments')}
                  className="flex items-center justify-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-750 border border-slate-200 px-5 py-3 rounded-md text-xs font-bold tracking-tight shadow-sm transition-colors cursor-pointer"
                >
                  <span>Explore Specialties</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 grid grid-cols-3 gap-3 border-t border-slate-200 max-w-md">
                <div>
                  <span className="block text-lg font-bold text-slate-800 tracking-tight">18+</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Departments</span>
                </div>
                <div>
                  <span className="block text-lg font-bold text-slate-800 tracking-tight">99.8%</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Trust Index</span>
                </div>
                <div>
                  <span className="block text-lg font-bold text-slate-800 tracking-tight">150+</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Specialists</span>
                </div>
              </div>
            </div>

            {/* Right side graphic block */}
            <div className="lg:col-span-5 relative" id="hero-graphic-card">
              <div className="relative bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <img
                  src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600"
                  alt="Modern Hospital Facility"
                  className="rounded-lg object-cover w-full h-[280px] sm:h-[320px] shadow-xs"
                />
                
                {/* Floating micro indicators */}
                <div className="absolute bottom-6 -left-4 bg-white p-2.5 rounded-lg border border-slate-200 shadow-md flex items-center space-x-2.5 max-w-[170px]">
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold uppercase">Cardiac Unit</span>
                    <span className="text-[11px] font-bold text-slate-800">Realtime Active</span>
                  </div>
                </div>

                <div className="absolute top-6 -right-4 bg-white p-2.5 rounded-lg border border-slate-200 shadow-md flex items-center space-x-2.5 max-w-[170px]">
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded">
                    <Brain className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold uppercase">Neuro Hub</span>
                    <span className="text-[11px] font-bold text-slate-800">Diagnostics Safe</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Highlights Cards */}
      <section className="py-8 px-4 max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5" id="highlights-container">
          {highlightCards.map((card, i) => (
            <div 
              key={i} 
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start hover:border-emerald-500 transition-colors"
            >
              <div className="p-2.5 bg-emerald-50 rounded-lg mb-3">
                {card.icon}
              </div>
              <h3 className="text-xs font-bold text-slate-850 uppercase tracking-wider mb-1">{card.title}</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">{card.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Emergency / Quick reference banner */}
      <section className="bg-emerald-700 text-white py-10 px-4 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center" id="homepage-emergency-strip">
          <div className="md:col-span-8 space-y-1.5">
            <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <PhoneCall className="h-5 w-5 text-emerald-300 animate-pulse" />
              <span>In Need of Critical Care Counsel?</span>
            </h3>
            <p className="text-emerald-100/90 text-xs max-w-2xl leading-relaxed">
              Our clinical help line supports 24/7 direct operator triage for cardiovascular, neurological, or pediatric emergency questions.
            </p>
          </div>
          <div className="md:col-span-4 md:text-right">
            <a 
              href="tel:1-800-CARE" 
              className="inline-block bg-white text-emerald-700 hover:bg-emerald-50 px-5 py-2.5 rounded-md text-xs font-bold transition-colors shadow-sm"
            >
              Call: 1-800-GREEN-VALLEY
            </a>
          </div>
        </div>
      </section>

      {/* Feature Slider Showcase / Testimonials */}
      <section className="py-12 px-4 max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="text-center pb-8 border-b border-slate-200 mb-8">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block">Patient Trust Stories</span>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">Caring and Healing Journeys</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="testimonials-grid">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative">
            <p className="text-xs italic text-slate-500 leading-relaxed">
              "The patient portal on GreenValley was so smooth. I authenticated with Google, scheduled an ortho slot for my knee rehab, and immediately received a confirmation. I was even able to upload my MRI scans so Dr. Vance could look at them before the session."
            </p>
            <div className="flex items-center space-x-2.5 mt-5">
              <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                AR
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-700">Arthur Reynolds</p>
                <p className="text-[9px] text-slate-400">Radiology Patient Profile</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative">
            <p className="text-xs italic text-slate-500 leading-relaxed">
              "We have consulted Dr. Taylor in Pediatrics for three years now. Moving into the digital GreenValley ecosystem made keeping track of immunization charts and report sheets secure. Absolute recommendation."
            </p>
            <div className="flex items-center space-x-2.5 mt-5">
              <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                ML
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-700">Marie Lindsey</p>
                <p className="text-[9px] text-slate-400">Pediatrics Parent Profile</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
