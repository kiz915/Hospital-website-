export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  department: string;
  bio: string;
  status: 'active' | 'inactive';
  photoUrl: string;
  availableDays: string[]; // e.g., ["Monday", "Tuesday", "Wednesday"]
  availableSlots: string[]; // e.g., ["09:00 AM", "10:30 AM", "02:00 PM"]
  createdAt: any;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM AM/PM
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Report {
  id: string;
  patientId: string;
  fileName: string;
  fileSize: string;
  category: string;
  notes?: string;
  content?: string; // base64 or clinical notes
  uploadedAt: any; // Firebase Timestamp
}

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: 'patient' | 'admin';
  createdAt: any;
}

export interface Department {
  id: string;
  name: string;
  icon: string; // name of lucide-react icon
  description: string;
  longDescription: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  action: string;
  details: string;
  targetId: string;
  targetName: string;
  timestamp: any;
}
