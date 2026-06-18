import React, { useState, useEffect } from 'react';
import { AppUser, Doctor, Appointment, Report } from '../types';
import { 
  fetchDoctors, 
  addDoctor, 
  modifyDoctor, 
  removeDoctor, 
  fetchAppointments, 
  updateAppointmentStatus, 
  deleteAppointmentRecord,
  fetchPatientsList
} from '../firebaseUtils';
import { 
  ShieldAlert, 
  Calendar, 
  Users, 
  Stethoscope, 
  Check, 
  PenSquare, 
  Trash2, 
  Filter, 
  UserPlus, 
  Clock, 
  Loader2, 
  Plus, 
  Search, 
  X,
  TrendingUp,
  SlidersHorizontal,
  Ban,
  CheckCircle,
  FileCheck
} from 'lucide-react';

interface AdminPanelProps {
  user: AppUser;
}

export default function AdminPanel({ user }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'appointments' | 'doctors' | 'patients'>('appointments');
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<AppUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [doctorFilter, setDoctorFilter] = useState<string>('all');
  const [patientSearch, setPatientSearch] = useState<string>('');

  // Doctor Form Modal States
  const [addDocModal, setAddDocModal] = useState(false);
  const [editDocId, setEditDocId] = useState<string | null>(null);
  const [docForm, setDocForm] = useState({
    name: '',
    specialty: '',
    department: 'Cardiology',
    bio: '',
    status: 'active' as 'active' | 'inactive',
    photoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    availableDaysStr: 'Monday, Tuesday, Wednesday',
    availableSlotsStr: '09:00 AM, 10:00 AM, 11:00 AM, 02:00 PM, 03:00 PM, 04:00 PM'
  });

  const loadAllAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const appPromise = fetchAppointments();
      const docPromise = fetchDoctors('all');
      const patPromise = fetchPatientsList();
      
      const [appResults, docResults, patResults] = await Promise.all([appPromise, docPromise, patPromise]);
      setAppointments(appResults);
      setDoctors(docResults);
      setPatients(patResults);
    } catch (err: any) {
      console.error(err);
      setError('Access failure or security clearance needed for administration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const handleUpdateStatus = async (apptId: string, newStatus: any) => {
    try {
      await updateAppointmentStatus(apptId, newStatus);
      loadAllAdminData();
    } catch (err) {
      setError('Error altering appointment status.');
    }
  };

  const handleDeleteAppt = async (apptId: string) => {
    if (!window.confirm('Delete this appointment record permanently?')) return;
    try {
      await deleteAppointmentRecord(apptId);
      loadAllAdminData();
    } catch (err) {
      setError('Error clearing appointment log.');
    }
  };

  // Doctors operations
  const handleSubmitDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.name || !docForm.specialty || !docForm.bio) {
      alert('Kindly complete all required profile fields.');
      return;
    }

    try {
      const parsedDays = docForm.availableDaysStr.split(',').map(s => s.trim());
      const parsedSlots = docForm.availableSlotsStr.split(',').map(s => s.trim());

      const payload = {
        name: docForm.name,
        specialty: docForm.specialty,
        department: docForm.department,
        bio: docForm.bio,
        status: docForm.status,
        photoUrl: docForm.photoUrl,
        availableDays: parsedDays,
        availableSlots: parsedSlots
      };

      if (editDocId) {
        await modifyDoctor(editDocId, payload);
      } else {
        await addDoctor(payload);
      }

      setAddDocModal(false);
      setEditDocId(null);
      setDocForm({
        name: '',
        specialty: '',
        department: 'Cardiology',
        bio: '',
        status: 'active',
        photoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
        availableDaysStr: 'Monday, Tuesday, Wednesday',
        availableSlotsStr: '09:00 AM, 10:00 AM, 11:00 AM, 02:00 PM, 03:00 PM, 04:00 PM'
      });
      loadAllAdminData();
    } catch (err) {
      setError('Could not update doctors roster.');
    }
  };

  const handleEditDoctor = (docItem: Doctor) => {
    setEditDocId(docItem.id);
    setDocForm({
      name: docItem.name,
      specialty: docItem.specialty,
      department: docItem.department,
      bio: docItem.bio,
      status: docItem.status,
      photoUrl: docItem.photoUrl,
      availableDaysStr: docItem.availableDays.join(', '),
      availableSlotsStr: docItem.availableSlots.join(', ')
    });
    setAddDocModal(true);
  };

  const handleDeleteDoctor = async (docId: string) => {
    if (!window.confirm('Delete this clinician profile from listings?')) return;
    try {
      await removeDoctor(docId);
      loadAllAdminData();
    } catch (err) {
      setError('Failed to clear clinician record.');
    }
  };

  // Filter lists
  const filteredAppointments = appointments.filter(appt => {
    const matchStatus = statusFilter === 'all' || appt.status === statusFilter;
    const matchDoctor = doctorFilter === 'all' || appt.doctorId === doctorFilter;
    return matchStatus && matchDoctor;
  });

  const filteredPatients = patients.filter(p => {
    return p.name.toLowerCase().includes(patientSearch.toLowerCase()) || 
           p.email.toLowerCase().includes(patientSearch.toLowerCase());
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-emerald-700 bg-emerald-50 border-emerald-100';
      case 'cancelled':
        return 'text-red-700 bg-red-50 border-red-100';
      case 'completed':
        return 'text-slate-700 bg-slate-100 border-slate-200';
      default:
        return 'text-amber-700 bg-amber-50 border-amber-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="admin-workspace-viewport">
      {/* Admin Title Board */}
      <div 
        className="relative bg-teal-850 text-white rounded-xl p-5 sm:p-6 shadow-sm overflow-hidden mb-6 border border-teal-900"
        id="admin-header-banner"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20 transform rotate-12 pointer-events-none" />
        <div className="realtime z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-1.5 bg-white/10 px-2.5 py-1 rounded w-max border border-white/10 mb-2">
              <ShieldAlert className="h-3.5 w-3.5 text-indigo-300" />
              <span className="text-[9px] font-bold tracking-wider uppercase text-indigo-100">Clinic Authority Workspace</span>
            </div>
            <h1 className="font-sans font-bold text-2xl tracking-tight leading-none text-white">
              Hospital Operations Workspace
            </h1>
            <p className="text-emerald-100/85 text-xs mt-1 max-w-xl">
              Track multi-department appointment statuses, update clinician listings, and audit patient medical schedules.
            </p>
          </div>
        </div>
      </div>

      {/* Workspace Subheading Metrics / Counter grids */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6" id="admin-kpi-grid">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Queue Queries</span>
          <span className="text-lg font-bold text-slate-800 mt-0.5 block">
            {appointments.filter(a => a.status === 'pending').length}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Scheduled Visits</span>
          <span className="text-lg font-bold text-emerald-700 mt-0.5 block">
            {appointments.filter(a => a.status === 'confirmed').length}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Clinicians</span>
          <span className="text-lg font-bold text-teal-700 mt-0.5 block">
            {doctors.length}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Patients Registered</span>
          <span className="text-lg font-bold text-indigo-705 mt-0.5 block">
            {patients.length}
          </span>
        </div>
      </div>

      {/* Tab Navifiers */}
      <div className="flex border-b border-slate-200 mb-6" id="admin-workspace-tabs">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex items-center space-x-1.5 py-2.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeTab === 'appointments'
              ? 'border-indigo-650 text-indigo-700 bg-slate-50'
              : 'border-transparent text-slate-550 hover:text-indigo-700'
          }`}
          id="admin-tab-appointments"
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Appointments Control</span>
        </button>

        <button
          onClick={() => setActiveTab('doctors')}
          className={`flex items-center space-x-1.5 py-2.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeTab === 'doctors'
              ? 'border-indigo-650 text-indigo-700 bg-slate-50'
              : 'border-transparent text-slate-550 hover:text-indigo-700'
          }`}
          id="admin-tab-doctors"
        >
          <Stethoscope className="h-3.5 w-3.5" />
          <span>Manage Clinicians</span>
        </button>

        <button
          onClick={() => setActiveTab('patients')}
          className={`flex items-center space-x-1.5 py-2.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeTab === 'patients'
              ? 'border-indigo-650 text-indigo-700 bg-slate-50'
              : 'border-transparent text-slate-550 hover:text-indigo-700'
          }`}
          id="admin-tab-patients"
        >
          <Users className="h-3.5 w-3.5" />
          <span>Patient Directory</span>
        </button>
      </div>

      {/* Error Displays */}
      {error && (
        <div className="bg-red-50 border border-red-205 rounded-md p-3 mb-5 text-red-700 text-xs flex items-start space-x-2">
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3" id="admin-loader">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wilder">Pulling Clinic Authority Records...</span>
        </div>
      ) : activeTab === 'appointments' ? (
        /* APPOINTMENTS TABS */
        <div id="admin-appointments-view">
          {/* Filter Board */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-1.5 text-[9px] font-bold text-slate-450 uppercase tracking-widest">
              <SlidersHorizontal className="h-4 w-4 text-slate-400 font-sans" />
              <span>Diagnostic Filter Dashboard</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Status Selector */}
              <div>
                <select
                  id="admin-filter-status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider focus:outline-hidden focus:ring-1 focus:ring-indigo-500/15 cursor-pointer outline-hidden"
                >
                  <option value="all">Statuses (All)</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Doctor Selector */}
              <div>
                <select
                  id="admin-filter-doctor"
                  value={doctorFilter}
                  onChange={(e) => setDoctorFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider focus:outline-hidden focus:ring-1 focus:ring-indigo-500/15 cursor-pointer outline-hidden"
                >
                  <option value="all">Clinicians (All)</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* List display */}
          {filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
              <Calendar className="h-14 w-14 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-sans text-sm">No clinical schedules match your active filter mappings.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden" id="admin-appt-table-container">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-4 px-6">Patient</th>
                      <th className="py-4 px-6">Chosen Clinician</th>
                      <th className="py-4 px-6">Scheduled Slots</th>
                      <th className="py-4 px-6">Symptoms Summary</th>
                      <th className="py-4 px-6 text-center">Status</th>
                      <th className="py-4 px-6 text-right">Operation Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                    {filteredAppointments.map((appt) => (
                      <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors" id={`admin-appt-row-${appt.id}`}>
                        <td className="py-4.5 px-6">
                          <p className="font-extrabold text-slate-800">{appt.patientName}</p>
                          <p className="text-[10px] text-slate-400">{appt.patientEmail}</p>
                        </td>
                        <td className="py-4.5 px-6">
                          <p className="font-bold text-slate-800">{appt.doctorName}</p>
                          <p className="text-[10px] text-indigo-600 font-semibold">{appt.doctorSpecialty}</p>
                        </td>
                        <td className="py-4.5 px-6 space-y-0.5">
                          <p className="font-semibold text-slate-700 flex items-center space-x-1.5">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            <span>{appt.date}</span>
                          </p>
                          <p className="text-[10px] text-slate-400 flex items-center space-x-1.5">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span>{appt.time}</span>
                          </p>
                        </td>
                        <td className="py-4.5 px-6 max-w-[180px] truncate" title={appt.notes}>
                          <p className="italic text-slate-500">{appt.notes || 'No symptoms provided'}</p>
                        </td>
                        <td className="py-4.5 px-6 text-center">
                          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${getStatusStyle(appt.status)}`}>
                            {appt.status}
                          </span>
                        </td>
                        <td className="py-4.5 px-6 text-right space-x-2">
                          {appt.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateStatus(appt.id, 'confirmed')}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-emerald-100 transition-colors cursor-pointer"
                              id={`approve-appt-${appt.id}`}
                            >
                              Approve
                            </button>
                          )}
                          {appt.status === 'confirmed' && (
                            <button
                              onClick={() => handleUpdateStatus(appt.id, 'completed')}
                              className="bg-slate-50 hover:bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-indigo-100 transition-colors cursor-pointer"
                              id={`complete-appt-${appt.id}`}
                            >
                              End Visit
                            </button>
                          )}
                          {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                            <button
                              onClick={() => handleUpdateStatus(appt.id, 'cancelled')}
                              className="bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-red-100 transition-colors cursor-pointer"
                              id={`reject-appt-${appt.id}`}
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAppt(appt.id)}
                            className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all inline-block cursor-pointer"
                            id={`del-log-${appt.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'doctors' ? (
        /* DOCTORS TABS */
        <div id="admin-doctors-view">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Clinicians Roster</h3>
            <button
              onClick={() => {
                setEditDocId(null);
                setDocForm({
                  name: '',
                  specialty: '',
                  department: 'Cardiology',
                  bio: '',
                  status: 'active',
                  photoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
                  availableDaysStr: 'Monday, Tuesday, Wednesday',
                  availableSlotsStr: '09:00 AM, 10:00 AM, 11:00 AM, 02:00 PM, 03:00 PM, 04:00 PM'
                });
                setAddDocModal(true);
              }}
              id="admin-add-doctor-btn"
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Enroll Clinician</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="doctors-roster-grid">
            {doctors.map(docItem => (
              <div 
                key={docItem.id} 
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                id={`admin-doc-${docItem.id}`}
              >
                <div>
                  <div className="flex items-start space-x-4">
                    <img
                      src={docItem.photoUrl}
                      alt={docItem.name}
                      className="w-13 h-13 rounded-xl object-cover ring-2 ring-slate-100 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm leading-snug">{docItem.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{docItem.specialty}</p>
                      <span className="inline-block mt-1.5 text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                        {docItem.department}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 mt-4 leading-relaxed line-clamp-3 italic">
                    "{docItem.bio}"
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-1 text-[10px] font-semibold text-slate-400 leading-none">
                    <p>Schedule: <span className="text-slate-600">{docItem.availableDays.join(', ')}</span></p>
                    <p className="mt-1">Slots: <span className="text-slate-600">{docItem.availableSlots.slice(0, 3).join(', ')}...</span></p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    docItem.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}>
                    {docItem.status}
                  </span>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditDoctor(docItem)}
                      className="text-indigo-600 hover:text-indigo-800 p-2 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Profile"
                      id={`edit-doc-${docItem.id}`}
                    >
                      <PenSquare className="h-4.5 w-4.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteDoctor(docItem.id)}
                      className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Decommission Clinician"
                      id={`del-doc-${docItem.id}`}
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* PATIENTS TABS */
        <div id="admin-patients-view">
          <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center space-x-3 mb-6" id="patient-search-holder">
            <Search className="h-5 w-5 text-slate-400" />
            <input
              id="patient-search-input"
              type="text"
              placeholder="Search patients by email or profile name descriptor..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              className="w-full text-xs font-semibold focus:outline-hidden text-slate-800 bg-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="patients-list-grid">
            {filteredPatients.map(pat => (
              <div 
                key={pat.uid} 
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-center"
                id={`patient-profile-${pat.uid}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold font-sans">
                    {pat.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">{pat.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{pat.email}</p>
                    <p className="text-[9px] text-slate-400">Account UID: {pat.uid}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    Patient Verified
                  </span>
                  <p className="text-[9px] text-slate-400 mt-2">Registered: {pat.createdAt ? new Date(pat.createdAt).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Doctor Modal Add/Edit */}
      {addDocModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" id="doc-modal-overlay">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setAddDocModal(false)} />
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6 border border-slate-100 z-10" id="doc-form-panel">
              {/* Header */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-bold text-slate-800 leading-none">
                  {editDocId ? 'Edit Clinician profile' : 'Add New Clinician'}
                </h3>
                <button onClick={() => setAddDocModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmitDoctor} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-sans font-bold mb-1">Full Name</label>
                  <input
                    type="text"
                    value={docForm.name}
                    onChange={(e) => setDocForm({...docForm, name: e.target.value})}
                    placeholder="e.g. Dr. Arthur Conan"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-sans font-bold mb-1">Clinic specialty</label>
                    <input
                      type="text"
                      value={docForm.specialty}
                      onChange={(e) => setDocForm({...docForm, specialty: e.target.value})}
                      placeholder="e.g. Consultant Cardiologist"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-sans font-bold mb-1">Home Department</label>
                    <select
                      value={docForm.department}
                      onChange={(e) => setDocForm({...docForm, department: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white"
                    >
                      <option value="Cardiology">Cardiology</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Orthopedics">Orthopedics</option>
                      <option value="General Medicine">General Medicine</option>
                      <option value="Dermatology">Dermatology</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-sans font-bold mb-1">Short Clinical Bio</label>
                  <textarea
                    value={docForm.bio}
                    onChange={(e) => setDocForm({...docForm, bio: e.target.value})}
                    placeholder="Write a brief background..."
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-sans font-bold mb-1">Available Days (comma-separated)</label>
                    <input
                      type="text"
                      value={docForm.availableDaysStr}
                      onChange={(e) => setDocForm({...docForm, availableDaysStr: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 text-[11px]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-sans font-bold mb-1">Cleric Slots (comma-separated)</label>
                    <input
                      type="text"
                      value={docForm.availableSlotsStr}
                      onChange={(e) => setDocForm({...docForm, availableSlotsStr: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 text-[11px]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-sans font-bold mb-1">Photo Reference URL</label>
                    <input
                      type="text"
                      value={docForm.photoUrl}
                      onChange={(e) => setDocForm({...docForm, photoUrl: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-sans font-bold mb-1">Active Status</label>
                    <select
                      value={docForm.status}
                      onChange={(e) => setDocForm({...docForm, status: e.target.value as any})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setAddDocModal(false)}
                    className="p-2 px-4 hover:bg-slate-50 text-slate-500 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="p-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
