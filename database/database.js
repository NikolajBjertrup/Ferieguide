// Opsætning af Firebase. Filen bygger på kursets guide (06_FirebaseLogin),
// men bruger Firestore (databasen) i stedet for Authentication (login).
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  query,
  orderBy,
} from 'firebase/firestore';
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
      blocks: page.blocks,
      order: i,
    });
  }
}

// Henter alle sider fra Firestore i den rigtige rækkefølge.
// Billedet ligger ikke i databasen, så vi finder det i const.js ud fra sidens id.
async function getPages() {
  const snapshot = await getDocs(query(collection(db, 'pages'), orderBy('order')));

  return snapshot.docs.map((document) => {
    const data = document.data();
    const localPage = PAGES.find((p) => p.id === document.id);

    // Ældre sider i databasen har kun en `body`-tekst og ingen blokke.
    // Dem laver vi om til én tekstblok, så resten af appen kun skal kende blokke.
    const blocks = data.blocks ? data.blocks : [{ id: 'tekst-1', type: 'text', text: data.body || '' }];

    return {
      id: document.id,
      title: data.title,
      icon: data.icon,
      active: data.active,
      blocks: blocks,
      image: localPage ? localPage.image : null,
    };
  });
}

// Gemmer ændringer på én side, fx updatePage('koekken', { active: false }).
// updateDoc ændrer kun de felter, vi sender med – resten bliver stående.
async function updatePage(pageId, changes) {
  await updateDoc(doc(db, 'pages', pageId), changes);
}

// Laver et unikt id til en ny blok, fx "1727862000000-4821".
// Bruges som key, når blokkene vises, og til at finde den rigtige blok igen.
function newBlockId() {
  return Date.now() + '-' + Math.floor(Math.random() * 10000);
}

export { db, uploadStartPages, getPages, updatePage, newBlockId };
