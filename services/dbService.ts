import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Saves specific user data (e.g. profile, timetable, notes, etc.) to the user's document in Firestore.
 */
export const saveUserDataToFirestore = async (uid: string, key: string, data: any): Promise<void> => {
  if (!db) return;
  try {
    const docKey = key.replace('unihub_', ''); // normalize key names
    const docRef = doc(db, "users", uid);
    await setDoc(docRef, { [docKey]: data }, { merge: true });
  } catch (e) {
    console.error(`Error saving user data ${key} to Firestore:`, e);
  }
};

/**
 * Fetches all of the user's data (profile, timetable, notes, etc.) from their Firestore document.
 */
export const fetchUserDataFromFirestore = async (uid: string): Promise<Record<string, any> | null> => {
  if (!db) return null;
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (e) {
    console.error("Error fetching user data from Firestore:", e);
  }
  return null;
};

/**
 * Saves shared community data (posts, groups, marketplace items, direct messages, users) to a specific document in global_community.
 */
export const saveCommunityData = async (key: string, data: any): Promise<void> => {
  if (!db) return;
  try {
    const docRef = doc(db, "global_community", key);
    await setDoc(docRef, { data });
  } catch (e) {
    console.error(`Error saving community data ${key} to Firestore:`, e);
  }
};

/**
 * Fetches shared community data from Firestore.
 */
export const fetchCommunityData = async (key: string): Promise<any | null> => {
  if (!db) return null;
  try {
    const docRef = doc(db, "global_community", key);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().data;
    }
  } catch (e) {
    console.error(`Error fetching community data ${key} from Firestore:`, e);
  }
  return null;
};
