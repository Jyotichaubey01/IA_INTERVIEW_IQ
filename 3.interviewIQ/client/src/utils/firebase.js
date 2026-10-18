
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "interviewiq-a31d6.firebaseapp.com",
  projectId: "interviewiq-a31d6",
  storageBucket: "interviewiq-a31d6.firebasestorage.app",
  messagingSenderId: "904777590607",
  appId: "1:904777590607:web:774271745cdfc8ec7cc73a",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

export default app;
