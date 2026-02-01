# JO8 Inzicht Trainer - Documentatie

## 1. Project Overzicht

**Naam:** JO8 Inzicht Trainer  
**Doel:** Een interactieve webapp waarmee jonge voetballers (JO8) leren waar ze moeten staan in bepaalde spelsituaties.

De app heeft twee gebruikers:
- **Trainer:** Maakt oefeningen met een voetbalveld, spelers en een doelgebied
- **Speler:** Oefent door zichzelf naar de juiste positie te slepen

---

## 2. Gebruikte Technologieën

| Technologie | Versie | Waarvoor |
|-------------|--------|----------|
| **React** | 19.2.0 | Frontend framework - bouwt de gebruikersinterface |
| **TypeScript** | 5.9.3 | JavaScript met types - voorkomt fouten |
| **Vite** | 7.2.4 | Development server & bundler - maakt de app snel |
| **Tailwind CSS** | 4.1.18 | Styling - maakt de app mooi met CSS classes |
| **Supabase** | 2.93.3 | Cloud database (PostgreSQL) - slaat data op |
| **ElevenLabs API** | - | Text-to-speech - leest vragen voor met AI stem |
| **@dnd-kit** | 6.3.1 | Drag-and-drop - spelers en bal verslepen |
| **canvas-confetti** | 1.9.4 | Confetti animatie bij goed antwoord |
| **Lucide React** | 0.563.0 | Iconen (bijv. tandwiel, prullenbak) |

---

## 3. App Structuur

De app heeft **3 pagina's** (modes):

```
┌─────────────────────────────────────────────────────────┐
│                   JO8 Inzicht Trainer                   │
├─────────────┬─────────────┬─────────────────────────────┤
│   TRAINER   │   SPELER    │        INSTELLINGEN         │
│  (Editor)   │   (Quiz)    │        (Settings)           │
└─────────────┴─────────────┴─────────────────────────────┘
```

### Trainer modus (`Editor.tsx`)
- Voeg spelers toe (2 teams + keepers)
- Plaats een bal op het veld
- Plaats het gele doelgebied (waar de speler moet staan)
- Type een vraag of neem audio op
- Sla de oefening op in de database

### Speler modus (`Quiz.tsx`)
- Kies een oefening uit de lijst
- Hoort/leest de vraag
- Sleep het oranje bolletje (JIJ) naar de juiste plek
- Krijgt feedback: confetti bij goed, "probeer nog eens" bij fout

### Instellingen (`Settings.tsx`)
- Configureer ElevenLabs API key voor mooie AI-stemmen
- Kies welke stem je wilt gebruiken
- Test de stem

---

## 4. Mappenstructuur

```
voetbaltrainer-app/
├── src/
│   ├── App.tsx              # Hoofdcomponent met navigatie
│   ├── main.tsx             # Entry point van de app
│   ├── types.ts             # TypeScript types (Player, Situation, etc.)
│   │
│   ├── components/
│   │   ├── Editor.tsx       # Trainer pagina - oefeningen maken
│   │   ├── Quiz.tsx         # Speler pagina - oefeningen doen
│   │   ├── Settings.tsx     # Instellingen pagina
│   │   ├── SoccerField.tsx  # Het voetbalveld (groen met lijnen)
│   │   ├── DraggablePlayer.tsx  # Versleepbare speler
│   │   ├── DraggableBall.tsx    # Versleepbare bal
│   │   ├── DraggableTarget.tsx  # Versleepbaar doelgebied
│   │   ├── PlayerToken.tsx  # Speler bolletje (visueel)
│   │   ├── BallToken.tsx    # Bal (visueel)
│   │   └── AudioRecorder.tsx    # Audio opname component
│   │
│   └── utils/
│       ├── supabase.ts      # Connectie met Supabase database
│       ├── storage.ts       # Opslaan/ophalen van situaties
│       └── elevenlabs.ts    # ElevenLabs text-to-speech
│
├── package.json             # Dependencies en scripts
├── vite.config.ts           # Vite configuratie
├── tailwind.config.js       # Tailwind CSS configuratie
└── index.html               # HTML template
```

---

## 5. Data Flow & Koppelingen

```
┌──────────────┐     ┌──────────────────────────────────────┐
│   Browser    │     │              SUPABASE                │
│  LocalStorage│     │         (Cloud Database)             │
│              │     │                                      │
│ ┌──────────┐ │     │  ┌────────────────────────────────┐  │
│ │ trainer  │ │     │  │ situations tabel               │  │
│ │  code    │ │     │  │ - id                           │  │
│ └──────────┘ │     │  │ - question                     │  │
└──────────────┘     │  │ - question_audio               │  │
                     │  │ - players (JSON)               │  │
                     │  │ - ball (JSON)                  │  │
                     │  │ - target_area (JSON)           │  │
                     │  │ - owner_code                   │  │
                     │  └────────────────────────────────┘  │
                     │                                      │
                     │  ┌────────────────────────────────┐  │
                     │  │ trainer_settings tabel         │  │
                     │  │ - trainer_code                 │  │
                     │  │ - elevenlabs_api_key           │  │
                     │  │ - elevenlabs_voice_id          │  │
                     │  └────────────────────────────────┘  │
                     └──────────────────────────────────────┘

┌──────────────────────────────────────┐
│           ELEVENLABS API             │
│       (Text-to-Speech Service)       │
│                                      │
│  App stuurt tekst →                  │
│  ← krijgt audio terug                │
│                                      │
│  Gebruikt voor:                      │
│  - Vragen voorlezen                  │
│  - "Super goed!" / "Probeer nog eens"│
└──────────────────────────────────────┘
```

---

## 6. Belangrijke Features

### Drag & Drop
Met `@dnd-kit` kunnen spelers, bal en doelgebied versleept worden op het veld. Posities worden opgeslagen als percentages (0-100%) zodat het werkt op elk schermformaat.

### Audio Opname
Trainers kunnen de vraag inspreken via de microfoon. Dit wordt opgeslagen als base64-encoded audio in de database.

### Text-to-Speech (TTS)
Vragen worden voorgelezen. Volgorde van proberen:
1. **Opgenomen audio** (als trainer iets heeft ingesproken)
2. **ElevenLabs API** (mooie AI-stem, als geconfigureerd)
3. **Browser TTS** (ingebouwde stem, als fallback)

### Eigenaarschap
Elke trainer heeft een geheime code. Oefeningen worden gekoppeld aan deze code, zodat alleen de eigenaar ze kan verwijderen.

### Feedback bij Quiz
- **Goed antwoord:** Confetti animatie + "Super goed!"
- **Fout antwoord:** "Helaas pindakaas!" met pindakaas-boterham afbeelding (verdwijnt na 2 seconden)

---

## 7. Hoe de App Starten

```bash
# 1. Dependencies installeren
npm install

# 2. Development server starten
npm run dev

# 3. Open in browser
# http://localhost:5173
```

---

## 8. Database (Supabase)

De app gebruikt Supabase als backend. Dit is een gratis cloud database gebaseerd op PostgreSQL.

**Connectie:** `src/utils/supabase.ts`
```typescript
const supabaseUrl = 'https://mxqrupcvaxtzcisgposb.supabase.co';
const supabaseKey = 'sb_publishable_...';
```

**Tabellen:**
- `situations` - Alle oefeningen
- `trainer_settings` - ElevenLabs instellingen per trainer

---

## 9. Samenvatting

| Wat | Hoe |
|-----|-----|
| Frontend | React + TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (cloud) |
| Drag & drop | @dnd-kit library |
| Spraak | ElevenLabs API + browser TTS |
| Build tool | Vite |
| Icons | Lucide React |

De app is een moderne **Single Page Application (SPA)** die volledig in de browser draait en communiceert met cloud services voor data opslag en spraak.
