import React, { useState, useEffect } from 'react';
import { Doctor } from '../types';
import { fetchDoctors } from '../firebaseUtils';
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  Loader2, 
  User, 
  MessageSquare,
  Award,
  CheckCircle2,
  Stethoscope
} from 'lucide-react';

interface DoctorsProps {
  onBookDoctor: (docId: string) => void;
}

export default function Doctors({ onBookDoctor }: DoctorsProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search/Filters states
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  // Load roster
  useEffect(() => {
    async function load() {
      try {
        const list = await fetchDoctors('active');
        setDoctors(list);
      } catch (err: any) {
        console.error(err);
        setError('Failed to pull physician directory. Verify cloud database.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Filter list
  const filteredDocs = doctors.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === 'All' || doc.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const departmentTabs = [
    'All', 'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'General Medicine', 'Dermatology'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="doctors-directory-viewport">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto pb-8 border-b border-slate-200 mb-8" id="doctors-heading">
        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block font-sans">Our Roster</span>
        <h1 className="font-sans font-bold text-2xl sm:text-3xl text-slate-800 tracking-tight mt-1 leading-none">
          Consult Qualified Specialists
        </h1>
        <p className="text-slate-500 text-xs mt-2">
          Verify credentials, list diagnostic appointment slots, and schedule consultations directly with GreenValley specialists.
        </p>
      </div>

      {/* Filter and Search HUD */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs mb-8 space-y-4" id="doctors-filters-wrapper">
        {/* Row 1: Search */}
        <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            id="doctors-filter-search"
            type="text"
            placeholder="Search physicians by name, specialty keyword, or clinical focus..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-semibold focus:outline-hidden text-slate-800 bg-transparent pl-3 outline-hidden"
          />
        </div>

        {/* Row 2: Department Sliding Filter tabs */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-200" id="doctors-dept-tabs">
          {departmentTabs.map((dept) => (
            <button
              key={dept}
              onClick={() => setDeptFilter(dept)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                deptFilter === dept 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Roster display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs mb-6">
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3" id="doctors-roster-loader">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Consulting clinician registries...</span>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white rounded-xl p-10 border border-slate-200 text-center shadow-xs">
          <User className="h-10 w-10 text-slate-350 mx-auto mb-2" />
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">No clinicians match your active filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="doctors-directory-grid">
          {filteredDocs.map((doc) => (
            <div 
              key={doc.id} 
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-emerald-500 transition-colors flex flex-col justify-between"
              id={`doctor-card-${doc.id}`}
            >
              <div>
                {/* Visual Avatar */}
                <div className="flex items-start space-x-3.5">
                  <img
                    src={doc.photoUrl}
                    alt={doc.name}
                    className="w-14 h-14 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="inline-block text-[9px] bg-slate-50 border border-slate-200 text-emerald-800 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      {doc.department}
                    </span>
                    <h3 className="font-bold text-slate-800 text-sm mt-1 mb-0.5 leading-none">{doc.name}</h3>
                    <p className="text-emerald-750 text-[11px] font-semibold">{doc.specialty}</p>
                  </div>
                </div>

                {/* bio copy */}
                <p className="text-slate-500 text-[11px] mt-3.5 leading-relaxed line-clamp-3 italic">
                  "{doc.bio}"
                </p>

                {/* Consultation Details */}
                <div className="mt-3.5 pt-3 border-t border-slate-200 space-y-1.5">
                  <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>Days: {doc.availableDays.join(', ')}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>Slots: {doc.availableSlots.slice(0, 3).join(' • ')}...</span>
                  </div>
                </div>
              </div>

              {/* Direct schedule Trigger */}
              <div className="mt-5 pt-3.5 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 flex items-center space-x-1 uppercase tracking-wider">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                  <span>Accepting Bookings</span>
                </span>
                
                <button
                  id={`booking-trigger-${doc.id}`}
                  onClick={() => onBookDoctor(doc.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10.5px] uppercase tracking-wider px-3.5 py-2.5 rounded-md shadow-xs transition-colors cursor-pointer"
                >
                  Schedule Unit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
