import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCdBak7CRjSpCw0oDHlr8rCu8MOZoLK-40",
  authDomain: "to-do-list-b45f2.firebaseapp.com",
  projectId: "to-do-list-b45f2",
  storageBucket: "to-do-list-b45f2.firebasestorage.app",
  messagingSenderId: "212022445618",
  appId: "1:212022445618:web:2946e9502a8a494481de2b",
  measurementId: "G-3XE4JH49Y4"
};

// Initialize Firebase app only once
const FIREBASE_APP = initializeApp(firebaseConfig);
const FIREBASE_AUTH = getAuth(FIREBASE_APP);
const FIRESTORE_DB = getFirestore(FIREBASE_APP);

export { FIREBASE_APP, FIREBASE_AUTH, FIRESTORE_DB };
