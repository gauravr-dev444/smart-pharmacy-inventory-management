import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCdiFPeA5sqIrBtRMZyN_hPUCdnKjIz7kw",
  authDomain: "smartpharmacysystem.firebaseapp.com",
  projectId: "smartpharmacysystem",
  storageBucket: "smartpharmacysystem.firebasestorage.app",
  messagingSenderId: "833262535638",
  appId: "1:833262535638:web:263d4d3ccc611d915e1a77",
  measurementId: "G-1YK5BYPL5C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth and Firestore
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export default app;
