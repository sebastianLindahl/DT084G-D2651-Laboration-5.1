"use strict";

/**
 * Sveriges Radio Webbapplikation
 * Moment 5 - DT084G
 * 
 * Denna applikation hämtar och visar information från Sveriges Radios öppna API.
 * Funktionalitet inkluderar:
 * - Visa kanaler i navigeringsmeny
 * - Visa programtablå för vald kanal
 * - Spela upp live-radio
 * - Filtrera antal kanaler som visas
 */

/*  Delar till ej obligatorisk funktionalitet, som kan ge poäng för högre betyg
*   Radera rader för funktioner du vill visa på webbsidan. */
// document.getElementById("player").style.display = "none";      // Raderad för att visa musikspelare
// document.getElementById("shownumrows").style.display = "none"; // Raderad för att visa antal träffar

/* ========== KONSTANTER OCH GLOBALA VARIABLER ========== */

// API-basadress för Sveriges Radio - VIKTIGT: Använd HTTPS!
const API_BASE = "https://api.sr.se/api/v2";

// Hämta DOM-element
const mainNavList = document.getElementById("mainnavlist");
const infoDiv = document.getElementById("info");
const numRowsInput = document.getElementById("numrows");
const playChannelSelect = document.getElementById("playchannel");
const playButton = document.getElementById("playbutton");
const radioPlayerDiv = document.getElementById("radioplayer");

// Globala variabler för att hålla koll på tillstånd
let allChannels = [];          // Array som lagrar alla hämtade kanaler
let currentAudio = null;       // Referens till nuvarande audio-element för uppspelning

/* ========== FUNKTIONER FÖR ATT HÄMTA DATA ========== */

/**
 * Hämtar kanaler från Sveriges Radios API
 * Denna funktion gör ett asynkront anrop till API:et och hämtar en lista med radiokanaler
 * baserat på användarens val av antal kanaler.
 */
async function fetchChannels() {
    try {
        // Hämta användarens önskade antal kanaler från input-fältet
        // Standard är 50 kanaler för att visa fler alternativ
        const maxChannels = parseInt(numRowsInput.value) || 50;
        
        // Validera att värdet är inom tillåtet intervall (1-2000)
        if (maxChannels < 1 || maxChannels > 2000) {
            showError("Antal kanaler måste vara mellan 1 och 2000");
            return;
        }
        
        // Visa laddningsmeddelande i info-området
        infoDiv.innerHTML = `<p class="message">Laddar kanaler...</p>`;
        
        // Bygg URL för API-anrop
        const url = `${API_BASE}/channels?format=json&size=${maxChannels}`;
        console.log("Hämtar kanaler från:", url);
        
        // Gör API-anrop för att hämta kanaler med fetch()
        const response = await fetch(url);
        
        console.log("Response status:", response.status);
        
        // Kontrollera om HTTP-anropet lyckades
        if (!response.ok) {
            throw new Error(`HTTP-fel! Status: ${response.status}`);
        }
        
        // Konvertera svaret från JSON-format till JavaScript-objekt
        const data = await response.json();
        console.log("Antal kanaler mottagna:", data.channels ? data.channels.length : 0);
        
        // Kontrollera att vi faktiskt fick kanaler i svaret
        if (!data.channels || data.channels.length === 0) {
            showError("Inga kanaler hittades");
            return;
        }
        
        // Spara alla kanaler i global variabel för senare användning
        allChannels = data.channels;
        
        // Visa kanalerna i navigationsmenyn
        displayChannels(data.channels);
        
        // Populera dropdown-menyn för radiospelar-funktionen
        populateChannelDropdown(data.channels);
        
        // Rensa info-området efter lyckad laddning och visa statistik
        infoDiv.innerHTML = `
            <div class="message">
                <h3>Välkommen till Sveriges Radio</h3>
                <p><strong>${data.channels.length}</strong> kanaler laddade.</p>
                <p>Klicka på en kanal i menyn till vänster för att se dagens programtablå.</p>
            </div>
        `;
        
    } catch (error) {
        // Logga felet till konsolen för felsökning
        console.error("Fel vid hämtning av kanaler:", error);
        console.error("Feltyp:", error.name);
        console.error("Felmeddelande:", error.message);
        
        // Visa specifikt felmeddelande beroende på feltyp
        if (error.name === "TypeError" && error.message.includes("fetch")) {
            showError("Kunde inte ansluta till Sveriges Radio API. Kontrollera din internetanslutning eller att API:et är tillgängligt.");
        } else {
            showError(`Kunde inte ladda kanaler. Fel: ${error.message}`);
        }
    }
}

/**
 * Hämtar programtablå för en specifik kanal
 * @param {number} channelId - ID för den valda kanalen
 * @param {string} channelName - Namnet på den valda kanalen
 */
async function fetchSchedule(channelId, channelName) {
    try {
        // Visa laddningsmeddelande medan data hämtas
        infoDiv.innerHTML = `<p class="message">Laddar programtablå för ${channelName}...</p>`;
        
        // Hämta dagens datum i formatet YYYY-MM-DD
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];
        
        console.log(`Hämtar programtablå för ${channelName} (ID: ${channelId}) för datum: ${dateString}`);
        
        // Bygg URL för API-anrop - VIKTIGT: Lägg till pagination=false för att få alla program
        const url = `${API_BASE}/scheduledepisodes?channelid=${channelId}&date=${dateString}&format=json&pagination=false`;
        console.log("Hämtar programtablå från:", url);
        
        // Gör API-anrop för att hämta dagens program för vald kanal
        const response = await fetch(url);
        
        // Kontrollera HTTP-status
        if (!response.ok) {
            throw new Error(`HTTP-fel! Status: ${response.status}`);
        }
        
        // Konvertera JSON-svar till JavaScript-objekt
        const data = await response.json();
        console.log("=== API RESPONSE ===");
        console.log("RAW data:", data);
        console.log("Schedule:", data.schedule);
        console.log("Antal program:", data.schedule ? data.schedule.length : 0);
        
        // Kolla om det finns pagination-info
        if (data.pagination) {
            console.log("Pagination info:", data.pagination);
        }
        
        // Om schedule är undefined, kolla om data finns på annan plats
        if (!data.schedule) {
            console.warn("Ingen 'schedule' property hittad. Kollar hela response-strukturen:");
            console.log("Response keys:", Object.keys(data));
        }
        
        console.log("Programtablå mottagen:");
        console.log(`- Kanal: ${channelName}`);
        console.log(`- Datum: ${dateString}`);
        console.log("===================");
        
        // Visa programtablån i info-området
        displaySchedule(data.schedule, channelName, dateString);
        
    } catch (error) {
        // Logga felet för felsökning
        console.error("Fel vid hämtning av programtablå:", error);
        
        // Visa felmeddelande till användaren
        showError(`Kunde inte ladda programtablå för ${channelName}. Försök igen senare.`);
    }
}

/* ========== FUNKTIONER FÖR ATT VISA DATA ========== */

/**
 * Visar kanaler i navigationsmenyn
 * Skapar list-element för varje kanal med title-attribut och click-event
 * @param {Array} channels - Array med kanalobjekt från API:et
 */
function displayChannels(channels) {
    // Töm befintligt innehåll i listan
    mainNavList.innerHTML = "";
    
    console.log(`Visar ${channels.length} kanaler i navigationen`);
    
    // Loopa igenom varje kanal och skapa list-element
    channels.forEach(channel => {
        // Skapa li-element
        const li = document.createElement("li");
        li.textContent = channel.name;
        
        // Lägg till title-attribut för "mouse over"-information (OBLIGATORISK FUNKTIONALITET)
        // Visar kanalnamn och tagline när användaren håller muspekaren över
        const titleText = channel.tagline ? 
            `${channel.name} - ${channel.tagline}` : 
            channel.channeltype ? 
            `${channel.name} - ${channel.channeltype}` :
            `${channel.name} - Sveriges Radio`;
        
        li.setAttribute("title", titleText);
        
        // Lägg till data-attribut för enklare felsökning
        li.dataset.channelId = channel.id;
        li.dataset.channelName = channel.name;
        
        // Lägg till click-event för att visa programtablå när användaren klickar
        li.addEventListener("click", () => {
            console.log(`Klickade på kanal: ${channel.name} (ID: ${channel.id})`);
            // Markera vald kanal visuellt
            document.querySelectorAll('#mainnavlist li').forEach(item => {
                item.style.fontWeight = 'normal';
            });
            li.style.fontWeight = 'bold';
            
            fetchSchedule(channel.id, channel.name);
        });
        
        // Lägg till list-elementet i navigationsmenyn
        mainNavList.appendChild(li);
    });
    
    console.log("Alla kanaler har lagts till i navigationen. Hovra över dem för att se mer info!");
}

/**
 * Visar programtablå för vald kanal i info-området
 * Formaterar varje program med article, h3, h4, h5 och p-taggar enligt specifikation
 * @param {Array} scheduleItems - Array med program från API:et
 * @param {string} channelName - Namnet på kanalen
 * @param {string} dateString - Datumet för programtablån
 */
function displaySchedule(scheduleItems, channelName, dateString) {
    // Töm info-området
    infoDiv.innerHTML = "";
    
    // Skapa och lägg till rubrik för programtablån
    const heading = document.createElement("h2");
    // Formatera datum till läsbart format
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('sv-SE', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    heading.textContent = `Programtablå för ${channelName}`;
    infoDiv.appendChild(heading);
    
    // Lägg till datum-info
    const dateInfo = document.createElement("p");
    dateInfo.style.fontStyle = "italic";
    dateInfo.style.marginBottom = "20px";
    dateInfo.textContent = `${formattedDate}`;
    infoDiv.appendChild(dateInfo);
    
    // Kontrollera om det finns program att visa
    if (!scheduleItems || scheduleItems.length === 0) {
        const noPrograms = document.createElement("p");
        noPrograms.className = "message";
        noPrograms.innerHTML = `
            Inga program hittades för denna kanal idag.<br><br>
            <strong>Möjliga orsaker:</strong><br>
            • Kanalen kanske inte har någon egen programtablå<br>
            • Vissa P4-kanaler delar programtablå med P4 Sveriges Radio<br>
            • API:et har inga data för detta datum<br><br>
            Prova en annan kanal, t.ex. P1, P2 eller P3.
        `;
        infoDiv.appendChild(noPrograms);
        console.log(`Inga program hittades för ${channelName}`);
        return;
    }
    
    console.log(`Visar ${scheduleItems.length} program för ${channelName}`);
    
    // Sortera program så aktuellt program visas först
    const now = new Date();
    const sortedSchedule = sortScheduleByCurrentTime(scheduleItems, now);
    
    // Loopa igenom varje program och skapa formaterad HTML
    sortedSchedule.forEach((item, index) => {
        // Skapa article-element för varje program (OBLIGATORISK FORMATERING)
        const article = document.createElement("article");
        
        // Kolla om detta är det aktuella programmet (sänds just nu)
        const startDate = parseDate(item.starttimeutc || item.starttime);
        const endDate = parseDate(item.endtimeutc || item.endtime);
        const isCurrent = startDate && endDate && now >= startDate && now < endDate;
        
        // Markera aktuellt program visuellt
        if (isCurrent) {
            article.style.backgroundColor = "#fff3cd";
            article.style.border = "2px solid #ffc107";
            article.style.borderRadius = "5px";
            article.style.padding = "10px";
        }
        
        // Titel på programmet (h3)
        const title = document.createElement("h3");
        const titleText = item.title || item.program?.name || "Utan titel";
        title.textContent = isCurrent ? `🔴 ${titleText} (SÄNDS NU)` : titleText;
        if (isCurrent) {
            title.style.color = "#d04900";
        }
        article.appendChild(title);
        
        // Undertitel (h4) - visas endast om den finns
        if (item.subtitle) {
            const subtitle = document.createElement("h4");
            subtitle.textContent = item.subtitle;
            article.appendChild(subtitle);
        }
        
        // Starttid och sluttid (h5)
        const time = document.createElement("h5");
        
        // Formatera tider - kontrollera olika fältnamn från API:et
        let startTime, endTime;
        
        if (item.starttimeutc) {
            startTime = formatTime(item.starttimeutc);
        } else if (item.starttime) {
            startTime = formatTime(item.starttime);
        } else {
            startTime = "Okänd starttid";
        }
        
        if (item.endtimeutc) {
            endTime = formatTime(item.endtimeutc);
        } else if (item.endtime) {
            endTime = formatTime(item.endtime);
        } else {
            endTime = "Okänd sluttid";
        }
        
        time.textContent = `${startTime} - ${endTime}`;
        article.appendChild(time);
        
        // Beskrivning (p) - visas endast om den finns
        if (item.description) {
            const description = document.createElement("p");
            description.textContent = item.description;
            article.appendChild(description);
        } else if (item.program && item.program.description) {
            const description = document.createElement("p");
            description.textContent = item.program.description;
            article.appendChild(description);
        }
        
        // Lägg till article-elementet i info-div
        infoDiv.appendChild(article);
    });
    
    // Lägg till sammanfattning längst ner
    const summary = document.createElement("p");
    summary.style.marginTop = "20px";
    summary.style.fontWeight = "bold";
    summary.textContent = `Totalt ${scheduleItems.length} program visas för ${channelName} idag.`;
    infoDiv.appendChild(summary);
    
    console.log(`Alla ${scheduleItems.length} program har visats!`);
}

/**
 * Sorterar programtablå så att aktuellt/kommande program visas först
 * @param {Array} scheduleItems - Array med program
 * @param {Date} currentTime - Nuvarande tid
 * @returns {Array} Sorterad array
 */
function sortScheduleByCurrentTime(scheduleItems, currentTime) {
    // Hitta index för aktuellt eller nästa program
    let currentIndex = -1;
    
    for (let i = 0; i < scheduleItems.length; i++) {
        const item = scheduleItems[i];
        const startDate = parseDate(item.starttimeutc || item.starttime);
        const endDate = parseDate(item.endtimeutc || item.endtime);
        
        if (!startDate || !endDate) continue;
        
        // Om programmet sänds just nu
        if (currentTime >= startDate && currentTime < endDate) {
            currentIndex = i;
            console.log(`Aktuellt program (${i}): ${item.title}`);
            break;
        }
        // Om programmet är nästa (startar efter nuvarande tid)
        else if (currentTime < startDate) {
            currentIndex = i;
            console.log(`Nästa program (${i}): ${item.title}`);
            break;
        }
    }
    
    // Om inget aktuellt/kommande program hittades, behåll original ordning
    if (currentIndex === -1) {
        console.log("Alla program för idag har redan sänts");
        return scheduleItems;
    }
    
    // Sortera om: aktuellt program först, sedan resten, sedan tidigare program
    const reordered = [
        ...scheduleItems.slice(currentIndex),  // Aktuellt och kommande program
        ...scheduleItems.slice(0, currentIndex)  // Program som redan sänts (sist)
    ];
    
    console.log(`Sorterade om: Börjar med program #${currentIndex}`);
    return reordered;
}

/**
 * Parsear datum från /Date()/ format eller ISO-sträng
 * @param {string} dateString - Datum i något format
 * @returns {Date|null} Parsed datum eller null
 */
function parseDate(dateString) {
    if (!dateString) return null;
    
    try {
        // Hantera /Date(milliseconds)/ format
        if (typeof dateString === 'string' && dateString.includes('/Date(')) {
            const match = dateString.match(/\/Date\((\d+)\)\//);
            if (match && match[1]) {
                return new Date(parseInt(match[1]));
            }
        }
        // Hantera vanlig sträng/nummer
        return new Date(dateString);
    } catch (error) {
        console.error("Fel vid parsing av datum:", dateString, error);
        return null;
    }
}

/**
 * Populerar dropdown-menyn med kanaler för radiospelar-funktionen (VALFRI FUNKTIONALITET)
 * Endast kanaler med live-audio läggs till
 * @param {Array} channels - Array med kanalobjekt
 */
function populateChannelDropdown(channels) {
    // Töm dropdown-menyn
    playChannelSelect.innerHTML = "";
    
    // Skapa ett standardalternativ
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Välj kanal...";
    playChannelSelect.appendChild(defaultOption);
    
    // Loopa igenom kanaler och lägg till de med live-audio
    channels.forEach(channel => {
        // Kontrollera att kanalen har en live-audio-URL
        if (channel.liveaudio && channel.liveaudio.url) {
            const option = document.createElement("option");
            option.value = channel.liveaudio.url;
            option.textContent = channel.name;
            option.dataset.channelId = channel.id;
            playChannelSelect.appendChild(option);
        }
    });
}

/* ========== HJÄLPFUNKTIONER ========== */

/**
 * Formaterar en UTC-tid till svenskt tidsformat (HH:MM)
 * @param {string|number} utcTime - Tid i UTC-format eller Unix timestamp
 * @returns {string} Formaterad tid (HH:MM)
 */
function formatTime(utcTime) {
    // Kontrollera att vi har en giltig tid
    if (!utcTime) {
        return "Okänd tid";
    }
    
    try {
        let date;
        
        // Kolla om det är i /Date(milliseconds)/ format (vanligt i SR API)
        if (typeof utcTime === 'string' && utcTime.includes('/Date(')) {
            // Extrahera millisekunder från /Date(1767567600000)/
            const match = utcTime.match(/\/Date\((\d+)\)\//);
            if (match && match[1]) {
                const milliseconds = parseInt(match[1]);
                date = new Date(milliseconds);
            } else {
                console.error("Kunde inte extrahera millisekunder från:", utcTime);
                return "Okänd tid";
            }
        }
        // Kolla om det är en Unix timestamp (nummer)
        else if (typeof utcTime === 'number') {
            date = new Date(utcTime);
        }
        // Annars försök tolka som vanlig sträng
        else {
            date = new Date(utcTime);
        }
        
        // Kontrollera att datumet är giltigt
        if (!date || isNaN(date.getTime())) {
            console.error("Ogiltigt datum efter parsing:", utcTime);
            return "Okänd tid";
        }
        
        // Formatera till svenskt tidsformat (HH:MM)
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        return `${hours}:${minutes}`;
        
    } catch (error) {
        console.error("Fel vid formatering av tid:", utcTime, error);
        return "Okänd tid";
    }
}

/**
 * Visar felmeddelande i info-området
 * @param {string} message - Felmeddelande som ska visas
 */
function showError(message) {
    infoDiv.innerHTML = `<p class="error">${message}</p>`;
}

/* ========== RADIOSPELAR-FUNKTIONER (VALFRI FUNKTIONALITET) ========== */

/**
 * Spelar upp vald radiokanal i ett audio-element
 * Stoppar tidigare uppspelning om det finns någon
 */
function playRadioChannel() {
    console.log("=== playRadioChannel() KALLAD ===");
    
    // Hämta vald URL från dropdown
    const selectedUrl = playChannelSelect.value;
    
    // Kontrollera att en kanal har valts
    if (!selectedUrl) {
        alert("Vänligen välj en kanal först!");
        return;
    }
    
    // Hämta kanalnamn för loggning
    const channelName = playChannelSelect.options[playChannelSelect.selectedIndex].text;
    console.log(`Vald kanal: ${channelName}`);
    console.log(`Stream URL: ${selectedUrl}`);
    
    // KRITISKT: Stoppa ALLA audio-element OMEDELBART (inte i timeout)
    console.log("Letar efter audio-element på sidan...");
    const allAudioElements = document.querySelectorAll('audio');
    console.log(`Hittade ${allAudioElements.length} audio-element`);
    
    // Stoppa och ta bort VARJE audio-element
    for (let i = 0; i < allAudioElements.length; i++) {
        const audio = allAudioElements[i];
        console.log(`Stoppar audio-element #${i + 1}...`);
        
        // Pausa uppspelningen
        audio.pause();
        
        // Nollställ tiden
        audio.currentTime = 0;
        
        // Ta bort src
        audio.removeAttribute('src');
        
        // Ta bort alla source-element inuti
        const sources = audio.querySelectorAll('source');
        sources.forEach(source => source.remove());
        
        // Ladda om för att frigöra resurser
        audio.load();
        
        // Ta bort från DOM
        audio.remove();
        
        console.log(`Audio-element #${i + 1} borttaget`);
    }
    
    // Nollställ global referens
    currentAudio = null;
    
    // Töm radioplayer-div
    radioPlayerDiv.innerHTML = "";
    
    // Verifiera att allt är borta
    const check = document.querySelectorAll('audio');
    console.log(`Verifiering: ${check.length} audio-element kvar (ska vara 0)`);
    
    if (check.length > 0) {
        console.error("VARNING: Det finns fortfarande audio-element kvar!");
        // Forcera bort dem
        check.forEach(a => a.remove());
    }
    
    // Skapa nytt audio-element (utan setTimeout först för att se om det hjälper)
    console.log(`Skapar nytt audio-element för ${channelName}...`);
    
    const audio = document.createElement("audio");
    audio.controls = true;
    audio.id = "radio-player";
    
    // Sätt src direkt
    audio.src = selectedUrl;
    
    // Lägg till i DOM
    radioPlayerDiv.appendChild(audio);
    
    // Spara referens
    currentAudio = audio;
    
    console.log("Nytt audio-element skapat");
    console.log(`Totalt antal audio-element nu: ${document.querySelectorAll('audio').length}`);
    
    // Starta uppspelning
    audio.play().then(() => {
        console.log(`✓ Spelar nu: ${channelName}`);
    }).catch(error => {
        console.error("Kunde inte starta uppspelning:", error);
    });
    
    // Event listener för att verifiera uppspelning
    audio.addEventListener("playing", () => {
        console.log(`▶ ${channelName} spelar`);
    });
    
    audio.addEventListener("pause", () => {
        console.log(`⏸ ${channelName} pausad`);
    });
    
    audio.addEventListener("error", (e) => {
        console.error("❌ Fel vid uppspelning:", e);
        radioPlayerDiv.innerHTML = `<p class="error">Kunde inte spela upp ${channelName}.</p>`;
    });
}

/* ========== EVENT LISTENERS ========== */

/**
 * Event listener för att uppdatera antal kanaler när användaren ändrar värdet
 * Hämtar ny lista med kanaler baserat på det nya värdet
 */
numRowsInput.addEventListener("change", () => {
    fetchChannels();
});

/**
 * Event listener för Enter-tangent i numrows input
 * Tillåter användaren att trycka Enter istället för att klicka utanför fältet
 */
numRowsInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        fetchChannels();
    }
});

/**
 * Event listener för play-knappen (VALFRI FUNKTIONALITET)
 * Startar uppspelning av vald radiokanal
 */
playButton.addEventListener("click", () => {
    playRadioChannel();
});

/* ========== INITIERING ========== */

/**
 * Initierar applikationen när DOM:en är helt laddad
 * Hämtar och visar kanaler automatiskt
 */
window.addEventListener("DOMContentLoaded", () => {
    console.log("Sveriges Radio-applikationen startar...");
    console.log("API Base URL:", API_BASE);
    
    // Sätt standardvärde för antal kanaler (10 för de första kanalerna)
    numRowsInput.value = 10;
    
    console.log("Antal kanaler att hämta:", numRowsInput.value);
    
    // Hämta kanaler när sidan laddas
    fetchChannels();
});
