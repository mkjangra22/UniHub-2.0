import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Saves specific user data (e.g. profile, timetable, notes, etc.) to the user's document and subcollections in Firestore.
 */
export const saveUserDataToFirestore = async (uid: string, key: string, data: any): Promise<void> => {
  if (!db) {
    console.warn("Firestore instance is not initialized. Using local storage mode.");
    return;
  }
  try {
    const docKey = key.replace('unihub_', ''); // e.g. 'files', 'profile', 'notes', 'subjects'
    
    // 1. Save main document in 'users' collection with merge
    const userDocRef = doc(db, "users", uid);
    await setDoc(userDocRef, { [docKey]: data }, { merge: true });

    // 2. Automatically create subcollections & individual records under users/{uid}/{docKey}
    if (Array.isArray(data)) {
      for (const item of data) {
        if (item) {
          const itemId = item.id ? String(item.id) : String(Date.now());
          const itemRef = doc(db, "users", uid, docKey, itemId);
          await setDoc(itemRef, item, { merge: true });
        }
      }
    } else if (data && typeof data === 'object') {
      const subDocRef = doc(db, "users", uid, docKey, "info");
      await setDoc(subDocRef, data, { merge: true });
    }

    console.log(`[Firestore] Successfully saved '${docKey}' records & subcollection for user ${uid}`);
  } catch (e: any) {
    console.error(`[Firestore Error] Failed to save '${key}' for user ${uid}:`, e);
    if (e?.code === 'permission-denied') {
      console.error("-> Check your Firestore Security Rules in Firebase Console! Ensure authenticated users are allowed to read/write to 'users/{uid}'.");
    } else if (e?.code === 'not-found') {
      console.error("-> Check if Cloud Firestore database has been created in your Firebase Console.");
    }
  }
};

/**
 * Fetches all of the user's data (profile, timetable, notes, etc.) from their Firestore document and subcollections.
 */
export const fetchUserDataFromFirestore = async (uid: string): Promise<Record<string, any> | null> => {
  if (!db) return null;
  try {
    const userDocRef = doc(db, "users", uid);
    const docSnap = await getDoc(userDocRef);
    
    let resultData: Record<string, any> = {};
    if (docSnap.exists()) {
      resultData = { ...docSnap.data() };
    }

    // Attempt fetching from subcollections if any collection is empty
    const collectionsToFetch = ['profile', 'subjects', 'timetable', 'files', 'notes', 'reminders', 'exam_results'];
    for (const colName of collectionsToFetch) {
      if (!resultData[colName] || (Array.isArray(resultData[colName]) && resultData[colName].length === 0)) {
        try {
          const subColRef = collection(db, "users", uid, colName);
          const subSnap = await getDocs(subColRef);
          if (!subSnap.empty) {
            if (colName === 'profile') {
              const infoDoc = subSnap.docs.find(d => d.id === 'info') || subSnap.docs[0];
              if (infoDoc) resultData.profile = infoDoc.data();
            } else {
              resultData[colName] = subSnap.docs.map(d => d.data());
            }
          }
        } catch (e) {
          // ignore if subcollection doesn't exist
        }
      }
    }

    return Object.keys(resultData).length > 0 ? resultData : null;
  } catch (e: any) {
    console.error(`[Firestore Error] Failed to fetch user data for ${uid}:`, e);
    if (e?.code === 'permission-denied') {
      console.error("-> Permission Denied: Update Firestore Security Rules to allow read access for authenticated users.");
    }
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
  } catch (e: any) {
    console.error(`[Firestore Error] Failed to save community data '${key}':`, e);
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
  } catch (e: any) {
    console.error(`[Firestore Error] Failed to fetch community data '${key}':`, e);
  }
  return null;
};
