import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCGjopfJHHOZtuy7X8SXBRSdT7I5Yeby_M",
  authDomain: "anurag-lms-production.firebaseapp.com",
  projectId: "anurag-lms-production",
  storageBucket: "anurag-lms-production.firebasestorage.app",
  messagingSenderId: "516772687118",
  appId: "1:516772687118:web:ff720c42ecabb4c939fb5f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLECTION_NAME = 'lms_data';

/**
 * Saves JSON data to a specific document (key) in your Firestore collection.
 * Using { merge: true } ensures we don't overwrite other people's data!
 */
export const saveToCloudflare = async (key: string, data: any) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, key);
    // Firestore setDoc doesn't accept top-level arrays or primitives/null or undefined values. Wrap/sanitize them.
    let payload = data === undefined ? null : JSON.parse(JSON.stringify(data));
    if (Array.isArray(payload)) {
      payload = { __isArray: true, data: payload };
    } else if (payload === null || typeof payload !== 'object') {
      payload = { __isPrimitive: true, value: payload };
    }
    await setDoc(docRef, payload, { merge: true });
    console.log(`Successfully saved ${key} to Firebase Firestore`);
  } catch (error) {
    console.error(`Error saving ${key} to Firebase:`, error);
  }
};

/**
 * Replaces (overwrites) JSON data for a key in Firestore without merging.
 * Useful when keys are deleted from an object.
 */
export const replaceInCloudflare = async (key: string, data: any) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, key);
    let payload = data === undefined ? null : JSON.parse(JSON.stringify(data));
    if (Array.isArray(payload)) {
      payload = { __isArray: true, data: payload };
    } else if (payload === null || typeof payload !== 'object') {
      payload = { __isPrimitive: true, value: payload };
    }
    await setDoc(docRef, payload);
    console.log(`Successfully replaced ${key} in Firebase Firestore`);
  } catch (error) {
    console.error(`Error replacing ${key} in Firebase:`, error);
  }
};

/**
 * Retrieves JSON data from a specific document (key) in your Firestore collection.
 */
export const getFromCloudflare = async (key: string): Promise<any> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, key);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const docData = docSnap.data();
      if (docData && docData.__isArray) {
        return docData.data;
      }
      if (docData && docData.__isPrimitive) {
        return docData.value;
      }
      return docData as any;
    } else {
      return null;
    }
  } catch (error: any) {
    console.error(`Error fetching ${key} from Firebase:`, error);
    return null;
  }
};

import { MUNI_STUDENTS } from '../data/students';

export const normalizeStudentEmail = (email?: string | null): string => {
  if (!email) return '';
  return email.toLowerCase().trim().replace(/^(\d{2})cg/i, '$1eg');
};

export const matchesStudentEmail = (email1?: string | null, email2?: string | null): boolean => {
  if (!email1 || !email2) return false;
  const e1 = email1.toLowerCase().trim();
  const e2 = email2.toLowerCase().trim();
  if (e1 === e2) return true;
  return normalizeStudentEmail(e1) === normalizeStudentEmail(e2);
};

export const isMuniUser = (emailToCheck?: string): boolean => {
  const userEmail = (emailToCheck || sessionStorage.getItem('loggedInEmail') || localStorage.getItem('loggedInEmail') || '').toLowerCase().trim();
  if (!userEmail) return false;
  if (userEmail === 'muni@geonixa.com' || userEmail === 'munichandrar572@gmail.com' || userEmail === 'raju@anurag.com') return true;
  if (MUNI_STUDENTS.some(s => matchesStudentEmail(s.email, userEmail))) return true;

  const localMuniStudents = JSON.parse(localStorage.getItem('registeredStudents_muni@geonixa.com') || '[]');
  if (Array.isArray(localMuniStudents) && localMuniStudents.some((s: any) => matchesStudentEmail(s?.email, userEmail))) return true;

  return false;
};

export const getStudentsKey = (emailToCheck?: string): string => {
  if (isMuniUser(emailToCheck)) {
    return 'registeredStudents_muni@geonixa.com';
  }
  return 'registeredStudents';
};

export const getMentorKey = (baseKey: string, emailToCheck?: string): string => {
  if (isMuniUser(emailToCheck)) {
    return `${baseKey}_muni@geonixa.com`;
  }
  return baseKey;
};

export const getMentorBatches = (emailToCheck?: string): string[] => {
  if (isMuniUser(emailToCheck)) {
    return ['A1', 'A2', 'B1', 'B2'];
  }
  return ['Morning', 'Evening'];
};

/**
 * Safely cleans bloated items from localStorage to prevent QuotaExceededError.
 * Preserves essential session keys like 'loggedInEmail'.
 */
export const cleanBloatedLocalStorage = () => {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key !== 'loggedInEmail') {
        try {
          const val = localStorage.getItem(key) || '';
          // Purge large entries (>20KB), base64 data, or graph exam file payloads
          if (
            val.length > 20000 ||
            val.includes('data:image') ||
            val.includes('data:application/pdf') ||
            val.includes('base64') ||
            key.startsWith('graphExamSub_') ||
            key === 'graphExamSubmissions_muni' ||
            key.startsWith('anuragLmsCourses_')
          ) {
            keysToRemove.push(key);
          }
        } catch (e) {}
      }
    }
    keysToRemove.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch (e) {}
    });
    if (keysToRemove.length > 0) {
      console.log(`Cleaned ${keysToRemove.length} bulky items from localStorage to restore quota.`);
    }
  } catch (err) {
    console.warn("Storage cleanup notice:", err);
  }
};

/**
 * Safely saves data to sessionStorage and localStorage without crashing if storage quota is exceeded.
 */
export const safeSetStorage = (key: string, value: string) => {
  try {
    sessionStorage.setItem(key, value);
  } catch (e) {
    console.warn(`sessionStorage failed for ${key}:`, e);
  }

  try {
    localStorage.setItem(key, value);
  } catch (err: any) {
    console.warn(`localStorage quota error for ${key}. Attempting cleanup...`, err);
    try {
      cleanBloatedLocalStorage();
      localStorage.setItem(key, value);
    } catch (retryErr) {
      // If still fails, clear all non-essential items
      try {
        const toDelete: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k !== 'loggedInEmail' && k !== key) toDelete.push(k);
        }
        toDelete.slice(0, 15).forEach(k => {
          try { localStorage.removeItem(k); } catch (e) {}
        });
        localStorage.setItem(key, value);
      } catch (finalErr) {
        console.warn(`Could not save ${key} to localStorage, active in sessionStorage.`, finalErr);
      }
    }
  }
};

/**
 * Safely gets data from sessionStorage or localStorage.
 */
export const safeGetStorage = (key: string): string => {
  try {
    const sessionVal = sessionStorage.getItem(key);
    if (sessionVal) return sessionVal;
  } catch (e) {}

  try {
    const localVal = localStorage.getItem(key);
    if (localVal) return localVal;
  } catch (e) {}

  return '';
};



