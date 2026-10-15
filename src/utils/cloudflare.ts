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
    // Firestore setDoc doesn't accept top-level arrays or primitives/null. Wrap them.
    let payload = data;
    if (Array.isArray(data)) {
      payload = { __isArray: true, data: data };
    } else if (data === null || typeof data !== 'object') {
      payload = { __isPrimitive: true, value: data };
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
    let payload = data;
    if (Array.isArray(data)) {
      payload = { __isArray: true, data: data };
    } else if (data === null || typeof data !== 'object') {
      payload = { __isPrimitive: true, value: data };
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



