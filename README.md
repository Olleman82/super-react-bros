# Super React Bros

En Super Mario Bros-klon byggd med React, TypeScript och Vite, med AI-genererade banor via Google Gemini.

## Funktioner

- 🎮 Klassisk Super Mario Bros-spelupplevelse
- 🤖 AI-genererade banor med Google Gemini 2.5 Flash
- 📱 Responsiv design med touch-kontroller
- 🎨 Pixel-art grafik i klassisk stil
- 🔊 Ljudeffekter och musik

## Installation

**Förutsättningar:** Node.js 18+

1. Installera beroenden:
   ```bash
   npm install
   ```

2. Starta utvecklingsservern:
   ```bash
   npm run dev
   ```

3. Öppna webbläsaren på `http://localhost:3000`

## AI-genererade banor

För att använda AI-funktionen behöver du en gratis API-nyckel från [Google AI Studio](https://aistudio.google.com/app/apikey).

1. Klicka på "Ange API-nyckel" i menyn
2. Klistra in din Gemini API-nyckel
3. Klicka på "✨ SKAPA AI-BANA" för att generera en ny bana

API-nyckeln sparas lokalt i din webbläsare.

## Kontroller

- **Pilarna / D-PAD**: Gå vänster/höger
- **SPACE / A**: Hoppa
- **SHIFT / B**: Springa/Skjuta eldkulor (när du har Fire Flower)

## Teknologi

- React 19
- TypeScript
- Vite
- Google Gemini AI (@google/genai)
- Tailwind CSS

## Bygga för produktion

```bash
npm run build
```

Byggfilerna kommer att finnas i `dist/`-mappen.

## Licens

MIT
