import React, { useState, useEffect } from 'react';
import { AppUser, Appointment, Report } from '../types';
import { 
  fetchAppointments, 
  fetchReports, 
  updateAppointmentStatus, 
  uploadMedicalReport,
  deleteReportRecord
} from '../firebaseUtils';
import { 
  Calendar, 
  Clock, 
  FileText, 
  Upload, 
  Trash2, 
  Plus, 
  Loader2, 
  AlertCircle, 
  FileSpreadsheet, 
  TrendingUp, 
  Activity, 
  ShieldCheck,
  UserCheck,
  Tag,
  FolderOpen,
  X
} from 'lucide-react';
import { motion } from 'motion/react';
import BookingModal from './BookingModal';

interface PatientDashboardProps {
  user: AppUser;
}

export default function PatientDashboard({ user }: PatientDashboardProps) {
  const [activeTab, setActiveTab] = useState<'appointments' | 'reports'>('appointments');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  // Upload Form State
  const [uploadLoading, setUploadLoading] = useState(false);
  const [reportFile, setReportFile] = useState<{name: string, size: string} | null>(null);
  const [reportCategory, setReportCategory] = useState('Laboratory Results');
  const [reportTitle, setReportTitle] = useState('');
  const [reportNotes, setReportNotes] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const apptsPromise = fetchAppointments(user.uid);
      const reportsPromise = fetchReports(user.uid);
      
      const [apptsList, reportsList] = await Promise.all([apptsPromise, reportsPromise]);
      setAppointments(apptsList);
      setReports(reportsList);
    } catch (err: any) {
      console.error(err);
      setError('Failed to pull patient records securely.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.uid]);

  const handleCancelAppointment = async (apptId: string) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await updateAppointmentStatus(apptId, 'cancelled');
      loadData();
    } catch (err) {
      setError('Failed to cancel appointment. Verify connection.');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm('Remove this medical record from database permanently?')) return;
    try {
      await deleteReportRecord(reportId);
      loadData();
    } catch (err) {
      setError('Could not remove file summary from storage database.');
    }
  };

  // Simulating dragging files or selecting files
  const handleFakeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Human-readable size converter
      const sizeKB = Math.round(file.size / 1024);
      const sizeStr = sizeKB > 1000 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
      setReportFile({ name: file.name, size: sizeStr });
      if (!reportTitle) {
        setReportTitle(file.name.split('.')[0]);
      }
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportFile || !reportTitle) {
      setError('Please select a file and enter a descriptive name.');
      return;
    }

    setUploadLoading(true);
    setError(null);
    try {
      await uploadMedicalReport({
        patientId: user.uid,
        fileName: `${reportTitle}.${reportFile.name.split('.').pop()}`,
        fileSize: reportFile.size,
        category: reportCategory,
        notes: reportNotes || 'N/A'
      });
      
      setReportSuccess(true);
      setReportFile(null);
      setReportTitle('');
      setReportNotes('');
      
      await loadData();
      setTimeout(() => setReportSuccess(false), 3000);
    } catch (err) {
      setError('Failed to log report details into database.');
    } finally {
      setUploadLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'completed':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="patient-dashboard-container">
      {/* Upper Welcome Header banner */}
      <div 
        className="relative bg-teal-800 text-white rounded-xl p-5 sm:p-6 shadow-sm overflow-hidden mb-6 border border-teal-900"
        id="dashboard-header"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20 transform rotate-45 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-12 -mb-12 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-1.5 bg-white/15 px-2.5 py-1 rounded w-max border border-white/10 mb-2">
              <UserCheck className="h-3.5 w-3.5 text-emerald-300" />
              <span className="text-[9px] font-bold tracking-wider uppercase text-emerald-100">Patient Registry Portal</span>
            </div>
            <h1 className="font-sans font-bold text-2xl text-white tracking-tight leading-none">
              Welcome, {user.name}
            </h1>
            <p className="text-emerald-100/85 text-xs mt-1.5 max-w-xl">
              Track clinical timetables, view lab results from specialists, and schedule diagnostic evaluations.
            </p>
          </div>

          <button
            id="scheduler-trigger-btn"
            onClick={() => setBookingOpen(true)}
            className="flex items-center space-x-1.5 bg-white text-emerald-900 hover:bg-slate-50 px-4 py-2.5 rounded-md font-bold transition-all shrink-0 cursor-pointer text-[10.5px] uppercase tracking-wider shadow-sm"
          >
            <Plus className="h-4 w-4 text-emerald-600" />
            <span>Schedule Room Unit</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6" id="patient-stats-grid">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="p-2 bg-slate-50 border border-slate-200 rounded text-emerald-700">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Scheduled Visits</span>
            <span className="text-lg font-bold text-slate-800 tracking-tight" id="stat-total-appts">
              {appointments.filter(a => a.status !== 'cancelled').length}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="p-2 bg-slate-50 border border-slate-200 rounded text-emerald-700">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Medical Records</span>
            <span className="text-lg font-bold text-slate-800 tracking-tight" id="stat-total-reports">
              {reports.length}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="p-2 bg-slate-50 border border-slate-200 rounded text-emerald-700">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Account Status</span>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 inline-block mt-0.5 uppercase tracking-wider" id="stat-role">
              Active Patient Profile
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6" id="dashboard-tabs">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex items-center space-x-1.5 py-2.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeTab === 'appointments'
              ? 'border-emerald-600 text-emerald-700 bg-slate-50'
              : 'border-transparent text-slate-550 hover:text-emerald-700'
          }`}
          id="tab-appointments"
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Visits Scheduler ({appointments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center space-x-1.5 py-2.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeTab === 'reports'
              ? 'border-emerald-600 text-emerald-700 bg-slate-50'
              : 'border-transparent text-slate-550 hover:text-emerald-700'
          }`}
          id="tab-reports"
        >
          <FileText className="h-3.5 w-3.5" />
          <span>File Records ({reports.length})</span>
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start space-x-2 bg-red-50 text-red-700 p-3 rounded-md mb-5 text-xs border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3" id="patient-loading">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
          <span className="text-sm font-medium text-slate-400">Syncing clinical files securely...</span>
        </div>
      ) : activeTab === 'appointments' ? (
        /* APPOINTMENTS TAB */
        <div className="space-y-4" id="dashboard-appointments-list">
          {appointments.length === 0 ? (
            <div className="bg-white rounded-xl p-10 border border-slate-200 text-center shadow-xs">
              <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">No appointments scheduled</h3>
              <p className="text-slate-450 text-[11px] mt-1.5 max-w-sm mx-auto">
                Any future medical clinical schedules will map directly inside this timeline view.
              </p>
              <button
                onClick={() => setBookingOpen(true)}
                className="mt-4 inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-md font-bold text-[10.5px] uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Book Clinic Room</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {appointments.map((appt) => (
                <div 
                  key={appt.id} 
                  className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-xs relative overflow-hidden"
                  id={`patient-appt-${appt.id}`}
                >
                  {/* Decorative timeline marker */}
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-600" />

                  <div>
                    <div className="flex justify-between items-start mb-2 pl-2">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{appt.doctorSpecialty}</span>
                        <h4 className="text-sm font-bold text-slate-800 mt-0.5 mb-1">{appt.doctorName}</h4>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide rounded border ${getStatusBadgeClass(appt.status)}`}>
                        {appt.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 my-3 bg-slate-50 p-2.5 rounded border border-slate-200 ml-2">
                      <div className="flex items-center space-x-2 text-slate-600 text-[11px] font-medium">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>Date: {appt.date}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-600 text-[11px] font-medium">
                        <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>Time Slot: {appt.time}</span>
                      </div>
                    </div>

                    {appt.notes && (
                      <div className="mt-2 text-[10.5px] text-slate-500 leading-relaxed bg-amber-50/20 p-2.5 rounded border border-amber-200/50 ml-2">
                        <strong className="text-slate-600">Symptom Summary:</strong> "{appt.notes}"
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {(appt.status === 'pending' || appt.status === 'confirmed') && (
                    <div className="mt-4 pt-2.5 border-t border-slate-200 flex justify-end">
                      <button
                        onClick={() => handleCancelAppointment(appt.id)}
                        className="text-red-600 hover:text-red-700 font-bold text-[10px] uppercase tracking-wider flex items-center space-x-1 hover:bg-red-50 px-2.5 py-1.5 rounded transition-colors cursor-pointer"
                        id={`cancel-appt-${appt.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Cancel Visit</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* REPORTS TAB */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-reports-grid">
          {/* List of Reports (span 2) */}
          <div className="lg:col-span-2 space-y-3.5">
            <h3 className="text-xs font-bold text-slate-850 flex items-center space-x-1.5 uppercase tracking-wider pb-2 border-b border-slate-250">
              <FolderOpen className="h-4 w-4 text-emerald-600" />
              <span>Diagnostic Record Registry</span>
            </h3>

            {reports.length === 0 ? (
              <div className="bg-white rounded-xl p-10 border border-slate-200 text-center shadow-xs">
                <FileText className="h-10 w-10 text-slate-350 mx-auto mb-3" />
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-tight">No files registered</h3>
                <p className="text-slate-400 text-[11px] mt-1 max-w-xs mx-auto">
                  Upload PDF diagnostics, blood panels, or physical prescription summaries to build patient health records.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div 
                    key={report.id} 
                    className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between shadow-xs hover:border-emerald-500 transition-colors"
                    id={`report-item-${report.id}`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded text-emerald-700">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-800 max-w-[200px] sm:max-w-xs truncate">{report.fileName}</h4>
                          <span className="text-[9px] bg-slate-50 text-slate-600 border border-slate-200 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                            {report.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Size: {report.fileSize} • Uploaded {report.uploadedAt?.toDate ? report.uploadedAt.toDate().toLocaleDateString() : 'Just Now'}
                        </p>
                        {report.notes && (
                          <p className="text-[10.5px] text-slate-500 italic mt-1 border-l-2 border-emerald-500 pl-2">
                            "{report.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                      title="Delete Report Record"
                      id={`delete-report-${report.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Secure Uploader Form (span 1) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs h-max" id="secure-uploader-container">
            <h3 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5 pb-2.5 border-b border-slate-200 uppercase tracking-wider">
              <Upload className="h-4 w-4 text-emerald-600" />
              <span>Verify File Registry</span>
            </h3>

            {reportSuccess && (
              <div className="bg-emerald-50 text-emerald-800 p-3 rounded-md my-3 text-[10.5px] font-bold border border-emerald-200 flex items-center space-x-1.5 uppercase tracking-wide">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Record indexed securely!</span>
              </div>
            )}

            <form onSubmit={reportSuccess ? undefined : handleReportSubmit} className="mt-3.5 space-y-3.5">
              {/* Diagnostic Category */}
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                  Metadata Category
                </label>
                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 text-xs font-medium focus:bg-white focus:ring-1 focus:ring-emerald-500/10 focus:border-emerald-600 transition-colors outline-hidden cursor-pointer"
                >
                  <option value="Laboratory Results">Laboratory Results</option>
                  <option value="Cardio Diagnostics & ECG">Cardio Diagnostics & ECG</option>
                  <option value="Radiology & X-Ray Panels">Radiology & X-Ray Panels</option>
                  <option value="Prescription Summaries">Prescription Summaries</option>
                  <option value="Discharge summaries">Discharge summaries</option>
                </select>
              </div>

              {/* Title / Name */}
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                  Descriptive Label Name
                </label>
                <input
                  id="report-label-input"
                  type="text"
                  placeholder="e.g. Complete Blood Count Test"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-805 text-xs font-medium focus:bg-white focus:ring-1 focus:ring-emerald-500/10 focus:border-emerald-600 transition-colors outline-hidden"
                  required
                />
              </div>

              {/* Diagnostic Notes */}
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                  Clinical Summary Notes
                </label>
                <textarea
                  id="report-notes-input"
                  placeholder="e.g. Normal cholesterol levels..."
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-805 text-xs font-medium focus:bg-white focus:ring-1 focus:ring-emerald-500/10 focus:border-emerald-600 transition-colors outline-hidden resize-none"
                />
              </div>

              {/* Real upload trigger */}
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center space-x-1">
                  <Tag className="h-3 w-3 text-emerald-500" />
                  <span>Interactive Attachment</span>
                </label>
                
                {reportFile ? (
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 truncate pr-2">
                      <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div className="truncate">
                        <p className="font-semibold text-slate-700 truncate max-w-[120px]">{reportFile.name}</p>
                        <p className="text-[10px] text-slate-400">{reportFile.size}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReportFile(null)}
                      className="text-red-500 font-bold hover:bg-white p-1 rounded-full transition-colors cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="relative flex flex-col items-center justify-center border border-dashed border-slate-250 hover:border-emerald-600 rounded-lg py-4 px-3 hover:bg-slate-50 transition-colors cursor-pointer text-center group">
                    <Upload className="h-5 w-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                    <span className="text-[11px] font-bold text-slate-600 mt-1">Select Diagnostic File</span>
                    <span className="text-[9px] text-slate-450 mt-0.5">PDF or Clinical image logs up to 20MB</span>
                    <input
                      id="report-file-uploader"
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg"
                      onChange={handleFakeFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Submit Button */}
              <button
                id="submit-record-btn"
                type="submit"
                disabled={uploadLoading || !reportFile || !reportTitle}
                className="w-full flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-205 text-white font-bold py-2.5 px-3 rounded-md text-[10.5px] uppercase tracking-wider transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {uploadLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Indexing Clinical Record...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Index Sealed Document</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Appointment Booking Modal */}
      {bookingOpen && (
        <BookingModal
          user={user}
          onClose={() => setBookingOpen(false)}
          onSuccess={() => {
            setBookingOpen(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
