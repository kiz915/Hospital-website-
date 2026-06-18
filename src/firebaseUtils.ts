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
import { db, auth, BOOTSTRAPPED_ADMIN_EMAIL, handleFirestoreError, OperationType } from './firebase';
import { Doctor, Appointment, Report, AppUser } from './types';
import { SEED_DOCTORS } from './data';

// 1. Seed Doctors if database is empty
export async function seedDoctorsIfEmpty() {
  const path = 'doctors';
  try {
    const q = query(collection(db, path));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.log('Seeding doctors collection...');
      const batch = writeBatch(db);
      for (const d of SEED_DOCTORS) {
        const dDoc = doc(collection(db, path), d.id);
        batch.set(dDoc, {
          ...d,
          createdAt: serverTimestamp()
        });
      }
      await batch.commit();
      console.log('Seeding complete.');
    }
  } catch (error) {
    console.error('Error during doctor seeding:', error);
  }
}

// Helper to check if we are in fallback/local mode
function hasOfflineStorage(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch (e) {
    return false;
  }
}

// 2. User Profiles
export async function ensureUserProfile(uid: string, name: string, email: string): Promise<AppUser> {
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as AppUser;
    } else {
      // If email is bootstrapped admin email, make them admin!
      const isSystemAdmin = email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
      const role = isSystemAdmin ? 'admin' : 'patient';
      
      const newUser: AppUser = {
        uid,
        name: name || 'Guest User',
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
    console.warn(`Firestore failed on ensureUserProfile for ${uid}, utilizing LocalStorage fallback:`, error);
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
    // Fallback if no localstorage
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
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data() as AppUser;
    }
    return null;
  } catch (error) {
    console.warn(`Firestore failed on fetchUserProfile for ${uid}, utilizing LocalStorage fallback:`, error);
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
      localStorage.setItem('local_doctors', JSON.stringify(list));
    }
    return list;
  } catch (error) {
    console.warn(`Firestore failed to fetch doctors, loading from local repository:`, error);
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

export async function addDoctor(doctor: Omit<Doctor, 'id' | 'createdAt'>): Promise<void> {
  const path = 'doctors';
  try {
    const newDocRef = doc(collection(db, path));
    await setDoc(newDocRef, {
      ...doctor,
      id: newDocRef.id,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.warn('Firestore failed to add doctor, storing to LocalStorage fallback:', error);
    if (hasOfflineStorage()) {
      const localData = localStorage.getItem('local_doctors');
      const list: Doctor[] = localData ? JSON.parse(localData) : [];
      const newDoctor: Doctor = {
        ...doctor,
        id: `doc-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      list.push(newDoctor);
      localStorage.setItem('local_doctors', JSON.stringify(list));
    }
  }
}

export async function modifyDoctor(id: string, updates: Partial<Doctor>): Promise<void> {
  const path = `doctors/${id}`;
  try {
    const docRef = doc(db, 'doctors', id);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.warn('Firestore failed to update doctor, applying to LocalStorage fallback:', error);
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
  try {
    const docRef = doc(db, 'doctors', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Firestore failed to delete doctor, applying to LocalStorage fallback:', error);
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

// 4. Appointments booking and listing
export async function bookAppointment(appointment: Omit<Appointment, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const path = 'appointments';
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
    return newRef.id;
  } catch (error) {
    console.warn('Firestore failed to book appointment, using LocalStorage repository state:', error);
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
    return list.sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    console.warn('Firestore failed to fetch appointments, using LocalStorage fallback:', error);
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
  try {
    const docRef = doc(db, 'appointments', id);
    const updates: any = {
      status,
      updatedAt: serverTimestamp()
    };
    await updateDoc(docRef, updates);
  } catch (error) {
    console.warn('Firestore failed to update appointment status, using LocalStorage fallback:', error);
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
  try {
    const docRef = doc(db, 'appointments', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Firestore failed to delete appointment record, using LocalStorage fallback:', error);
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
  try {
    const newRef = doc(collection(db, path));
    const payload = {
      ...report,
      id: newRef.id,
      uploadedAt: serverTimestamp()
    };
    await setDoc(newRef, payload);
    return newRef.id;
  } catch (error) {
    console.warn('Firestore failed to upload medical report description, using LocalStorage fallback:', error);
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
    return list;
  } catch (error) {
    console.warn('Firestore failed to fetch patient medical reports, using LocalStorage fallback:', error);
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
  try {
    const docRef = doc(db, 'reports', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Firestore failed to delete physical report index, using LocalStorage fallback:', error);
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
  try {
    const q = query(collection(db, path), where('role', '==', 'patient'));
    const snap = await getDocs(q);
    const list: AppUser[] = [];
    snap.forEach(dSnapshot => {
      list.push({ ...dSnapshot.data(), uid: dSnapshot.id } as AppUser);
    });
    return list;
  } catch (error) {
    console.warn('Firestore failed to fetch patient directory listing, using LocalStorage fallback:', error);
    if (hasOfflineStorage()) {
      const localUsers = JSON.parse(localStorage.getItem('local_users') || '{}');
      const list: AppUser[] = Object.values(localUsers);
      return list.filter(u => u.role === 'patient');
    }
    return [];
  }
}
