// Grunddata om huset. Vises på HomeScreen og bruges i "Kontakt"-siden.
export const HOUSE = {
  name: "Sommerhus Klitvej 12",
  welcome: "Velkommen til Klitvej 12. Her finder du alt om huset og området.",
  checkout: "Senest kl. 10.00",
  wifiName: "Klitvej12",
  wifiPassword: "sommer2026",
  ownerName: "Mette Hansen",
  ownerPhone: "+45 12 34 56 78",
  cover: require("../assets/hus.png"),
};

// Hardcodet PIN til udlejertilstand
export const OWNER_PIN = "1234";

// De prædefinerede sider i guiden.
// `active` styrer om gæsten ser siden. Udlejeren kan slå den til/fra.
// `icon` er et Ionicons-navn. `id` er unik og bruges som key i FlatList.
export const PAGES = [
  {
    id: "koekken",
    title: "Køkken",
    icon: "restaurant-outline",
    active: true,
    body:
      "Opvaskemaskinen startes ved at trykke på knappen i højre side og vælge program 'Eco'. " +
      "Tabs ligger i skabet under vasken. Kaffemaskinen bruger almindelig filterkaffe – filtre ligger i skuffen til venstre for komfuret.\n\n" +
      "Husk at tømme køleskabet og lade lågen stå på klem, når I rejser.",
    image: require("../assets/koekken.png"),
  },
  {
    id: "sauna",
    title: "Sauna",
    icon: "flame-outline",
    active: true,
    body:
      "Saunaen tændes på panelet ved døren. Sæt temperaturen til 70–80 grader og vent ca. 30 minutter.\n\n" +
      "Hæld kun vand på stenene – aldrig olie direkte. Sluk altid saunaen på panelet, når I er færdige, og lad døren stå åben, så den kan tørre.",
    image: require("../assets/sauna.png"),
  },
  {
    id: "vaerelser",
    title: "Værelser",
    icon: "bed-outline",
    active: true,
    body:
      "Huset har tre soveværelser: to med dobbeltseng og ét med to enkeltsenge. Dyner og puder ligger i skabene.\n\n" +
      "Sengelinned og håndklæder er ikke inkluderet, medmindre det er bestilt på forhånd. Ekstra tæpper findes i gangskabet.",
    image: require("../assets/vaerelser.png"),
  },
  {
    id: "udtjekning",
    title: "Udtjekning",
    icon: "exit-outline",
    active: true,
    body:
      "Udtjekning er senest kl. 10.00 på afrejsedagen.\n\n" +
      "Inden I tager afsted: tøm opvaskemaskinen, tag affaldet ud, luk alle vinduer og sæt varmen på 15 grader. " +
      "Læg nøglen i nøgleboksen ved hoveddøren og drej koden.",
    image: require("../assets/udtjekning.png"),
  },
  {
    id: "strand",
    title: "Stranden",
    icon: "sunny-outline",
    active: true,
    body:
      "Stranden ligger 400 meter fra huset – følg stien for enden af Klitvej. Der er badebro fra maj til september.\n\n" +
      "Pas på strømmen ved revlerne, og bad altid, hvor der er andre. Redningsposter findes for hver 200 meter.",
    image: require("../assets/strand.png"),
  },
  {
    id: "restauranter",
    title: "Restauranter",
    icon: "wine-outline",
    active: false,
    body:
      "Klitgården (2 km): God fisk og børnevenlig. Bordbestilling anbefales i højsæsonen.\n\n" +
      "Havnekiosken (3 km): Fiskefrikadeller og softice ved havnen.\n\n" +
      "Pizzeria Roma (4 km): Tager imod bestillinger til afhentning.",
    image: require("../assets/restauranter.png"),
  },
  {
    id: "kontakt",
    title: "Kontakt",
    icon: "call-outline",
    active: false,
    body:
      "Har I spørgsmål eller problemer med huset, så ring til Mette på +45 12 34 56 78.\n\n" +
      "Ved akut nødsituation: ring 112.\n\n" +
      "Nærmeste læge: Lægehuset i Nørre Vorupør, tlf. 97 93 80 00.",
    image: require("../assets/kontakt.png"),
  },
  {
    id: "affald",
    title: "Affald & genbrug",
    icon: "trash-outline",
    active: false,
    body:
      "Affaldet sorteres i tre spande ved indkørslen: restaffald, madaffald og pap/papir.\n\n" +
      "Flasker og dåser afleveres i genbrugscontaineren ved købmanden. Spandene tømmes hver torsdag.",
    image: require("../assets/affald.png"),
  },
];
