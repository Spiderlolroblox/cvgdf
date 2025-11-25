import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD7KlxN05OoSCGHwjXhiiYyKF5bOXianLY",
  authDomain: "keysystem-d0b86-8df89.firebaseapp.com",
  projectId: "keysystem-d0b86-8df89",
  storageBucket: "keysystem-d0b86-8df89.firebasestorage.app",
  messagingSenderId: "1048409565735",
  appId: "1:1048409565735:web:5a9f5422826949490dfc02",
  measurementId: "G-GK1R043YTV"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

setPersistence(auth, browserLocalPersistence).catch(error => {
  console.error('Error setting persistence:', error);
});

export default app;
