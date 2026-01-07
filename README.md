# Sveriges Radio Webbapp - Moment 5

Hej! Det här är min labb för Moment 5 i kursen DT084G. Jag har byggt en webbapp som hämtar info från Sveriges Radios API så man kan kolla på programtablåer och lyssna på radio direkt i webbläsaren.

## Vad gör appen?

Enkelt förklarat så kan du:
- Se en lista med olika radiokanaler (P1, P2, P3, och massa P4-kanaler)
- Klicka på en kanal för att se vad som sänds idag
- Lyssna på radio live direkt på sidan
- Se vilket program som är på just nu (det visas först och är markerat med gul bakgrund)

## Hur jag löste uppgiften

### De obligatoriska delarna
- Kanal-listan syns till vänster och du kan klicka på dem
- Om du hovrar över en kanal så ser du lite mer info (title-attribut)
- Programtablån visas med rätt HTML-taggar (article, h3, h4, h5, p)
- Allt hämtas från Sveriges Radios API

### Extragrejer
Jag lade även till:
- **Radiospelare** - du kan välja kanal från en dropdown och klicka "Spela" för att lyssna live
- **Kanalväljare** - ändra hur många kanaler du vill se (standard är 10)

### Bonusfunktioner som jag tyckte var kul att lägga till
- Programmet som sänds JUST NU hamnar överst i listan (med en röd prick 🔴)
- Det som sänds nu får gul bakgrund så det är lätt att se
- Om du byter radiokanal så slutar den förra spela (inget dubbelt ljud!)
- Tider visas som man är van vid (09:00 istället av nåt konstigt datumformat)

## Hur man använder appen

1. Öppna index.html i en webbläsare
2. Klicka på en kanal i listan till vänster
3. Kolla på programtablån - det som är på just nu syns först
4. Vill du lyssna? Välj kanal i dropdown:en uppe till höger och tryck "Spela"

## Tekniskt 

Jag har använt:
- JavaScript
- Sveriges Radios öppna API
- HTML5 audio för att spela upp radio
- CSS som redan fanns i grundfilerna

### Filstruktur
```
├── index.html       # Grundstrukturen
├── css/
│   └── styles.css   # All styling
├── js/
│   └── main.js      # Min JavaScript-kod (här händer magin!)
└── README.md        # Den här filen
```

## Om API:et

Sveriges Radio:
- `/channels` - hämtar alla radiokanaler
- `/scheduledepisodes` - hämtar programtablå för en viss kanal och datum

## Saker jag hade problem med (och hur jag löste dem)

1. **Tiderna visades som "Invalid Date"** - API:et använder ett konstigt format (`/Date(millisekunder)/`) så jag fick skriva en funktion som konverterar det till vanlig tid.

2. **Flera radiokanaler spelade samtidigt** - Första versionen skapade nya audio-element utan att stoppa de gamla. Lösningen var att leta upp ALLA audio-element på sidan och ta bort dem innan jag skapar ett nytt.

3. **Sorteringen funkade inte** - Det tog ett tag att få programtablån att visa aktuellt program först, men till slut fungerade det genom att jämföra nuvarande tid med varje programs start- och sluttid.

## Testa själv

Prova gärna att:
- Klicka på P1 och se programtablån
- Hovra över kanalnamnen
- Ändra "Max antal" till typ 20 och se fler kanaler
- Spela upp P3 och sen byt till P2 (bara en spelar åt gången, eller hur?)

## Om mig

**Namn:** Sebastian Lindahl 
**Student-ID:** Seli2501  
**Kurs:** DT084G

---

Tack för att du kollar på min labb!
