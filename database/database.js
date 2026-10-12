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
  deleteDoc,
  query,
  orderBy,
  where,
  writeBatch,
  serverTimestamp,
  runTransaction,
  deleteField,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PAGES } from '../data/const';
import { HOUSE_FIELDS } from '../data/quickSetup';
import { buildPageBlocks, pageSnapshot, setupPages } from '../services/quickSetup';

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

// ---------- Huse ----------
// Hvert hus er et dokument i "houses" med ownerId = udlejerens bruger-id.
// Husets sider ligger i en undercollection: houses/{houseId}/pages/{pageId}.

// Opretter et nyt hus for den udlejer, der er logget ind, og giver husets id tilbage.
// Nye huse starter uden opdigtet gæsteinformation. Kategorierne udfyldes af ejeren.
async function createHouse(name) {
  const houseRef = doc(collection(db, 'houses')); // nyt dokument med et automatisk id

  // Batch: huset og alle siderne skrives på én gang
  const batch = writeBatch(db);
  batch.set(houseRef, {
    ownerId: auth.currentUser.uid,
    name: name.trim(),
    welcome: '',
    wifiName: '',
    wifiPassword: '',
    ownerName: '',
    ownerPhone: '',
    createdAt: serverTimestamp(),
  });

  for (let i = 0; i < PAGES.length; i++) {
    const page = PAGES[i];
    // Sidens id bruges som dokument-id.
    // order gemmer rækkefølgen, da Firestore ellers sorterer efter id.
    batch.set(doc(db, 'houses', houseRef.id, 'pages', page.id), {
      title: page.title,
      icon: page.icon,
      active: false,
      blocks: [],
      order: i,
    });
  }

  await batch.commit();
  return houseRef.id;
}

// Henter alle huse, der tilhører den udlejer, der er logget ind
async function getHouses() {
  const q = query(collection(db, 'houses'), where('ownerId', '==', auth.currentUser.uid));
  const snapshot = await getDocs(q);
  const houses = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
  // Sortér alfabetisk efter navn, så listen altid står i samme rækkefølge
  return houses.sort((a, b) => a.name.localeCompare(b.name));
}

// Henter ét hus (navn, velkomsttekst, wifi osv.)
async function getHouse(houseId) {
  const snapshot = await getDoc(doc(db, 'houses', houseId));
  if (!snapshot.exists()) {
    throw new Error('Huset findes ikke.');
  }
  return { id: snapshot.id, ...snapshot.data() };
}

// Gemmer ændringer i husets info, fx updateHouse(houseId, { wifiPassword: 'ny-kode' })
async function updateHouse(houseId, changes) {
  await updateDoc(doc(db, 'houses', houseId), changes);
}

// Kladden er et felt på huset og er dækket af husets eksisterende ejerregler.
async function saveQuickSetupDraft(houseId, draft) {
  if (JSON.stringify(draft).length > 280000) throw new Error('Kladden er for stor. Forkort nogle af svarene, før du gemmer.');
  await updateDoc(doc(db, 'houses', houseId), { quickSetupDraft: draft });
}

// Alle godkendte sider og husinfo publiceres samlet. En fejl efterlader kladden intakt.
// Kontrollen af udgangspunktet forhindrer overskrivning af ændringer fra en anden enhed.
async function publishQuickSetup(houseId, draft) {
  const selected = setupPages(draft).filter((page) => page.publishable);
  if (!draft.houseInfo.name.trim()) throw new Error('Giv sommerhuset et navn før godkendelse.');
  const houseRef = doc(db, 'houses', houseId);
  return runTransaction(db, async (transaction) => {
    const houseDoc = await transaction.get(houseRef);
    if (!houseDoc.exists()) throw new Error('Sommerhuset findes ikke længere.');
    const currentHouse = houseDoc.data();
    const snapshots = [];
    for (const page of selected) snapshots.push(await transaction.get(doc(db, 'houses', houseId, 'pages', page.id)));
    const houseChanges = {};
    for (const key of HOUSE_FIELDS) {
      if (draft.houseInfo[key] !== draft.baseHouse[key]) {
        if ((currentHouse[key] || '') !== draft.baseHouse[key]) throw new Error('Husinfo er ændret siden opsætningen startede. Start en ny opsætning for at bruge de nyeste oplysninger.');
        houseChanges[key] = draft.houseInfo[key];
      }
    }
    const updatedPages = selected.map((page, index) => {
      const snapshot = snapshots[index];
      const current = snapshot.exists() ? pageSnapshot(snapshot.data()) : null;
      if (JSON.stringify(current) !== JSON.stringify(pageSnapshot(page.basePage))) {
        throw new Error(`“${page.title}” er ændret siden opsætningen startede. Start en ny opsætning for at bruge den nyeste version.`);
      }
      return {
        id: page.id, title: page.title, icon: page.icon, active: true,
        order: page.basePage?.order ?? draft.newPageOrder + index,
        custom: page.basePage?.custom ?? true, blocks: buildPageBlocks(page, page.id),
      };
    });
    updatedPages.forEach(({ id, ...page }) => transaction.set(doc(db, 'houses', houseId, 'pages', id), page));
    transaction.update(houseRef, { ...houseChanges, quickSetupDraft: deleteField() });
    const { quickSetupDraft, ...house } = currentHouse;
    return { house: { ...house, ...houseChanges, id: houseId }, pages: updatedPages };
  });
}

// ---------- Sider ----------

// Henter alle sider i ét hus i den rigtige rækkefølge
async function getPages(houseId) {
  const pagesRef = collection(db, 'houses', houseId, 'pages');
  const snapshot = await getDocs(query(pagesRef, orderBy('order')));

  return snapshot.docs.map((document) => {
    const data = document.data();
    return {
      id: document.id,
      title: data.title,
      icon: data.icon,
      active: data.active,
      blocks: data.blocks,
      order: data.order,
      custom: data.custom === true, // true = udlejerens egen kategori (kan slettes)
    };
  });
}

// Opretter en ny, tom kategori (side) i huset og giver den tilbage som objekt,
// så den kan lægges direkte ind i state. Den starter skjult for gæsten.
async function createPage(houseId, title, icon, order) {
  const pageRef = doc(collection(db, 'houses', houseId, 'pages')); // automatisk id
  const page = {
    title: title.trim(),
    icon: icon,
    active: false,
    blocks: [],
    order: order,
    custom: true,
  };
  await setDoc(pageRef, page);
  return { id: pageRef.id, ...page };
}

// Sletter en kategori. Billeder i Storage bliver liggende (som ved slettede billedblokke).
async function deletePage(houseId, pageId) {
  await deleteDoc(doc(db, 'houses', houseId, 'pages', pageId));
}

// Gemmer ændringer på én side, fx updatePage(houseId, 'koekken', { active: false }).
// updateDoc ændrer kun de felter, vi sender med – resten bliver stående.
async function updatePage(houseId, pageId, changes) {
  await updateDoc(doc(db, 'houses', houseId, 'pages', pageId), changes);
}

// Laver et unikt id til en ny blok, fx "1727862000000-4821".
// Bruges som key, når blokkene vises, og til at finde den rigtige blok igen.
function newBlockId() {
  return Date.now() + '-' + Math.floor(Math.random() * 10000);
}

// Uploader et billede fra telefonen til Firebase Storage og giver linket tilbage.
// `localUri` er stien til billedet på telefonen (fra kameraet eller galleriet),
// `path` er hvor det skal ligge i Storage.
async function uploadFile(path, localUri) {
  // Hent billedfilen som en "blob" (rå data), som Firebase kan uploade
  const response = await fetch(localUri);
  const blob = await response.blob();

  const imageRef = ref(storage, path);
  // contentType fortæller Storage, at det er et billede. Sikkerhedsreglerne
  // afviser filer, der ikke er billeder.
  await uploadBytes(imageRef, blob, { contentType: 'image/jpeg' });

  // Linket kan vises direkte i et <Image>, og det er det, vi gemmer i databasen
  return await getDownloadURL(imageRef);
}

// Billede til en side, fx houses/abc123/pages/koekken/1727862000000.jpg
async function uploadImage(houseId, pageId, localUri) {
  return await uploadFile('houses/' + houseId + '/pages/' + pageId + '/' + Date.now() + '.jpg', localUri);
}

// Baggrundsbillede til forsiden, fx houses/abc123/cover/1727862000000.jpg
async function uploadCoverImage(houseId, localUri) {
  return await uploadFile('houses/' + houseId + '/cover/' + Date.now() + '.jpg', localUri);
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
    case 'auth/too-many-requests':
      return 'For mange forsøg. Vent lidt, og prøv igen.';
    case 'auth/network-request-failed':
      return 'Ingen forbindelse til internettet.';
    default:
      return error.message;
  }
}

export {
  auth,
  db,
  createHouse,
  getHouses,
  getHouse,
  updateHouse,
  saveQuickSetupDraft,
  publishQuickSetup,
  getPages,
  createPage,
  deletePage,
  updatePage,
  newBlockId,
  uploadImage,
  uploadCoverImage,
  registerUser,
  authErrorMessage,
};
