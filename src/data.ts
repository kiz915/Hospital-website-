import { Department, Doctor } from './types';

export const DEPARTMENTS: Department[] = [
  {
    id: 'cardiology',
    name: 'Cardiology',
    icon: 'Heart',
    description: 'Expert diagnostics and treatment for modern cardiovascular wellness.',
    longDescription: 'Our Cardiology department provides comprehensive inpatient and outpatient services. Led by world-class cardiologists, we specialize in high-precision ECG diagnostics, preventative care, and coronary rehabilitation program setups.'
  },
  {
    id: 'neurology',
    name: 'Neurology',
    icon: 'Brain',
    description: 'Advanced neurological diagnostics for complex brain and nervous disorders.',
    longDescription: 'The Neurology department delivers specialized care for chronic headache management, neurodegenerative diseases, spinal injuries, and diagnostic brain imaging with state-of-the-art neurological testing facilities.'
  },
  {
    id: 'pediatrics',
    name: 'Pediatrics',
    icon: 'Baby',
    description: 'Dedicated compassionate healthcare for infants, kids, and adolescents.',
    longDescription: 'From infancy to puberty, our Pediatrics team delivers exceptional primary and preventative clinical care. We specialize in child development track indicators, routine vaccinations, and emergency outpatient counseling.'
  },
  {
    id: 'orthopedics',
    name: 'Orthopedics',
    icon: 'Activity',
    description: 'Comprehensive bone, joint, and musculoskeletal therapy treatments.',
    longDescription: 'Our Orthopedics department features specialists in orthopedic rehab, bone density management, spinal corrections, and athletic injury physical therapies to rebuild full range-of-motion metrics.'
  },
  {
    id: 'general-medicine',
    name: 'General Medicine',
    icon: 'Stethoscope',
    description: 'Comprehensive primary screening and general healthcare consultations.',
    longDescription: 'As the clinical gateway of the hospital, General Medicine offers universal medical evaluation, preventative screening, vaccine clinics, chronic condition mapping, and inter-departmental referrals.'
  },
  {
    id: 'dermatology',
    name: 'Dermatology',
    icon: 'Sparkles',
    description: 'Clinical skin therapy treatments, diagnostics and micro-restorations.',
    longDescription: 'We provide evidence-based therapeutics for chronic skin conditions, sun-damage screenings, advanced allergen testing, pediatric dermatology, and cosmetic restorative treatments.'
  }
];

export const SEED_DOCTORS: Omit<Doctor, 'createdAt'>[] = [
  {
    id: 'doc-sarah-jenkins',
    name: 'Dr. Sarah Jenkins',
    specialty: 'Senior Cardiologist',
    department: 'Cardiology',
    bio: 'Dr. Jenkins possesses over 14 years of clinical experience in non-invasive cardiac imaging and therapeutic coronary prevention programs. Formerly a lead researcher at the National Cardiovascular Center.',
    status: 'active',
    photoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    availableDays: ['Monday', 'Tuesday', 'Wednesday'],
    availableSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM']
  },
  {
    id: 'doc-robert-chen',
    name: 'Dr. Robert Chen',
    specialty: 'Consultant Neurosurgeon',
    department: 'Neurology',
    bio: 'Specializing in advanced cerebrovascular mechanics and comprehensive stroke rehabilitation management. Dr. Chen is committed to personalized, patient-centric neuro-restoration pathways.',
    status: 'active',
    photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
    availableDays: ['Tuesday', 'Thursday'],
    availableSlots: ['09:30 AM', '10:30 AM', '11:30 AM', '01:30 PM', '02:30 PM', '03:30 PM']
  },
  {
    id: 'doc-emily-taylor',
    name: 'Dr. Emily Taylor',
    specialty: 'Lead Pediatrician',
    department: 'Pediatrics',
    bio: 'Pioneering compassionate pediatric consultation frameworks. Dr. Taylor is dedicated to making every childs clinical visit joyful, safe, and stress-free while staying current with global pediatric indicators.',
    status: 'active',
    photoUrl: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300',
    availableDays: ['Monday', 'Wednesday', 'Friday'],
    availableSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM']
  },
  {
    id: 'doc-marcus-vance',
    name: 'Dr. Marcus Vance',
    specialty: 'Musculoskeletal Surgeon',
    department: 'Orthopedics',
    bio: 'Focused on therapeutic structural bone correction, joint replacement counseling, and high-performance sports medicine. Dr. Vance has worked with national olympic training camps.',
    status: 'active',
    photoUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300',
    availableDays: ['Wednesday', 'Thursday', 'Friday'],
    availableSlots: ['08:30 AM', '09:30 AM', '10:30 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM']
  },
  {
    id: 'doc-alisha-patel',
    name: 'Dr. Alisha Patel',
    specialty: 'Clinical Dermatologist',
    department: 'Dermatology',
    bio: 'Dr. Patel integrates progressive clinical therapies with aesthetic care. Specializes in advanced dermatology diagnostics, immunotherapy mappings, and chronic skin flare mitigation.',
    status: 'active',
    photoUrl: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=300',
    availableDays: ['Monday', 'Thursday'],
    availableSlots: ['10:00 AM', '11:30 AM', '02:00 PM', '03:30 PM', '04:30 PM']
  },
  {
    id: 'doc-james-wilson',
    name: 'Dr. James Wilson',
    specialty: 'Resident General Physician',
    department: 'General Medicine',
    bio: 'Dr. Wilson brings 18 years of general practitioners experience. Recognized for meticulous medical mapping, geriatric lifestyle plans, and general wellness optimization routines.',
    status: 'active',
    photoUrl: 'https://images.unsplash.com/photo-1618498082410-b4aa22193b38?auto=format&fit=crop&q=80&w=300',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    availableSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM']
  }
];
