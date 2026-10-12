// Spørgsmålene giver samtalen retning. Assistenten vælger opfølgning ud fra svarene.
export const HOUSE_TOPIC_ID = 'house-info';
export const HOUSE_FIELDS = ['name', 'welcome', 'wifiName', 'wifiPassword', 'ownerName', 'ownerPhone'];
export const SETUP_STEPS = ['Kategorier', 'Samtale', 'Billeder', 'Godkend'];
export const SETUP_CATEGORIES = [
  { id: 'koekken', title: 'Køkken', icon: 'restaurant-outline', question: 'Hvilke apparater i køkkenet skal gæsterne have hjælp til at bruge?', hints: 'Betjening af komfur, ovn, opvaskemaskine og kaffemaskine; placering af tilbehør; rengøring.' },
  { id: 'bad', title: 'Bad', icon: 'water-outline', question: 'Er der noget særligt ved bruseren, det varme vand eller udluftningen?', hints: 'Betjening, varmt vand, ventilation, håndklæder og rengøring.' },
  { id: 'sauna', title: 'Sauna', icon: 'flame-outline', question: 'Hvordan tænder, indstiller og slukker gæsterne saunaen?', hints: 'Betjening, opvarmning, ejerens sikkerhedsregler, børn og oprydning. Gæt aldrig temperaturer eller sikkerhedsinstruktioner.' },
  { id: 'vaerelser', title: 'Værelser', icon: 'bed-outline', question: 'Hvordan er sovepladserne fordelt, og hvad skal gæsterne vide om sengetøj?', hints: 'Sovepladser, sengelinned, dyner, ekstra tæpper og barneseng.' },
  { id: 'varme', title: 'Varme', icon: 'thermometer-outline', question: 'Hvordan regulerer gæsterne varmen i huset?', hints: 'Varmepumpe, gulvvarme, fjernbetjening og ejerens ønskede indstilling ved afrejse.' },
  { id: 'braendeovn', title: 'Brændeovn', icon: 'bonfire-outline', question: 'Hvad skal gæsterne vide for at bruge brændeovnen korrekt?', hints: 'Ejerens optændingsvejledning, brænde, luftspjæld, aske og sikkerhed. Opfind ingen betjenings- eller sikkerhedsregler.' },
  { id: 'ankomst', title: 'Ankomst & parkering', icon: 'key-outline', question: 'Hvordan finder gæsterne huset, parkerer og kommer ind ved ankomst?', hints: 'Vejbeskrivelse, parkering, ankomsttid og nøgleudlevering. Ingen integration med fysiske låse.' },
  { id: 'udtjekning', title: 'Udtjekning', icon: 'exit-outline', question: 'Hvornår skal gæsterne tjekke ud, og hvad skal de gøre inden afrejse?', hints: 'Tidspunkt, rengøring, vinduer, varme, affald og aflevering af nøgle.' },
  { id: 'affald', title: 'Affald & genbrug', icon: 'trash-outline', question: 'Hvor er affaldsspandene, og hvordan skal gæsterne sortere affaldet?', hints: 'Placering, sortering, tømning og pant. Gæt ikke lokale regler.' },
  { id: 'strand', title: 'Stranden', icon: 'sunny-outline', question: 'Hvordan kommer gæsterne til stranden, og hvad gør den særlig?', hints: 'Rute, afstand, adgang og ejerens oplysninger om forhold på stranden.' },
  { id: 'restauranter', title: 'Restauranter', icon: 'wine-outline', question: 'Hvilke spisesteder vil du personligt anbefale gæsterne?', hints: 'Navne, beliggenhed og hvorfor ejeren anbefaler dem. Opfind ikke åbningstider eller restauranter.' },
  { id: 'kontakt', title: 'Kontakt', icon: 'call-outline', question: 'Hvem skal gæsterne kontakte, hvis noget ikke virker?', hints: 'Kontaktperson, telefon, kontaktmuligheder og ejerens egne instruktioner ved problemer.' },
  { id: 'udeliv', title: 'Have & terrasse', icon: 'leaf-outline', question: 'Hvad kan gæsterne bruge i haven og på terrassen?', hints: 'Grill, havemøbler, legeudstyr, opbevaring og regler.' },
  { id: 'saerligt', title: 'Det særlige ved huset', icon: 'sparkles-outline', question: 'Hvad gør netop dit sommerhus særligt — og hvad ville du selv vise gæsterne ved ankomst?', hints: 'Personlige favoritter, lokale oplevelser, særlige hensyn, skjulte funktioner og ting gæster ofte spørger om.' },
];

export const HOUSE_TOPIC = {
  id: HOUSE_TOPIC_ID,
  title: 'Om sommerhuset',
  icon: 'home-outline',
  question: 'Hvad hedder sommerhuset, og hvordan vil du byde gæsterne velkommen?',
  hints: 'Husnavn og velkomst. Spørg derefter om wifi-navn og adgangskode, og til sidst kontaktperson og telefon. Spørg kun om manglende oplysninger.',
};
