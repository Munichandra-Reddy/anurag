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
    // Firestore setDoc doesn't accept top-level arrays. Wrap them.
    const payload = Array.isArray(data) ? { __isArray: true, data: data } : data;
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
    const payload = Array.isArray(data) ? { __isArray: true, data: data } : data;
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

export const isMuniUser = (): boolean => {
  const userEmail = (sessionStorage.getItem('loggedInEmail') || '').toLowerCase().trim();
  if (!userEmail) return false;
  if (userEmail === 'muni@geonixa.com' || userEmail === 'raju@anurag.com') return true;
  if (MUNI_STUDENTS.some(s => (s.email || '').toLowerCase().trim() === userEmail)) return true;

  const localMuniStudents = JSON.parse(localStorage.getItem('registeredStudents_muni@geonixa.com') || '[]');
  if (Array.isArray(localMuniStudents) && localMuniStudents.some((s: any) => (s?.email || '').toLowerCase().trim() === userEmail)) return true;

  return false;
};

export const getStudentsKey = (): string => {
  if (isMuniUser()) {
    return 'registeredStudents_muni@geonixa.com';
  }
  return 'registeredStudents';
};

export const getMentorKey = (baseKey: string): string => {
  if (isMuniUser()) {
    return `${baseKey}_muni@geonixa.com`;
  }
  return baseKey;
};

export const getMentorBatches = (): string[] => {
  if (isMuniUser()) {
    return ['A1', 'A2', 'B1', 'B2'];
  }
  return ['Morning', 'Evening'];
};


