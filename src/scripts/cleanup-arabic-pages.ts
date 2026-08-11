import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDpWBWFpS7NWvkAGR2FZlrH901qVwB0Iww",
  authDomain: "arb-soq.firebaseapp.com",
  databaseURL: "https://arb-soq-default-rtdb.firebaseio.com",
  projectId: "arb-soq",
  storageBucket: "arb-soq.firebasestorage.app",
  messagingSenderId: "264703833176",
  appId: "1:264703833176:web:a66bad059758a42fc3862d",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

async function run() {
  console.log("Fetching all pages from Firestore...");
  const snapshot = await getDocs(collection(db, "pages"));
  console.log(`Found ${snapshot.size} pages in 'pages' collection:\n`);

  let deletedCount = 0;
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const id = docSnap.id;
    const slug = data.slug || "";
    const title = data.title || "";
    const pageType = data.pageType || "";

    console.log(`- ID: ${id} | Title: "${title}" | Slug: "${slug}" | Type: ${pageType}`);

    // Check if slug contains Arabic characters or if it's an auto-generated adpage with Arabic slug
    const hasArabicInSlug = /[\u0600-\u06FF]/.test(slug);

    if (hasArabicInSlug || (pageType === 'adpage' && (hasArabicInSlug || slug.includes('%')))) {
      console.log(`  ==> DELETING page with Arabic / bad slug: "${slug}" (ID: ${id})`);
      await deleteDoc(doc(db, "pages", id));
      deletedCount++;
    }
  }

  console.log(`\nCleanup completed! Deleted ${deletedCount} pages with Arabic/bad slugs.`);
  process.exit(0);
}

run().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
