import React, { useState, useEffect } from 'react';
import { Doctor, Appointment, AppUser } from '../types';
import { bookAppointment, fetchDoctors } from '../firebaseUtils';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  Loader2, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BookingModalProps {
  user: AppUser;
  preselectedDoctorId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BookingModal({ user, preselectedDoctorId, onClose, onSuccess }: BookingModalProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [selectedDocId, setSelectedDocId] = useState(preselectedDoctorId || '');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [notes, setNotes] = useState('');

  // Selected doctor's custom details
  const currentDoctor = doctors.find(d => d.id === selectedDocId);

  useEffect(() => {
    async function load() {
      try {
        const list = await fetchDoctors('active');
        setDoctors(list);
        if (!selectedDocId && list.length > 0) {
          setSelectedDocId(list[0].id);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch clinician roster.');
      } finally {
        setLoadingDoctors(false);
      }
    }
    load();
  }, [selectedDocId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId || !selectedDate || !selectedTimeSlot) {
      setError('Please input all necessary scheduling slots.');
      return;
    }

    setBooking(true);
    setError(null);

    const docObj = doctors.find(d => d.id === selectedDocId);
    if (!docObj) {
      setError('Selected doctor no longer active in our roster.');
      setBooking(false);
      return;
    }

    try {
      await bookAppointment({
        patientId: user.uid,
        patientName: user.name,
        patientEmail: user.email,
        doctorId: docObj.id,
        doctorName: docObj.name,
        doctorSpecialty: docObj.specialty,
        date: selectedDate,
        time: selectedTimeSlot,
        notes: notes || ''
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2500);
    } catch (err: any) {
      console.error(err);
      setError('Error scheduling appointment. Check verification.');
    } finally {
      setBooking(false);
    }
  };

  // Restrict appointment bookings to today onward
  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" id="booking-modal-overlay">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />

      <div className="flex min-h-screen items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative w-full max-w-md rounded-xl bg-white shadow-lg border border-slate-200 p-5 md:p-6 overflow-hidden z-10"
          id="booking-modal-panel"
        >
          {success ? (
            <div className="flex flex-col items-center text-center py-10" id="booking-success-view">
              <div className="p-3.5 bg-emerald-50 rounded-full text-emerald-600 mb-3 animate-bounce">
                <CheckCircle className="h-12 w-12" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Appointment Requested!</h3>
              <p className="text-[11px] text-slate-500 mt-1.5 max-w-xs leading-relaxed">
                Your appointment block with <strong>{currentDoctor?.name}</strong> has been saved directly to our hospital scheduler.
              </p>
              <div className="mt-5 flex items-center space-x-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded border border-slate-250">
                <Clock className="h-3 w-3" />
                <span>Redirecting to Patient Portal...</span>
              </div>
            </div>
          ) : (
            <div id="booking-form-view">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Schedule Appointment</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">GreenValley Care Schedulers</p>
                </div>
                <button 
                  onClick={onClose} 
                  className="rounded p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {error && (
                <div className="flex items-start space-x-2 bg-red-50 text-red-700 p-3 rounded-md mt-3 text-xs border border-red-250">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              {loadingDoctors ? (
                <div className="flex flex-col items-center py-10 space-y-1.5">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Loading clinicians roster...</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  {/* Doctor Selector */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Select Clinician
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <select
                        id="booking-doctor-select"
                        value={selectedDocId}
                        onChange={(e) => setSelectedDocId(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 text-xs font-medium focus:bg-white focus:ring-1 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors outline-hidden appearance-none cursor-pointer"
                      >
                        {doctors.map(doc => (
                          <option key={doc.id} value={doc.id}>
                            {doc.name} - {doc.specialty}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Date and Slots */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                        Consult Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <input
                          id="booking-date-input"
                          type="date"
                          min={getTodayDateString()}
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 text-xs font-medium focus:bg-white focus:ring-1 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors outline-hidden cursor-pointer"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                        Time Block Slot
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <select
                          id="booking-time-select"
                          value={selectedTimeSlot}
                          onChange={(e) => setSelectedTimeSlot(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 text-xs font-medium focus:bg-white focus:ring-1 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors outline-hidden appearance-none cursor-pointer"
                          required
                        >
                          <option value="">Choose slot</option>
                          {currentDoctor?.availableSlots.map(slot => (
                            <option key={slot} value={slot}>{slot}</option>
                          )) || (
                            <>
                              <option value="09:00 AM">09:00 AM</option>
                              <option value="10:30 AM">10:30 AM</option>
                              <option value="02:00 PM">02:00 PM</option>
                              <option value="03:30 PM">03:30 PM</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Notes / Reason */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Consultation Reason / Symptoms (Optional)
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <textarea
                        id="booking-notes-input"
                        placeholder="Explain briefly any symptoms or current prescriptions..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 text-xs font-medium focus:bg-white focus:ring-1 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors outline-hidden resize-none"
                      />
                    </div>
                  </div>

                  {/* Doctor Bio Snippet */}
                  {currentDoctor && (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start space-x-2.5 text-[10.5px] leading-relaxed text-slate-650">
                      <img 
                      src={currentDoctor.photoUrl} 
                      alt={currentDoctor.name} 
                      className="w-8 h-8 rounded object-cover shrink-0 ring-1 ring-slate-200"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className="font-bold text-slate-750">{currentDoctor.name}</p>
                      <p className="line-clamp-2 italic">"{currentDoctor.bio}"</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2.5 flex items-center justify-end space-x-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 hover:bg-slate-50 text-slate-550 text-xs font-bold uppercase tracking-wider transition-colors rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={booking}
                    id="confirm-booking-btn"
                    className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:bg-slate-350"
                  >
                    {booking ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Booking...</span>
                      </>
                    ) : (
                      <span>Book Slot</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </motion.div>
    </div>
  </div>
  );
}
