const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function sendTestEmail() {
  try {
    // Structure based on the Trigger Email from Firestore documentation
    const docRef = await addDoc(collection(db, "mail"), {
      to: "jesusperez_14@hotmail.com", // Replace with your email
      from: "nukedev.jp@gmail.com", // Optional: Replace with your sender email if configured
      message: {
        subject: "Test Email from NeuroTrack",
        html: "<h1>Test Email</h1><p>This is a test email to verify the Trigger Email from Firestore extension is working.</p>"
      }
    });
    console.log("Test email document created with ID:", docRef.id);
  } catch (error) {
    console.error("Error creating test email:", error);
    console.error("Error details:", error.message);
  }
}

sendTestEmail();