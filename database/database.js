// Opsætning af Firebase. Filen bygger på kursets guide (06_FirebaseLogin):
// Authentication (login), Firestore (databasen) og Storage (billeder).
import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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

// Login. Som i kursets guide gemmes login i AsyncStorage, så udlejeren
// forbliver logget ind på iPad'en, selvom appen lukkes.
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Firestore-databasen, som resten af appen importerer
const db = getFirestore(app);

// Firebase Storage, hvor billederne ligger. Firestore gemmer kun linket til dem.
const storage = getStorage(app);

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

// Uploader et billede fra telefonen til Firebase Storage og giver linket tilbage.
// `localUri` er stien til billedet på telefonen (fra kameraet).
async function uploadImage(pageId, localUri) {
  // Hent billedfilen som en "blob" (rå data), som Firebase kan uploade
  const response = await fetch(localUri);
  const blob = await response.blob();

  // Billedet lægges i en mappe pr. side, fx pages/koekken/1727862000000.jpg
  const imageRef = ref(storage, 'pages/' + pageId + '/' + Date.now() + '.jpg');
  await uploadBytes(imageRef, blob);

  // Linket kan vises direkte i et <Image>, og det er det, vi gemmer i billedblokken
  return await getDownloadURL(imageRef);
}

// ---------- Brugere og invitationskoder ----------

// Opretter en ny udlejer. Det kræver en gyldig invitationskode, som man får,
// når man køber abonnement. Koderne ligger i collectionen "invites", fx
// invites/SOMMER2026 = { used: false }.
async function registerUser(inviteCode, email, password) {
  const code = inviteCode.trim().toUpperCase();

  // 1) Tjek koden, før vi opretter noget
  const inviteRef = doc(db, 'invites', code);
  const invite = await getDoc(inviteRef);
  if (!invite.exists() || invite.data().used) {
    throw new Error('Invitationskoden er ugyldig eller allerede brugt.');
  }

  // 2) Opret login i Firebase Authentication. Brugeren er derefter logget ind.
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const uid = credential.user.uid;

  // 3) Markér koden som brugt og opret brugerens dokument.
  // En batch skriver begge dele på én gang – enten lykkes begge, eller ingen af dem.
  const batch = writeBatch(db);
  batch.update(inviteRef, { used: true, usedBy: uid });
  batch.set(doc(db, 'users', uid), {
    email: email.trim(),
    inviteCode: code,
    createdAt: serverTimestamp(),
  });
  await batch.commit();
}

// Oversætter Firebases fejlkoder til dansk, så de kan vises til brugeren
function authErrorMessage(error) {
  switch (error.code) {
    case 'auth/invalid-email':
      return 'Email-adressen er ikke gyldig.';
    case 'auth/email-already-in-use':
      return 'Der findes allerede en bruger med den email.';
    case 'auth/weak-password':
      return 'Kodeordet skal være mindst 6 tegn.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Forkert email eller kodeord.';
    case 'auth/network-request-failed':
      return 'Ingen forbindelse til internettet.';
    default:
      return error.message;
  }
}

export {
  auth,
  db,
  uploadStartPages,
  getPages,
  updatePage,
  newBlockId,
  uploadImage,
  registerUser,
  authErrorMessage,
};
