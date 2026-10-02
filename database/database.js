// Opsætning af Firebase. Filen bygger på kursets guide (06_FirebaseLogin),
// men bruger Firestore (databasen) i stedet for Authentication (login).
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { PAGES } from '../data/const';

// Indsæt dit eget firebaseConfig fra Firebase Console her
// (Project settings → Your apps → din web-app).
// apiKey er ikke hemmelig – den fortæller bare, hvilket projekt appen hører til.
const firebaseConfig = {
  apiKey: "AIzaSyBQPWujw7Zs5eJkHgRWphM89jGytWpRw0k",
  authDomain: "ferieguide-4fad6.firebaseapp.com",
  projectId: "ferieguide-4fad6",
  storageBucket: "ferieguide-4fad6.firebasestorage.app",
  messagingSenderId: "448357866898",
  appId: "1:448357866898:web:64f23d74bf63be7b1ab54b",
  measurementId: "G-Q4YNJM7SGG"
};

// Start forbindelsen til vores Firebase-projekt
const app = initializeApp(firebaseConfig);

// Firestore-databasen, som resten af appen importerer
const db = getFirestore(app);

// Lægger startsiderne fra const.js op i Firestore-collectionen "pages".
// Kører kun, hvis collectionen er tom, så vi ikke overskriver udlejerens ændringer.
async function uploadStartPages() {
  const snapshot = await getDocs(collection(db, 'pages'));
  if (!snapshot.empty) {
    return;
  }

  for (let i = 0; i < PAGES.length; i++) {
    const page = PAGES[i];
    // Sidens id bruges som dokument-id. Billedet (require) kan ikke gemmes
    // i databasen, så det bliver liggende lokalt i const.js.
    // order gemmer rækkefølgen, da Firestore ellers sorterer efter id.
    await setDoc(doc(db, 'pages', page.id), {
      title: page.title,
      icon: page.icon,
      active: page.active,
      body: page.body,
      order: i,
    });
  }
}

export { db, uploadStartPages };
