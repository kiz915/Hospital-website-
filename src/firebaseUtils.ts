import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db, auth, BOOTSTRAPPED_ADMIN_EMAIL } from './firebase';
import { Doctor, Appointment, Report, AppUser, AuditLog } from './types';
import { SEED_DOCTORS } from './data';

// Helper to check if we have a real active online Firebase Auth session
function isOnlineWithAuth(): boolean {
  return !!auth.currentUser && !auth.currentUser.uid.startsWith('demo-');
}

// Helper to check if offline LocalStorage caching is present
function hasOfflineStorage(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch (e) {
    return false;
  }
}

// 1. Seed Doctors if database is empty (Online only)
export async function seedDoctorsIfEmpty() {
  const path = 'doctors';
  if (!isOnlineWithAuth()) {
    // Populate fallback offline cache with default seed list if uninitialized
    if (hasOfflineStorage()) {
      const localData = localStorage.getItem('local_doctors');
      if (!localData) {
        localStorage.setItem('local_doctors', JSON.stringify(SEED_DOCTORS.map(d => ({ ...d, createdAt: new Date().toISOString() }))));
      }
    }
    return;
  }

  try {
    const q = query(collection(db, path));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.log('Seeding doctors collection to Firestore...');
      const batch = writeBatch(db);
      for (const d of SEED_DOCTORS) {
        const dDoc = doc(collection(db, path), d.id);
        batch.set(dDoc, {
          ...d,
          createdAt: serverTimestamp()
        });
      }
      await batch.commit();
      console.log('Firestore doctor seeding complete.');
    }
  } catch (error) {
    console.error('Error during Firestore doctor seeding:', error);
  }
}

// 2. User Profiles
export async function ensureUserProfile(uid: string, name: string, email: string): Promise<AppUser> {
  const isDemo = uid.startsWith('demo-');
  if (!isOnlineWithAuth() || isDemo) {
    if (hasOfflineStorage()) {
      const localUsers = JSON.parse(localStorage.getItem('local_users') || '{}');
      if (localUsers[uid]) {
        return localUsers[uid];
      }
      const isSystemAdmin = email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
      const role = isSystemAdmin ? 'admin' : 'patient';
      const newUser: AppUser = {
        uid,
        name: name || 'Guest User',
        email,
        role: role as 'patient' | 'admin',
        createdAt: new Date().toISOString()
      };
      localUsers[uid] = newUser;
      localStorage.setItem('local_users', JSON.stringify(localUsers));
      return newUser;
    }
    return {
      uid,
      name: name || 'Guest User',
      email,
      role: email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase() ? 'admin' : 'patient',
      createdAt: new Date().toISOString()
    };
  }

  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as AppUser;
    } else {
      const isSystemAdmin = email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
      const role = isSystemAdmin ? 'admin' : 'patient';
      
      const newUser: AppUser = {
        uid,
        name: name || 'Google User',
        email,
        role: role as 'patient' | 'admin',
        createdAt: new Date().toISOString()
      };
      
      await setDoc(userRef, {
        ...newUser,
        createdAt: serverTimestamp()
      });
      return newUser;
    }
  } catch (error) {
    console.warn(`Firestore profile save failed for ${uid}, fallback to LocalStorage storage:`, error);
    if (hasOfflineStorage()) {
      const localUsers = JSON.parse(localStorage.getItem('local_users') || '{}');
      if (localUsers[uid]) {
        return localUsers[uid];
      }
      const isSystemAdmin = email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
      const role = isSystemAdmin ? 'admin' : 'patient';
      const newUser: AppUser = {
        uid,
        name: name || 'Guest User',
        email,
        role: role as 'patient' | 'admin',
        createdAt: new Date().toISOString()
      };
      localUsers[uid] = newUser;
      localStorage.setItem('local_users', JSON.stringify(localUsers));
      return newUser;
    }
    return {
      uid,
      name: name || 'Guest User',
      email,
      role: email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase() ? 'admin' : 'patient',
      createdAt: new Date().toISOString()
    };
  }
}

export async function fetchUserProfile(uid: string): Promise<AppUser | null> {
  const isDemo = uid.startsWith('demo-');
  if (!isOnlineWithAuth() || isDemo) {
    if (hasOfflineStorage()) {
      const localUsers = JSON.parse(localStorage.getItem('local_users') || '{}');
      return localUsers[uid] || null;
    }
    return null;
  }

  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data() as AppUser;
    }
    return null;
  } catch (error) {
    console.warn(`Firestore retrieve failed, fetching user ${uid} from cache:`, error);
    if (hasOfflineStorage()) {
      const localUsers = JSON.parse(localStorage.getItem('local_users') || '{}');
      return localUsers[uid] || null;
    }
    return null;
  }
}

// 3. Doctors Management (Admin & Patient)
export async function fetchDoctors(statusFilter?: 'active' | 'all'): Promise<Doctor[]> {
  const path = 'doctors';
  if (!isOnlineWithAuth()) {
    let list: Doctor[] = [];
    if (hasOfflineStorage()) {
      const localData = localStorage.getItem('local_doctors');
      if (localData) {
        list = JSON.parse(localData);
      } else {
        list = SEED_DOCTORS.map(d => ({ ...d, createdAt: new Date().toISOString() })) as Doctor[];
        localStorage.setItem('local_doctors', JSON.stringify(list));
      }
    } else {
      list = SEED_DOCTORS.map(d => ({ ...d, createdAt: new Date().toISOString() })) as Doctor[];
    }
    
    if (statusFilter === 'active') {
      return list.filter(d => d.status === 'active');
    }
    return list;
  }

  try {
    let q = query(collection(db, path));
    if (statusFilter === 'active') {
      q = query(collection(db, path), where('status', '==', 'active'));
    }
    const snap = await getDocs(q);
    const list: Doctor[] = [];
    snap.forEach(docSnap => {
      list.push({ ...docSnap.data(), id: docSnap.id } as Doctor);
    });
    
    if (list.length > 0 && hasOfflineStorage()) {
      // Synchronize back to offline storage
      localStorage.setItem('local_doctors', JSON.stringify(list));
    }
    return list;
  } catch (error) {
    console.warn(`Firestore read doctors failed, recovering from offline storage:`, error);
    let list: Doctor[] = [];
    if (hasOfflineStorage()) {
      const localData = localStorage.getItem('local_doctors');
      if (localData) {
        list = JSON.parse(localData);
      } else {
        list = SEED_DOCTORS.map(d => ({ ...d, createdAt: new Date().toISOString() })) as Doctor[];
        localStorage.setItem('local_doctors', JSON.stringify(list));
      }
    } else {
      list = SEED_DOCTORS.map(d => ({ ...d, createdAt: new Date().toISOString() })) as Doctor[];
    }
    
    if (statusFilter === 'active') {
      return list.filter(d => d.status === 'active');
    }
    return list;
  }
}

export async function addDoctor(doctor: Omit<Doctor, 'id' | 'createdAt'>): Promise<string> {
  const path = 'doctors';
  if (!isOnlineWithAuth()) {
    const fallbackId = `doc-${Date.now()}`;
    if (hasOfflineStorage()) {
      const localData = localStorage.getItem('local_doctors');
      const list: Doctor[] = localData ? JSON.parse(localData) : [];
      const newDoctor: Doctor = {
        ...doctor,
        id: fallbackId,
        createdAt: new Date().toISOString()
      };
      list.push(newDoctor);
      localStorage.setItem('local_doctors', JSON.stringify(list));
    }
    return fallbackId;
  }

  try {
    const newDocRef = doc(collection(db, path));
    const payload = {
      ...doctor,
      id: newDocRef.id,
      createdAt: serverTimestamp()
    };
    await setDoc(newDocRef, payload);
    
    // Sync offline cache after success
    if (hasOfflineStorage()) {
      const localData = localStorage.getItem('local_doctors');
      const list: Doctor[] = localData ? JSON.parse(localData) : SEED_DOCTORS.map(d => ({ ...d, createdAt: new Date().toISOString() }));
      list.push({
        ...payload,
        createdAt: new Date().toISOString()
      } as Doctor);
      localStorage.setItem('local_doctors', JSON.stringify(list));
    }
    return newDocRef.id;
  } catch (error) {
    console.warn('Firestore failed to add doctor online, saving to local offline fallback:', error);
    const fallbackId = `doc-${Date.now()}`;
    if (hasOfflineStorage()) {
      const localData = localStorage.getItem('local_doctors');
      const list: Doctor[] = localData ? JSON.parse(localData) : [];
      const newDoctor: Doctor = {
        ...doctor,
        id: fallbackId,
        createdAt: new Date().toISOString()
      };
      list.push(newDoctor);
      localStorage.setItem('local_doctors', JSON.stringify(list));
    }
    return fallbackId;
  }
}

export async function modifyDoctor(id: string, updates: Partial<Doctor>): Promise<void> {
  const path = `doctors/${id}`;
  if (!isOnlineWithAuth()) {
    if (hasOfflineStorage()) {
      const localData = localStorage.getItem('local_doctors');
      if (localData) {
        let list: Doctor[] = JSON.parse(localData);
        list = list.map(d => d.id === id ? { ...d, ...updates } : d);
        localStorage.setItem('local_doctors', JSON.stringify(list));
      }
    }
    return;
  }

  try {
    const docRef = doc(db, 'doctors', id);
    await updateDoc(docRef, updates);

    // Sync offline cache after success
    if (hasOfflineStorage()) {
      const localData = localStorage.getItem('local_doctors');
      if (localData) {
        let list: Doctor[] = JSON.parse(localData);
        list = list.map(d => d.id === id ? { ...d, ...updates } : d);
        localStorage.setItem('local_doctors', JSON.stringify(list));
      }
    }
  } catch (error) {
    console.warn('Firestore failed to update doctor online, saving to local offline fallback:', error);
    if (hasOfflineStorage()) {
      const localData = localStorage.getItem('local_doctors');
      if (localData) {
        let list: Doctor[] = JSON.parse(localData);
        list = list.map(d => d.id === id ? { ...d, ...updates } : d);
        localStorage.setItem('local_doctors', JSON.stringify(list));
      }
    }
  }
}

export async function removeDoctor(id: string): Promise<void> {
  const path = `doctors/${id}`;
  if (!isOnlineWithAuth()) {
    if (hasOfflineStorage()) {
      const localData = localStorage.getItem('local_doctors');
      if (localData) {
        let list: Doctor[] = JSON.parse(localData);
        list = list.filter(d => d.id !== id);
        localStorage.setItem('local_doctors', JSON.stringify(list));
      }
    }
    return;
  }

  try {
    const docRef = doc(db, 'doctors', id);
    await deleteDoc(docRef);

    // Sync offline cache after success
    if (hasOfflineStorage()) {
      const localData = localStorage.getItem('local_doctors');
      if (localData) {
        let list: Doctor[] = JSON.parse(localData);
        list = list.filter(d => d.id !== id);
        localStorage.setItem('local_doctors', JSON.stringify(list));
      }
    }
  } catch (error) {
    console.warn('Firestore failed to delete doctor online, saving to local offline fallback:', error);
    if (hasOfflineStorage()) {
      const localData = localStorage.getItem('local_doctors');
      if (localData) {
        let list: Doctor[] = JSON.parse(localData);
        list = list.filter(d => d.id !== id);
        localStorage.setItem('local_doctors', JSON.stringify(list));
      }
    }
  }
}

// 4. Appointments Booking and Roster Checking
export async function bookAppointment(appointment: Omit<Appointment, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const path = 'appointments';
  if (!isOnlineWithAuth()) {
    const newId = `appt-${Date.now()}`;
    if (hasOfflineStorage()) {
      const localData = localStorage.getItem('local_appointments');
      const list: Appointment[] = localData ? JSON.parse(localData) : [];
      const newAppt: Appointment = {
        ...appointment,
        id: newId,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      list.push(newAppt);
      localStorage.setItem('local_appointments', JSON.stringify(list));
    }
    return newId;
  }

  try {
    const newRef = doc(collection(db, path));
    const payload = {
      ...appointment,
      id: newRef.id,
      status: 'pending' as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(newRef, payload);

    // Save locally
    if (hasOfflineStorage()) {
      const localData = localStorage.getItem('local_appointments');
      const list: Appointment[] = localData ? JSON.parse(localData) : [];
      list.push({
        ...payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as Appointment);
      localStorage.setItem('local_appointments', JSON.stringify(list));
    }
    return newRef.id;
  } catch (error) {
    console.warn('Firestore failed to book appointment online, saving to local offline fallback:', error);
    const newId = `appt-${Date.now()}`;
    if (hasOfflineStorage()) {
      const localData = localStorage.getItem('local_appointments');
      const list: Appointment[] = localData ? JSON.parse(localData) : [];
      const newAppt: Appointment = {
        ...appointment,
        id: newId,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      list.push(newAppt);
      localStorage.setItem('local_appointments', JSON.stringify(list));
    }
    return newId;
  }
}

export async function fetchAppointments(patientId?: string): Promise<Appointment[]> {
  const path = 'appointments';
  if (!isOnlineWithAuth()) {
    if (hasOfflineStorage()) {
      const localData = localStorage.getItem('local_appointments');
      let list: Appointment[] = localData ? JSON.parse(localData) : [];
      if (patientId) {
        list = list.filter(a => a.patientId === patientId);
      }
      return list.sort((a, b) => b.date.localeCompare(a.date));
    }
    return [];
  }

  try {
    let q = query(collection(db, path));
    if (patientId) {
      q = query(collection(db, path), where('patientId', '==', patientId));
    }
    const snap = await getDocs(q);
    const list: Appointment[] = [];
    snap.forEach(dSnapshot => {
      const data = dSnapshot.data();
      list.push({ 
        ...data, 
        id: dSnapshot.id 
      } as Appointment);
    });

    if (list.length > 0 && hasOfflineStorage()) {
      // Sync local cache
      const localData = localStorage.getItem('local_appointments');
      let localList: Appointment[] = localData ? JSON.parse(localData) : [];
      
      // Update or merge fetched elements to local cache
      for (const fetched of list) {
        if (!localList.some(a => a.id === fetched.id)) {
          localList.push(fetched);
        } else {
          localList = localList.map(a => a.id === fetched.id ? fetched : a);
        }
      }
      localStorage.setItem('local_appointments', JSON.stringify(localList));
    }

    return list.sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    console.warn('Firestore failed to fetch appointments online, pulling from offline storage:', error);
    if (hasOfflineStorage()) {
      const localData = localStorage.getItem('local_appointments');
      let list: Appointment[] = localData ? JSON.parse(localData) : [];
      if (patientId) {
        list = list.filter(a => a.patientId === patientId);
      }
      return list.sort((a, b) => b.date.localeCompare(a.date));
    }
    return [];
  }
}

export async function updateAppointmentStatus(
  id: string, 
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled',
  isPatientAction: boolean = false
): Promise<void> {
  const path = `appointments/${id}`;
  if (!isOnlineWithAuth()) {
    if (hasOfflineStorage()) {
      const localData = localStorage.getItem('local_appointments');
      if (localData) {
        let list: Appointment[] = JSON.parse(localData);
        list = list.map(a => a.id === id ? { ...a, status, updatedAt: new Date().toISOString() } : a);
        localStorage.setItem('local_appointments', JSON.stringify(list));
      }
    }
    return;
  }

  try {
    const docRef = doc(db, 'appointments', id);
    const updates: any = {
      status,
      updatedAt: serverTimestamp()
    };
    await updateDoc(docRef, updates);

    // Update locally
    if (hasOfflineStorage()) {
      const localData = localStorage.getItem('local_appointments');
      if (localData) {
        let list: Appointment[] = JSON.parse(localData);
        list = list.map(a => a.id === id ? { ...a, status, updatedAt: new Date().toISOString() } : a);
        localStorage.setItem('local_appointments', JSON.stringify(list));
      }
    }
  } catch (error) {
    console.warn('Firestore failed to alter appointment status online, saving to local offline fallback:', error);
    if (hasOfflineStorage()) {
      const localData = localStorage.getItem('local_appointments');
      if (localData) {
        let list: Appointment[] = JSON.parse(localData);
        list = list.map(a => a.id === id ? { ...a, status, updatedAt: new Date().toISOString() } : a);
        localStorage.setItem('local_appointments', JSON.stringify(list));
      }
    }
  }
}

export async function deleteAppointmentRecord(id: string): Promise<void> {
  const path = `appointments/${id}`;
  if (!isOnlineWithAuth()) {
    if (hasOfflineStorage()) {
      const localData = localStorage.getItem('local_appointments');
      if (localData) {
        let list: Appointment[] = JSON.parse(localData);
        list = list.filter(a => a.id !== id);
        localStorage.setItem('local_appointments', JSON.stringify(list));
      }
    }
    return;
  }

  try {
    const docRef = doc(db, 'appointments', id);
    await deleteDoc(docRef);

    // Delete locally
    if (hasOfflineStorage()) {
      const localData = localStorage.getItem('local_appointments');
      if (localData) {
        let list: Appointment[] = JSON.parse(localData);
        list = list.filter(a => a.id !== id);
        localStorage.setItem('local_appointments', JSON.stringify(list));
      }
    }
  } catch (error) {
    console.warn('Firestore failed to delete appointment online, deleting from local offline fallback:', error);
    if (hasOfflineStorage()) {
      const localData = localStorage.getItem('local_appointments');
      if (localData) {
        let list: Appointment[] = JSON.parse(localData);
        list = list.filter(a => a.id !== id);
        localStorage.setItem('local_appointments', JSON.stringify(list));
      }
    }
  }
}

// 5. Medical Reports
export async function uploadMedicalReport(report: Omit<Report, 'id' | 'uploadedAt'>): Promise<string> {
  const path = 'reports';
  if (!isOnlineWithAuth()) {
    const newId = `rep-${Date.now()}`;
    if (hasOfflineStorage()) {
      const localData = localStorage.getItem('local_reports');
      const list: Report[] = localData ? JSON.parse(localData) : [];
      const newReport: Report = {
        ...report,
        id: newId,
        uploadedAt: new Date().toISOString() as any
      };
      list.push(newReport);
      localStorage.setItem('local_reports', JSON.stringify(list));
    }
    return newId;
  }

  try {
    const newRef = doc(collection(db, path));
    const payload = {
      ...report,
      id: newRef.id,
      uploadedAt: serverTimestamp()
    };
    await setDoc(newRef, payload);

    // Save locally
    if (hasOfflineStorage()) {
      const localData = localStorage.getItem('local_reports');
      const list: Report[] = localData ? JSON.parse(localData) : [];
      list.push({
        ...payload,
        uploadedAt: new Date().toISOString() as any
      });
      localStorage.setItem('local_reports', JSON.stringify(list));
    }
    return newRef.id;
  } catch (error) {
    console.warn('Firestore failed to upload medical report online, saving offline locally:', error);
    const newId = `rep-${Date.now()}`;
    if (hasOfflineStorage()) {
      const localData = localStorage.getItem('local_reports');
      const list: Report[] = localData ? JSON.parse(localData) : [];
      const newReport: Report = {
        ...report,
        id: newId,
        uploadedAt: new Date().toISOString() as any
      };
      list.push(newReport);
      localStorage.setItem('local_reports', JSON.stringify(list));
    }
    return newId;
  }
}

export async function fetchReports(patientId?: string): Promise<Report[]> {
  const path = 'reports';
  if (!isOnlineWithAuth()) {
    if (hasOfflineStorage()) {
      const localData = localStorage.getItem('local_reports');
      let list: Report[] = localData ? JSON.parse(localData) : [];
      if (patientId) {
        list = list.filter(r => r.patientId === patientId);
      }
      return list;
    }
    return [];
  }

  try {
    let q = query(collection(db, path));
    if (patientId) {
      q = query(collection(db, path), where('patientId', '==', patientId));
    }
    const snap = await getDocs(q);
    const list: Report[] = [];
    snap.forEach(dSnapshot => {
      list.push({ ...dSnapshot.data(), id: dSnapshot.id } as Report);
    });

    if (list.length > 0 && hasOfflineStorage()) {
      localStorage.setItem('local_reports', JSON.stringify(list));
    }
    return list;
  } catch (error) {
    console.warn('Firestore failed to fetch patient medical reports, recovering from local cache:', error);
    if (hasOfflineStorage()) {
      const localData = localStorage.getItem('local_reports');
      let list: Report[] = localData ? JSON.parse(localData) : [];
      if (patientId) {
        list = list.filter(r => r.patientId === patientId);
      }
      return list;
    }
    return [];
  }
}

export async function deleteReportRecord(id: string): Promise<void> {
  const path = `reports/${id}`;
  if (!isOnlineWithAuth()) {
    if (hasOfflineStorage()) {
      const localData = localStorage.getItem('local_reports');
      if (localData) {
        let list: Report[] = JSON.parse(localData);
        list = list.filter(r => r.id !== id);
        localStorage.setItem('local_reports', JSON.stringify(list));
      }
    }
    return;
  }

  try {
    const docRef = doc(db, 'reports', id);
    await deleteDoc(docRef);

    // Delete locally
    if (hasOfflineStorage()) {
      const localData = localStorage.getItem('local_reports');
      if (localData) {
        let list: Report[] = JSON.parse(localData);
        list = list.filter(r => r.id !== id);
        localStorage.setItem('local_reports', JSON.stringify(list));
      }
    }
  } catch (error) {
    console.warn('Firestore failed to delete physical report index online, deleting locally:', error);
    if (hasOfflineStorage()) {
      const localData = localStorage.getItem('local_reports');
      if (localData) {
        let list: Report[] = JSON.parse(localData);
        list = list.filter(r => r.id !== id);
        localStorage.setItem('local_reports', JSON.stringify(list));
      }
    }
  }
}

// 6. Patient List (Admin only)
export async function fetchPatientsList(): Promise<AppUser[]> {
  const path = 'users';
  if (!isOnlineWithAuth()) {
    if (hasOfflineStorage()) {
      const localUsers = JSON.parse(localStorage.getItem('local_users') || '{}');
      const list: AppUser[] = Object.values(localUsers);
      return list.filter(u => u.role === 'patient');
    }
    return [];
  }

  try {
    const q = query(collection(db, path), where('role', '==', 'patient'));
    const snap = await getDocs(q);
    const list: AppUser[] = [];
    snap.forEach(dSnapshot => {
      list.push({ ...dSnapshot.data(), uid: dSnapshot.id } as AppUser);
    });
    return list;
  } catch (error) {
    console.warn('Firestore failed to fetch patient directory listing online, pulling locally:', error);
    if (hasOfflineStorage()) {
      const localUsers = JSON.parse(localStorage.getItem('local_users') || '{}');
      const list: AppUser[] = Object.values(localUsers);
      return list.filter(u => u.role === 'patient');
    }
    return [];
  }
}

// 7. Audit Logging (Admin only)
export async function writeAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
  const path = 'audit_logs';
  const newId = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const timestampOffline = new Date().toISOString();

  if (!isOnlineWithAuth()) {
    if (hasOfflineStorage()) {
      const localLogs = localStorage.getItem('local_audit_logs');
      const list: AuditLog[] = localLogs ? JSON.parse(localLogs) : [];
      list.push({
        ...log,
        id: newId,
        timestamp: timestampOffline
      });
      localStorage.setItem('local_audit_logs', JSON.stringify(list));
    }
    return;
  }

  try {
    const logDocRef = doc(db, path, newId);
    await setDoc(logDocRef, {
      ...log,
      id: newId,
      timestamp: serverTimestamp()
    });

    if (hasOfflineStorage()) {
      const localLogs = localStorage.getItem('local_audit_logs');
      const list: AuditLog[] = localLogs ? JSON.parse(localLogs) : [];
      list.push({
        ...log,
        id: newId,
        timestamp: timestampOffline
      });
      localStorage.setItem('local_audit_logs', JSON.stringify(list));
    }
  } catch (err) {
    console.error('Failed to write audit log to Firestore:', err);
    if (hasOfflineStorage()) {
      const localLogs = localStorage.getItem('local_audit_logs');
      const list: AuditLog[] = localLogs ? JSON.parse(localLogs) : [];
      list.push({
        ...log,
        id: newId,
        timestamp: timestampOffline
      });
      localStorage.setItem('local_audit_logs', JSON.stringify(list));
    }
  }
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  const path = 'audit_logs';
  if (!isOnlineWithAuth()) {
    if (hasOfflineStorage()) {
      const localLogs = localStorage.getItem('local_audit_logs');
      return localLogs ? JSON.parse(localLogs) : [];
    }
    return [];
  }

  try {
    const q = query(collection(db, path));
    const snap = await getDocs(q);
    const list: AuditLog[] = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      let ts = data.timestamp;
      if (ts && typeof ts.toDate === 'function') {
        ts = ts.toDate().toISOString();
      } else if (ts && ts.seconds) {
        ts = new Date(ts.seconds * 1000).toISOString();
      }
      list.push({
        ...data,
        timestamp: ts || new Date().toISOString()
      } as AuditLog);
    });

    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (hasOfflineStorage()) {
      localStorage.setItem('local_audit_logs', JSON.stringify(list));
    }
    return list;
  } catch (error) {
    console.error('Failed to fetch audit logs, pulling from offline storage:', error);
    if (hasOfflineStorage()) {
      const localLogs = localStorage.getItem('local_audit_logs');
      return localLogs ? JSON.parse(localLogs) : [];
    }
    return [];
  }
}
