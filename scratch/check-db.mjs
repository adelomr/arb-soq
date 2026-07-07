import { initializeApp } from "firebase/app";
import { getFirestore, collection, collectionGroup, query, getDocs } from "firebase/firestore";

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
  console.log("=== PAGES ===");
  const pagesSnap = await getDocs(collection(firestore, 'pages'));
  pagesSnap.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id} | Slug: ${data.slug} | Title: ${data.title} | Published: ${data.isPublished}`);
  });

  console.log("\n=== RECENT ADS ===");
  const adsSnap = await getDocs(collectionGroup(firestore, 'ads'));
  let count = 0;
  adsSnap.forEach(doc => {
    const data = doc.data();
    if (data.adType === 'image' || data.adType === 'صوري' || count < 5) {
      console.log(`ID: ${doc.id} | Title: ${data.title} | Type: ${data.adType} | UserID: ${data.userId} | Category: ${data.category}`);
      console.log('ImageUrls:', data.imageUrls);
      console.log('User field:', data.user);
      console.log('---');
      if (data.adType === 'image' || data.adType === 'صوري') {
        count++;
      }
    }
  });
}

run().catch(console.error);
