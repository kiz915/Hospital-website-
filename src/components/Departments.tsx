import React, { useState } from 'react';
import { DEPARTMENTS } from '../data';
import { 
  Heart, 
  Brain, 
  Baby, 
  Activity, 
  Stethoscope, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { Department } from '../types';

interface DepartmentsProps {
  onBookingTrigger: () => void;
}

export default function Departments({ onBookingTrigger }: DepartmentsProps) {
  const [expandedDeptId, setExpandedDeptId] = useState<string | null>(null);

  // Helper to map icon identifier string to Lucide JSX Component
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Heart':
        return <Heart className="h-7 w-7 text-emerald-600 animate-pulse" />;
      case 'Brain':
        return <Brain className="h-7 w-7 text-teal-600" />;
      case 'Baby':
        return <Baby className="h-7 w-7 text-emerald-600" />;
      case 'Activity':
        return <Activity className="h-7 w-7 text-green-600" />;
      case 'Stethoscope':
        return <Stethoscope className="h-7 w-7 text-emerald-600" />;
      case 'Sparkles':
        return <Sparkles className="h-7 w-7 text-teal-600" />;
      default:
        return <Stethoscope className="h-7 w-7 text-emerald-600" />;
    }
  };

  const toggleExpand = (deptId: string) => {
    if (expandedDeptId === deptId) {
      setExpandedDeptId(null);
    } else {
      setExpandedDeptId(deptId);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="departments-viewport">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto pb-8 border-b border-slate-200 mb-8" id="departments-header">
        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block">Comprehensive Medicine</span>
        <h1 className="font-sans font-bold text-2xl sm:text-3xl text-slate-800 tracking-tight mt-1 leading-none">
          Staffed Consultation Departments
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-2 leading-relaxed">
          Explore specialized diagnostic treatment domains, staffed by qualified clinical professors and research assistants using high-precision digital tech.
        </p>
      </div>

      {/* Grid of specialties */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="departments-grid">
        {DEPARTMENTS.map((dept) => {
          const isExpanded = expandedDeptId === dept.id;
          return (
            <div 
              key={dept.id} 
              className={`bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-emerald-500 transition-colors flex flex-col justify-between ${
                isExpanded ? 'bg-slate-50/50' : ''
              }`}
              id={`dept-card-${dept.id}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    {renderIcon(dept.icon)}
                  </div>
                  <button 
                    onClick={() => toggleExpand(dept.id)}
                    className="text-slate-400 hover:text-emerald-600 p-1 hover:bg-slate-50 rounded transition-colors cursor-pointer"
                    title={isExpanded ? "Collapse Details" : "Expand Details"}
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>

                <h3 className="text-sm font-bold text-slate-800 mt-3.5 tracking-tight uppercase">{dept.name}</h3>
                <p className="text-slate-500 text-[11px] mt-1.5 leading-relaxed">{dept.description}</p>
                
                {/* Expanded therapeutic copy */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-200 text-[11px] text-slate-500 leading-relaxed space-y-2" id={`expanded-info-${dept.id}`}>
                    <p className="font-semibold text-slate-700">Specialty Scope Detail:</p>
                    <p>{dept.longDescription}</p>
                  </div>
                )}
              </div>

              {/* Internal booking routing shortcuts */}
              <div className="mt-5 pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  onClick={() => toggleExpand(dept.id)}
                  className="text-[10px] text-slate-400 font-bold uppercase tracking-wider hover:text-emerald-600 transition-colors cursor-pointer"
                >
                  {isExpanded ? "Less Info" : "Read Scope"}
                </button>
                
                <button
                  id={`book-dept-${dept.id}`}
                  onClick={onBookingTrigger}
                  className="flex items-center space-x-1 text-[10px] text-emerald-600 font-bold uppercase tracking-wider hover:text-emerald-800 cursor-pointer"
                >
                  <span>Book Unit</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust banner */}
      <div 
        className="mt-12 bg-white rounded-xl p-5 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 max-w-5xl mx-auto shadow-sm"
        id="departments-trust-card"
      >
        <div className="flex items-start space-x-3">
          <div className="bg-emerald-50 p-2 rounded-lg text-emerald-650 shrink-0 mt-0.5">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Direct Consultation Pathways</h4>
            <p className="text-[11px] text-slate-500 mt-0.5 max-w-xl leading-relaxed">
              All listed departments operate under certified board guidelines. You can book outpatient visits with certified cardiologists, neurologists, ortho physicians, etc., securely.
            </p>
          </div>
        </div>
        <button
          onClick={onBookingTrigger}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-md shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          Begin Intake Protocol
        </button>
      </div>
    </div>
  );
}
