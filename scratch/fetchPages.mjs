import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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
  const snapshot = await getDocs(collection(firestore, 'pages'));
  console.log("=== Pages in Firestore ===");
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`Title: ${data.title}`);
    console.log(`Slug: ${data.slug}`);
    console.log(`Published: ${data.isPublished}`);
    console.log(`Content snippet: ${data.content ? data.content.substring(0, 250) : 'none'}`);
    console.log('---');
  });
}

run().catch(console.error);
