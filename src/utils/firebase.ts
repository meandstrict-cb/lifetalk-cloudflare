import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, increment } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAFqkLqfH1R4xSmM5UuNO4iSRhwEKmpMTE",
  authDomain: "serene-joy-shh41.firebaseapp.com",
  projectId: "serene-joy-shh41",
  storageBucket: "serene-joy-shh41.firebasestorage.app",
  messagingSenderId: "604413632438",
  appId: "1:604413632438:web:5996285321643a75726b17"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID
export const db = getFirestore(app, "ai-studio-lifetalkenglishs-e5e6b010-1877-4a60-9367-6a9ec2531250");

/**
 * Records a user's choice in Firestore.
 * Increments the vote counter for the specified choice.
 */
export async function recordChoice(
  scenarioId: string,
  turnIndex: number,
  difficulty: string,
  choiceId: string
) {
  try {
    const docId = `${scenarioId}_node_${turnIndex}_${difficulty.toLowerCase()}`;
    const docRef = doc(db, "choice_stats", docId);
    
    await setDoc(
      docRef,
      {
        votes: {
          [choiceId]: increment(1)
        }
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error recording user choice:", error);
  }
}

/**
 * Fetches the choice stats for a specific scenario node.
 */
export async function getChoiceStats(
  scenarioId: string,
  turnIndex: number,
  difficulty: string
): Promise<Record<string, number> | null> {
  try {
    const docId = `${scenarioId}_node_${turnIndex}_${difficulty.toLowerCase()}`;
    const docRef = doc(db, "choice_stats", docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.votes || null;
    }
    return null;
  } catch (error) {
    console.error("Error fetching choice stats:", error);
    return null;
  }
}
