import { initializeApp } from "firebase/app";
import { getFirestore, collectionGroup, query, limit, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDpWBWFpS7NWvkAGR2FZlrH901qVwB0Iww",
  authDomain: "arb-soq.firebaseapp.com",
  projectId: "arb-soq",
  storageBucket: "arb-soq.firebasestorage.app",
  messagingSenderId: "264703833176",
  appId: "1:264703833176:web:a66bad059758a42fc3862d",
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

async function run() {
  const q = query(collectionGroup(firestore, 'ads'), limit(20));
  const snapshot = await getDocs(q);
  
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.adType === 'video' || data.adType === 'فيديو' || data.videoUrl) {
      console.log('ID:', doc.id);
      console.log('videoUrl:', data.videoUrl);
      console.log('adType:', data.adType);
      console.log('---');
    }
  });
}

run().catch(console.error);
