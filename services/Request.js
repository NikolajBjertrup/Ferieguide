import OpenAI from "openai/index.mjs";

import { OPENAI_API_KEY } from "@env"; // Vi opretter denne lige om lidt
// Opret en ny instans af OpenAI-klassen
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// En lille console.log til at kontrollere at API keyen kan læses
// console.log("OPENAI_API_KEY:", JSON.stringify(OPENAI_API_KEY));

// Funktion der sender en besked til OpenAI API'et
export default async function SendMessage(messageArray) {
  const response = await openai.chat.completions.create({
    model: "gpt-5", // Her vælger du hvilken model du ønsker at bruge
    messages: messageArray,
  });

  // Udtræk AI'ens svar fra svaret
  const result = response.choices[0]?.message?.content || "";
  // Returnér AI'ens svar
  return { role: "assistant", content: result };
}

// ---------------------------------------------------------------------------
// Tale til tekst (OpenAI Whisper)
// ---------------------------------------------------------------------------
// Vi bruger IKKE openai-pakken her. Den vil have et rigtigt File-objekt, og i
// React Native har vi kun en filsti (uri) til optagelsen. Derfor bygger vi selv
// en multipart-formular og sender den med fetch. I React Native beskrives en fil
// med objektet { uri, name, type }.
export async function TranscribeAudio(uri) {
  const form = new FormData();
  form.append("file", { uri: uri, name: "optagelse.m4a", type: "audio/m4a" });
  form.append("model", "whisper-1");
  form.append("language", "da"); // hjælper Whisper med at vælge dansk

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    // Vi sætter IKKE Content-Type selv - React Native tilføjer den rigtige
    // multipart-boundary automatisk, når body er en FormData.
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: form,
  });

  if (!response.ok) {
    const fejl = await response.text();
    throw new Error("Transskribering fejlede (" + response.status + "): " + fejl);
  }

  const data = await response.json();
  return data.text;
}

// ---------------------------------------------------------------------------
// Rå tale -> pæn guidetekst
// ---------------------------------------------------------------------------
// Instruktionen til modellen. En "system"-besked sætter rollen og reglerne,
// før vi giver den udlejerens egne ord i en "user"-besked.
const GUIDE_SYSTEM_PROMPT =
  "Du hjælper en udlejer af en feriebolig med at skrive sin digitale husguide. " +
  "Du får en rå transskribering af en talebesked, hvor udlejeren fortæller om ét emne i huset. " +
  "Lav den om til en kort, sammenhængende informationstekst til gæsten.\n\n" +
  "Regler:\n" +
  "- Skriv på dansk i en venlig, rolig og praktisk tone.\n" +
  "- Tal til gæsten som 'I' eller 'du'.\n" +
  "- Fjern fyldord, gentagelser, tøvelyde og afbrudte sætninger.\n" +
  "- Behold ALLE konkrete oplysninger: tal, navne, placeringer, koder og tidspunkter.\n" +
  "- Opfind ALDRIG oplysninger, der ikke blev sagt. Er noget uklart, så udlad det.\n" +
  "- Brug 1-3 korte afsnit adskilt af en blank linje. Ingen overskrift, ingen punktopstilling, ingen emojis.\n" +
  "- Svar KUN med selve teksten til gæsten.";

export async function RewriteToGuideText(categoryTitle, spokenText) {
  const messageArray = [
    { role: "system", content: GUIDE_SYSTEM_PROMPT },
    {
      role: "user",
      content:
        "Emnet er: " + categoryTitle + "\n\n" +
        "Udlejerens indtalte besked:\n\"\"\"\n" + spokenText + "\n\"\"\"",
    },
  ];

  // Vi genbruger SendMessage fra samme fil
  const answer = await SendMessage(messageArray);
  return answer.content.trim();
}
