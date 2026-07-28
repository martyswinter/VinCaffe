// Google Sheets ID a rozsah
const SHEET_ID = '1oC8J34A4j3nUnX7MUZXyRYEUhTZeS-H7vHcte0B_i_Y';
const SHEET_NAME = 'Menu';
const SHEET_RANGE = 'A:E'; // Všechny sloupce od A do E

// URL pro načtení dat z Google Sheets jako CSV
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/query?tqx=out:csv&range=${SHEET_NAME}!${SHEET_RANGE}`;

// Funkce na načtení a zpracování dat
async function loadMenuFromSheets() {
    try {
        const response = await fetch(CSV_URL);
        const csvText = await response.text();

        // Rozdělíme CSV na řádky
        const lines = csvText.trim().split('\n');

        // Přeskočíme první řádek (nadpisy)
        const daysData = lines.slice(1);

        // Mapování dní na ID
        const daysMap = {
            'Pondělí': 'po',
            'Úterý': 'ut',
            'Středa': 'st',
            'Čtvrtek': 'ct',
            'Pátek': 'pa'
        };

        // Procházíme každý den
        daysData.forEach((line, index) => {
            const [den, datum, polEvka, jidlo1, jidlo2] = line.split(',').map(item => item.trim());

            if (den && daysMap[den]) {
                const dayCode = daysMap[den];

                // Aktualizujeme nadpis s datem
                const dayHeader = document.getElementById(`day-${dayCode}`);
                if (dayHeader && datum) {
                    dayHeader.textContent = `${den} ${datum}`;
                }

                // Aktualizujeme jídla
                if (polEvka) document.getElementById(`${dayCode}-soup`).textContent = polEvka;
                if (jidlo1) document.getElementById(`${dayCode}-main1`).textContent = jidlo1;
                if (jidlo2) document.getElementById(`${dayCode}-main2`).textContent = jidlo2;
            }
        });

        console.log('Menu úspěšně načteno z Google Sheets!');
    } catch (error) {
        console.error('Chyba při načítání menu:', error);
    }
}

// Funkce na výpočet času do příštího intervalu (každých 30 minut mezi 8:00-11:00 CET)
function getTimeUntilNextMenuLoad() {
    const now = new Date();
    const czechTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Prague' }));

    const currentHour = czechTime.getHours();
    const currentMinutes = czechTime.getMinutes();

    // Pokud je před 8:00, nastavíme na 8:00
    if (currentHour < 8) {
        const nextLoad = new Date(czechTime);
        nextLoad.setHours(8, 0, 0, 0);
        return nextLoad - czechTime;
    }

    // Pokud je po 11:00, nastavíme na zítřek v 8:00
    if (currentHour >= 11) {
        const nextLoad = new Date(czechTime);
        nextLoad.setDate(nextLoad.getDate() + 1);
        nextLoad.setHours(8, 0, 0, 0);
        return nextLoad - czechTime;
    }

    // Pokud je mezi 8:00-11:00, spočítáme příští interval (každých 30 minut)
    const minutesInHour = currentMinutes;
    const nextIntervalMinutes = Math.ceil(minutesInHour / 30) * 30;

    const nextLoad = new Date(czechTime);
    nextLoad.setMinutes(nextIntervalMinutes, 0, 0);

    // Pokud se dostaneme přes 11:00, nastavíme na zítřek v 8:00
    if (nextLoad.getHours() >= 11) {
        nextLoad.setDate(nextLoad.getDate() + 1);
        nextLoad.setHours(8, 0, 0, 0);
    }

    return nextLoad - czechTime;
}

// Funkce na plánování načítání každých 30 minut mezi 8:00-11:00 CET
function scheduleMenuLoad() {
    const timeUntilNextLoad = getTimeUntilNextMenuLoad();
    const minutesUntil = Math.floor(timeUntilNextLoad / 1000 / 60);

    console.log(`Menu se nahraje za ${minutesUntil} minut`);

    // Nastavíme timeout na příští interval
    setTimeout(() => {
        loadMenuFromSheets();
        scheduleMenuLoad(); // Rekurzivně nastavíme další interval
    }, timeUntilNextLoad);
};

    // Nastavíme timeout na příští 8:00
    setTimeout(() => {
        loadMenuFromSheets();

        // Pak nastavíme opakování každých 24 hodin
        setInterval(loadMenuFromSheets, 24 * 60 * 60 * 1000);
    }, timeUntilNext8AM);
}

// Načteme menu hned při otevření stránky + nastavíme automatické načítání
document.addEventListener('DOMContentLoaded', () => {
    loadMenuFromSheets(); // Hned loadujeme
    scheduleMenuLoad();   // A nastavíme automatické načítání v 8:00 CET
});

/* ====================================
   BURGER MENU - MOBILE NAVIGATION
   ==================================== */

const burgerMenu = document.querySelector('.burger-menu');
const navLinks = document.querySelector('.nav-links');

if (burgerMenu) {
    burgerMenu.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        burgerMenu.classList.toggle('active');
    });
}

// Zavři menu když se klikne na odkaz
const navButtons = navLinks.querySelectorAll('button');
navButtons.forEach(button => {
    button.addEventListener('click', () => {
        navLinks.classList.remove('active');
        burgerMenu.classList.remove('active');
    });
});