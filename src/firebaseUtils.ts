import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  addDoc, 
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
        createdAt: new Date().toISOString() // We can also use serverTimestamp but client-read requires instant state
      };
      
      await setDoc(userRef, {
        ...newUser,
        createdAt: serverTimestamp()
      });
      return newUser;
    }
  } catch (error) {
    return handleFirestoreError(error, OperationType.WRITE, path);
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
    return handleFirestoreError(error, OperationType.GET, path);
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
    return list;
  } catch (error) {
    return handleFirestoreError(error, OperationType.GET, path);
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
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function modifyDoctor(id: string, updates: Partial<Doctor>): Promise<void> {
  const path = `doctors/${id}`;
  try {
    const docRef = doc(db, 'doctors', id);
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function removeDoctor(id: string): Promise<void> {
  const path = `doctors/${id}`;
  try {
    const docRef = doc(db, 'doctors', id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
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
    handleFirestoreError(error, OperationType.CREATE, path);
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
    // Sort client side as composite indexes may not be built
    return list.sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    return handleFirestoreError(error, OperationType.GET, path);
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
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteAppointmentRecord(id: string): Promise<void> {
  const path = `appointments/${id}`;
  try {
    const docRef = doc(db, 'appointments', id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
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
    handleFirestoreError(error, OperationType.CREATE, path);
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
    return handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function deleteReportRecord(id: string): Promise<void> {
  const path = `reports/${id}`;
  try {
    const docRef = doc(db, 'reports', id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
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
    return handleFirestoreError(error, OperationType.GET, path);
  }
}
