# ZekerFlex online publiceren

De productie-app staat volledig in `zekerflex-app` en gebruikt één Next.js App Router-pagina. De losse HTML-bestanden in de repository-root zijn geen onderdeel van de deployment.

## Render

1. Push deze repository naar GitHub.
2. Kies in Render **New > Blueprint** en selecteer de repository.
3. Render leest [render.yaml](render.yaml) en bouwt automatisch vanuit `zekerflex-app`.
4. De build gebruikt `npm ci && npm run build`; de service start met `npm run start`.
5. Controleer na de eerste deploy de tijdelijke `onrender.com`-URL.

Je kunt ook handmatig een **Web Service** maken met:

- Root Directory: `zekerflex-app`
- Build Command: `npm ci && npm run build`
- Start Command: `npm run start`
- Environment: `Node`

## TransIP-domein

1. Open in Render de service en kies **Settings > Custom Domains**.
2. Voeg je domein toe, bijvoorbeeld `zekerflex.nl` en eventueel `www.zekerflex.nl`.
3. Neem de door Render getoonde DNS-records exact over in TransIP.
4. Gebruik bij voorkeur de Render-doelhost als CNAME voor `www`.
5. Stel voor het hoofddomein de door Render opgegeven A-records in. Verwijder conflicterende oude records.
6. Wacht op DNS-propagatie. Render activeert daarna automatisch HTTPS.

Laat de nameservers bij TransIP staan als je alleen DNS-records aanpast. Gebruik geen proxy of forwarding op de Render-records.

## Data en privacy

De statische demo gebruikt `localStorage` per browser. Demo-klussen, reacties en admin-acties worden dus niet gedeeld tussen bezoekers en worden niet naar een server verstuurd. Plaats geen echte persoonsgegevens, KYC-documenten, betaalgegevens of productie-auditlogs in deze demo.

Voor echte online data is een beveiligde backend nodig, bijvoorbeeld de bestaande Supabase-app in `zekerflex-app/`, met Row Level Security, server-side secrets en geauthenticeerde adminroutes. Zet nooit service-role keys in HTML of client-side JavaScript.

## Lokaal testen

Voor de Next.js-app:

```bash
cd zekerflex-app
npm install
npm run build
npm run start
```

Open daarna `http://localhost:3000`.
