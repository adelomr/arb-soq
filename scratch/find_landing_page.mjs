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
  console.log(`Found ${snapshot.size} pages:`);
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`- ID: ${doc.id}, Title: ${data.title}, Slug: ${data.slug}, PageType: ${data.pageType}`);
    if (data.title.includes('الماسة') || data.title.includes('مشتل')) {
      console.log('--- FOUND MATCH ---');
      console.log(JSON.stringify(data, null, 2));
      console.log('--------------------');
    }
  });
}

run().catch(console.error);
