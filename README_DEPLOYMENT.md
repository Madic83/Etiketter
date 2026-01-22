# Deployment Guide - Etiketter App

## Alternativ 1: GitHub Pages (Rekommenderat - Gratis)

### Steg 1: Skapa GitHub Repository
1. Gå till https://github.com och logga in
2. Klicka på "New repository"
3. Namnge repot (t.ex. "etiketter")
4. Gör det publikt eller privat
5. Klicka "Create repository"

### Steg 2: Ladda upp koden
Kör dessa kommandon i terminalen:
```bash
cd C:\Etiketter
git init
git add index.html styles.css script.js README.md
git add .github/workflows/deploy.yml
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/DITT-ANVÄNDARNAMN/etiketter.git
git push -u origin main
```

### Steg 3: Aktivera GitHub Pages
1. Gå till repository-inställningar på GitHub
2. Klicka på "Pages" i sidomenyn
3. Under "Source", välj "GitHub Actions"
4. Appen kommer automatiskt att deployas

Din app kommer vara tillgänglig på:
`https://DITT-ANVÄNDARNAMN.github.io/etiketter/`

---

## Alternativ 2: Netlify (Enklast - Drag & Drop)

1. Gå till https://www.netlify.com
2. Registrera ett gratis konto
3. Klicka på "Add new site" → "Deploy manually"
4. Dra och släpp dessa filer:
   - index.html
   - styles.css
   - script.js
5. Netlify ger dig en URL direkt (t.ex. `random-name-123.netlify.app`)
6. Du kan byta till ett custom domain om du vill

---

## Alternativ 3: Vercel

1. Installera Vercel CLI:
```bash
npm install -g vercel
```

2. Skapa en `vercel.json` fil (redan klar)

3. Deploya:
```bash
cd C:\Etiketter
vercel
```

4. Följ instruktionerna i terminalen
5. Din app får en URL som: `etiketter.vercel.app`

---

## Alternativ 4: Egen Server

Om du har en egen webbserver (Apache/Nginx):

1. Kopiera filerna till webbserverns mapp:
   - index.html
   - styles.css
   - script.js

2. Konfigurera HTTPS (rekommenderat med Let's Encrypt)

3. Appen är tillgänglig på din domän

---

## Viktigt att Veta

- **Save/Load funktionen**: Den nuvarande backend-funktionen (Python) fungerar INTE på statisk hosting
- **Lösning**: Appen använder redan browser-baserad filhantering som fallback
- **Lokalt sparande**: Användare kan spara/ladda JSON-filer direkt från sin dator

För att behålla full funktionalitet med server-baserad filhantering behöver du:
- En Node.js eller Python backend
- Hosting som stödjer backend (Heroku, Railway, Render, etc.)

Men för normal användning fungerar appen perfekt med statisk hosting!
