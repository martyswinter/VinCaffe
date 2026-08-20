// ====================================
// GOOGLE SHEETS MENU
// ====================================

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTkGElCHPPqJQFdspzR4c6oNZUYUxIQtgMdRucloCUfnqZ8wFI2Xk4MAWq4gPcotrlB9WczAl9wM1rf/pub?output=csv';

const BRUNCH_CSV_URL =
    'https://docs.google.com/spreadsheets/d/1oC8J34A4j3nUnX7MUZXyRYEUhTZeS-H7vHcte0B_i_Y/export?format=csv&gid=1109883270';

// ====================================
// MENU CAROUSEL GOOGLE SHEETS
// ====================================

const MENU_CAROUSEL_CSV =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vTkGElCHPPqJQFdspzR4c6oNZUYUxIQtgMdRucloCUfnqZ8wFI2Xk4MAWq4gPcotrlB9WczAl9wM1rf/pub?gid=1118662332&single=true&output=csv';


// ====================================
// EVENTS GOOGLE SHEETS
// ====================================

const EVENTS_CSV_URL =
    'https://docs.google.com/spreadsheets/d/1oC8J34A4j3nUnX7MUZXyRYEUhTZeS-H7vHcte0B_i_Y/export?format=csv&gid=796512486';


    // ====================================
// TIMEZONE HELPER
// ====================================

function getCzechTime() {

    return new Date(
        new Date().toLocaleString("en-US", {
            timeZone: "Europe/Prague"
        })
    );

}

// ====================================
// FETCH WITH RETRY
// ====================================

async function fetchWithRetry(url, retries = 3) {

    for (let attempt = 1; attempt <= retries; attempt++) {

        try {

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP chyba: ${response.status}`);
            }

            return response;

        } catch (error) {

            console.warn(
                `Pokus ${attempt}/${retries} selhal:`,
                error
            );

            if (attempt === retries) {
                throw error;
            }

            await new Promise(resolve =>
                setTimeout(resolve, attempt * 2000)
            );
        }
    }
}


// ====================================
// LOAD MENU FROM GOOGLE SHEETS
// ====================================

async function loadMenuFromSheets() {

    try {

        const response = await fetchWithRetry(CSV_URL);
        const csvText = await response.text();

        const rows =
            parseCSV(csvText);

        const daysData =
            rows.slice(1);

        const daysMap = {
            "Pondělí": "po",
            "Úterý": "ut",
            "Středa": "st",
            "Čtvrtek": "ct",
            "Pátek": "pa"
        };


        daysData.forEach(row => {

            const [
                den,
                datum,
                polEvka,
                jidlo1,
                jidlo2
            ] = row;


            if (!daysMap[den]) return;


            const dayCode = daysMap[den];


            const dayHeader =
                document.getElementById(`day-${dayCode}`);


            if (dayHeader && datum) {

                dayHeader.textContent =
                    `${den} ${datum}`;

            }


            const soupElement =
                document.getElementById(`${dayCode}-soup`);

            const main1Element =
                document.getElementById(`${dayCode}-main1`);

            const main2Element =
                document.getElementById(`${dayCode}-main2`);


            if (soupElement && polEvka) {
                soupElement.textContent = polEvka;
            }


            if (main1Element && jidlo1) {
                main1Element.textContent = jidlo1;
            }


            if (main2Element && jidlo2) {
                main2Element.textContent = jidlo2;
            }

        });


        console.log("Menu načteno z Google Sheets");


    } catch (error) {

        console.error(
            "Chyba při načítání menu:",
            error
        );

    }

}


// ====================================
// LOAD BRUNCH FROM GOOGLE SHEETS
// ====================================

async function loadBrunchFromSheets() {

    try {

        const response =
            await fetchWithRetry(BRUNCH_CSV_URL);

        const csvText =
            await response.text();


        // ====================================
        // CSV PARSING
        // zvládne čárky i zalomení řádků
        // ====================================

        const rows =
            parseCSV(csvText);


        // přeskočíme první řádek s názvem
        // Sobota & Neděle
        const brunchItems =
            rows.slice(1, 4);


        brunchItems.forEach((row, index) => {

            const text =
                row[1]?.trim() || "";


            const element =
                document.getElementById(
                    `brunch-main${index + 1}`
                );


            if (element) {

                element.textContent =
                    text;

            }

        });


        console.log(
            "Brunch menu načteno"
        );


    } catch (error) {

        console.error(
            "Chyba při načítání brunch menu:",
            error
        );

    }

}

// ====================================
// MENU SWITCH
// Pá 16:00 → Ne 16:00 brunch
// Ne 16:00 → Pá 16:00 týdenní menu
// ====================================

function isWeekendMenu() {

    const now = getCzechTime();

    const day = now.getDay();
    const hour = now.getHours();

    return (
        (day === 5 && hour >= 16) ||
        day === 6 ||
        (day === 0 && hour < 16)
    );
}


function updateVisibleMenu() {

    const weekly = document.getElementById("weekly-menu");
    const weekend = document.getElementById("weekend-menu");

    if (!weekly || !weekend) {
        console.log("Menu element nenalezen");
        return;
    }

    if (isWeekendMenu()) {

        weekly.classList.remove("visible-menu");
        weekly.classList.add("hidden-menu");

        weekend.classList.remove("hidden-menu");
        weekend.classList.add("visible-menu");

    } else {

        weekend.classList.remove("visible-menu");
        weekend.classList.add("hidden-menu");

        weekly.classList.remove("hidden-menu");
        weekly.classList.add("visible-menu");
    }
}


// ====================================
// NAČTENÍ AKTIVNÍHO MENU
// ====================================

async function loadActiveMenu() {

    if (isWeekendMenu()) {
        await loadBrunchFromSheets();
    } else {
        await loadMenuFromSheets();
    }
}


// ====================================
// NEXT MENU SWITCH CALCULATION
// ====================================

function getNextMenuSwitch() {

    const now = getCzechTime();
    const next = new Date(now);

    const day = now.getDay();
    const hour = now.getHours();

    // pátek po 16, sobota, neděle před 16
    if (
        (day === 5 && hour >= 16) ||
        day === 6 ||
        (day === 0 && hour < 16)
    ) {

        const days =
            day === 0
                ? 0
                : 7 - day;

        next.setDate(
            now.getDate() + days
        );

        next.setHours(
            16,
            0,
            0,
            0
        );
    }

    // neděle po 16
    else if (day === 0) {

        next.setDate(
            now.getDate() + 5
        );

        next.setHours(
            16,
            0,
            0,
            0
        );
    }

    // pondělí až čtvrtek
    else {

        next.setDate(
            now.getDate() + (5 - day)
        );

        next.setHours(
            16,
            0,
            0,
            0
        );
    }

    return next;
}


function scheduleMenuSwitch() {

    const delay =
        getNextMenuSwitch().getTime()
        -
        getCzechTime().getTime();

    console.log(
        "Další přepnutí menu:",
        getNextMenuSwitch()
    );

    setTimeout(async () => {

        updateVisibleMenu();

        await loadActiveMenu();

        scheduleMenuSwitch();

    }, delay);
}


// ====================================
// MENU DATA AUTO UPDATE
// 8:00 - 11:00 každých 30 minut
// ====================================

function getTimeUntilNextMenuLoad() {

    const now = getCzechTime();

    const hour = now.getHours();
    const minutes = now.getMinutes();

    const next = new Date(now);


    // před 8:00 → dnes v 8:00
    if (hour < 8) {

        next.setHours(
            8,
            0,
            0,
            0
        );

        return next - now;
    }


    // od 11:00 → zítra v 8:00
    if (hour >= 11) {

        next.setDate(
            now.getDate() + 1
        );

        next.setHours(
            8,
            0,
            0,
            0
        );

        return next - now;
    }


    // 8:00–10:59
    // vždy nejbližší BUDOUCÍ půlhodina

    if (minutes < 30) {

        next.setMinutes(
            30,
            0,
            0
        );

    } else {

        next.setHours(
            hour + 1,
            0,
            0,
            0
        );
    }

    return next - now;
}


function scheduleMenuLoad() {

    const delay =
        getTimeUntilNextMenuLoad();

    setTimeout(async () => {

        await loadActiveMenu();

        scheduleMenuLoad();

    }, delay);
}


// ====================================
// NAVBAR – SCROLL NAVIGACE
// ====================================

function initMenuNavigation() {

    const menuButton = document.querySelector(".nav-links .btn-tonal");
    const contactButton = document.querySelector(".nav-links .btn-outlined");

    const menuSection = document.getElementById("menu-carousel-section");
    const contactSection = document.getElementById("contact");

    const navbar = document.querySelector(".navbar");

    if (!navbar) {
        console.error("Navbar nebyl nalezen.");
        return;
    }


    // MENU

    if (menuButton && menuSection) {

        menuButton.addEventListener("click", () => {

            const navbarHeight = navbar.offsetHeight;

            const targetPosition =
                menuSection.getBoundingClientRect().top +
                window.scrollY -
                navbarHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: "smooth"
            });

        });

    }


    // KONTAKT

    if (contactButton && contactSection) {

        contactButton.addEventListener("click", () => {

            const navbarHeight = navbar.offsetHeight;

            const targetPosition =
                contactSection.getBoundingClientRect().top +
                window.scrollY -
                navbarHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: "smooth"
            });

        });

    }

}

// ====================================
// LOAD MENU CAROUSEL
// ====================================

async function loadMenuCarousel() {

    const carousel =
        document.getElementById("menuCarousel");

    const loading =
        document.getElementById("menuLoading");

    const loadingText =
        loading?.querySelector(".menu-loading-text");

    const spinner =
        loading?.querySelector(".menu-spinner");

    const errorMessage =
        document.getElementById("menuError");


    // --------------------------------
    // KONTROLA CAROUSELU
    // --------------------------------

    if (!carousel) {

        console.error(
            "Nenalezen element #menuCarousel"
        );

        return;
    }


    try {

        // --------------------------------
        // ZOBRAZIT LOADING
        // --------------------------------

        if (loading) {
            loading.style.display = "flex";
        }

        if (spinner) {
            spinner.style.display = "block";
        }

        if (loadingText) {
            loadingText.style.display = "block";
        }

        if (errorMessage) {
            errorMessage.style.display = "none";
        }


        // --------------------------------
        // NAČTENÍ CSV
        // --------------------------------

        const response =
            await fetchWithRetry(MENU_CAROUSEL_CSV);

        if (!response.ok) {

            throw new Error(
                `HTTP chyba: ${response.status}`
            );

        }


        const csv =
            await response.text();


        console.log(
            "MENU CAROUSEL CSV:"
        );

        console.log(csv);


        // --------------------------------
        // ZPRACOVÁNÍ CSV
        // --------------------------------

        const rows = csv
            .trim()
            .split("\n")
            .slice(1);


        // --------------------------------
        // ODSTRANIT STARÉ SLIDES
        // --------------------------------

        carousel
            .querySelectorAll(".menu-slide")
            .forEach(slide => {

                slide.remove();

            });


        // --------------------------------
        // VYTVOŘENÍ SLIDES
        // --------------------------------

        const imagePromises = [];


        rows.forEach(row => {

            const [
                fileName,
                fileId,
                active
            ] = row
                .split(",")
                .map(item => item.trim());


            console.log(
                "Carousel položka:",
                fileName,
                fileId,
                active
            );


            // --------------------------------
            // POUZE AKTIVNÍ OBRÁZKY
            // --------------------------------

            if (
                active?.toLowerCase() === "ano" &&
                fileId
            ) {


                const imageUrl =
                    `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;


                // --------------------------------
                // SLIDE
                // --------------------------------

                const slide =
                    document.createElement("div");

                slide.className =
                    "menu-slide";


                // --------------------------------
                // IMAGE
                // --------------------------------

                const image =
                    document.createElement("img");


                image.src =
                    imageUrl;


                image.alt =
                    fileName || "Menu";


                // --------------------------------
                // POČKAT NA OBRÁZEK
                // --------------------------------

                const imagePromise =
                    new Promise((resolve, reject) => {


                        image.onload =
                            () => {

                                resolve();

                            };


                        image.onerror =
                            () => {

                                reject(
                                    new Error(
                                        `Nepodařilo se načíst obrázek: ${fileName || fileId}`
                                    )
                                );

                            };

                    });


                imagePromises.push(
                    imagePromise
                );


                slide.appendChild(image);

                carousel.appendChild(slide);

            }

        });


        // --------------------------------
        // POČKAT NA VŠECHNY OBRÁZKY
        // --------------------------------

        await Promise.all(
            imagePromises
        );


        // --------------------------------
        // KONTROLA, JESTLI EXISTUJE MENU
        // --------------------------------

        const slides =
            carousel.querySelectorAll(
                ".menu-slide"
            );


        if (slides.length === 0) {

            throw new Error(
                "Nebyly nalezeny žádné aktivní položky menu."
            );

        }


        // --------------------------------
        // SKRÝT LOADING
        // --------------------------------

        if (loading) {
            loading.style.display = "none";
        }


        console.log(
            "Menu carousel úspěšně načten."
        );


        // --------------------------------
        // INICIALIZACE CAROUSELU
        // --------------------------------

        initMenuCarouselControls();


    } catch (error) {


        // --------------------------------
        // LOG CHYBY
        // --------------------------------

        console.error(
            "Chyba při načítání menu carouselu:",
            error
        );


        // --------------------------------
        // SKRÝT SPINNER
        // --------------------------------

        if (spinner) {
            spinner.style.display = "none";
        }

        if (loadingText) {
            loadingText.style.display = "none";
        }


        // --------------------------------
        // ZOBRAZIT ERROR
        // --------------------------------

        if (loading) {
            loading.style.display = "flex";
        }

        if (errorMessage) {
            errorMessage.style.display = "flex";
        }

    }

}


// ====================================
// RETRY BUTTON
// ====================================

const menuRetry =
    document.getElementById("menuRetry");


if (menuRetry) {

    menuRetry.addEventListener(
        "click",
        () => {

            loadMenuCarousel();

        }
    );

}


// ====================================
// MENU CAROUSEL CONTROLS
// ====================================

function initMenuCarouselControls() {

    const wrapper =
        document.querySelector(".menu-carousel-wrapper");

    if (!wrapper) {
        console.error("Nenalezen menu carousel wrapper");
        return;
    }

    const carousel =
        wrapper.querySelector(".menu-carousel");

    const prevButton =
        wrapper.querySelector(".carousel-prev");

    const nextButton =
        wrapper.querySelector(".carousel-next");

    const dotsContainer =
        document.querySelector(".carousel-dots");


    if (!carousel || !prevButton || !nextButton) {
        console.error(
            "Carousel tlačítka nebo obsah nenalezen"
        );
        return;
    }


    // ====================================
    // VYTVOŘENÍ TEČEK
    // ====================================

    const slides =
        carousel.querySelectorAll(".menu-slide");

    if (dotsContainer) {

        dotsContainer.innerHTML = "";

        slides.forEach((slide, index) => {

            const dot =
                document.createElement("button");

            dot.className = "carousel-dot";

            dot.type = "button";

            dot.setAttribute(
                "aria-label",
                `Zobrazit menu ${index + 1}`
            );

            if (index === 0) {
                dot.classList.add("active");
            }

            dot.addEventListener("click", () => {

                carousel.scrollTo({
                    left: index * carousel.clientWidth,
                    behavior: "smooth"
                });

            });

            dotsContainer.appendChild(dot);

        });

    }


    // ====================================
    // NEXT
    // ====================================

    nextButton.addEventListener("click", () => {

        carousel.scrollBy({
            left: carousel.clientWidth,
            behavior: "smooth"
        });

    });


    // ====================================
    // PREVIOUS
    // ====================================

    prevButton.addEventListener("click", () => {

        carousel.scrollBy({
            left: -carousel.clientWidth,
            behavior: "smooth"
        });

    });


    // ====================================
    // AKTIVNÍ TEČKA PŘI SCROLLU
    // ====================================

    carousel.addEventListener("scroll", () => {

        if (!dotsContainer) return;

        const dots =
            dotsContainer.querySelectorAll(".carousel-dot");

        if (!dots.length) return;

        const index =
            Math.round(
                carousel.scrollLeft / carousel.clientWidth
            );

        dots.forEach((dot, dotIndex) => {

            dot.classList.toggle(
                "active",
                dotIndex === index
            );

        });

    });


    console.log(
        "Menu carousel ovládání aktivní"
    );

}

// ====================================
// BURGER MENU
// ====================================


function initBurgerMenu() {


    const burger =
        document.querySelector(".burger-menu");


    const menu =
        document.querySelector(".nav-links");



    if (!burger || !menu) return;



    burger.addEventListener(
        "click",
        () => {

            menu.classList.toggle("open");

            burger.classList.toggle("active");

        }
    );



    menu
        .querySelectorAll("a, button")
        .forEach(link => {


            link.addEventListener(
                "click",
                () => {

                    menu.classList.remove("open");

                    burger.classList.remove("active");

                }
            );


        });



    document.addEventListener(
        "click",
        event => {


            if (

                menu.classList.contains("open") &&
                !menu.contains(event.target) &&
                !burger.contains(event.target)

            ) {


                menu.classList.remove("open");

                burger.classList.remove("active");


            }


        }
    );


}

// ====================================
// BOOKING MODAL
// ====================================

function initBookingModal() {

    const openButton =
        document.getElementById("bookingButton");

    const modal =
        document.getElementById("bookingModal");

    const closeButton =
        document.getElementById("bookingModalClose");

    const cancelButton =
        document.getElementById("bookingCancel");

    const backdrop =
        modal?.querySelector(".booking-modal-backdrop");

    const successCloseButton =
        document.getElementById("bookingSuccessClose");


    if (!openButton || !modal || !closeButton) {

        console.error(
            "Booking modal elementy nebyly nalezeny."
        );

        return;
    }


    // OTEVŘENÍ MODALU

    function openModal() {

        modal.classList.add("open");

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        // zabrání scrollování stránky pod modalem
        document.body.style.overflow = "hidden";

        // přesune focus na zavírací tlačítko
        closeButton.focus();
    }


    // ZAVŘENÍ MODALU

    function closeModal() {

        modal.classList.remove("open");

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.style.overflow = "";

        const bookingForm =
            document.getElementById("booking-form");

        const bookingSuccess =
            document.getElementById("bookingSuccess");

        if (bookingSuccess) {
            bookingSuccess.classList.remove("active");
        }

        if (bookingForm) {
            bookingForm.style.display = "";
            bookingForm.reset();

            bookingForm
                .querySelectorAll(".booking-field.has-error")
                .forEach(
                    field => field.classList.remove("has-error")
                );
        }

        openButton.focus();
    }


    // KLIK NA REZERVACE

    openButton.addEventListener(
        "click",
        openModal
    );


    // KŘÍŽEK

    closeButton.addEventListener(
        "click",
        closeModal
    );

    // ====================================
    // VALIDACE INPUTŮ - MODAL REZERVACE
    // ====================================

    const bookingForm = document.getElementById("booking-form");

    const bookingName = document.getElementById("bookingName");
    const bookingEmail = document.getElementById("bookingEmail");
    const bookingPhone = document.getElementById("bookingPhone");

    const bookingSuccess = document.getElementById("bookingSuccess");


    // JMÉNO
    function validateName() {

        const field = bookingName.closest(".booking-field");

        if (bookingName.validity.valid) {
            field.classList.remove("has-error");
            return true;
        }

        field.classList.add("has-error");
        return false;
    }


    // EMAIL
    function validateEmail() {

        const field = bookingEmail.closest(".booking-field");

        if (bookingEmail.validity.valid) {
            field.classList.remove("has-error");
            return true;
        }

        field.classList.add("has-error");
        return false;
    }


    // TELEFON
    function validatePhone() {

        const field = bookingPhone.closest(".booking-field");

        if (bookingPhone.validity.valid) {
            field.classList.remove("has-error");
            return true;
        }

        field.classList.add("has-error");
        return false;
    }


    // VALIDACE PO OPUŠTĚNÍ POLE
    bookingName.addEventListener("blur", validateName);
    bookingEmail.addEventListener("blur", validateEmail);
    bookingPhone.addEventListener("blur", validatePhone);


    // VALIDACE PŘI ODESLÁNÍ + SUCCESS STATE
    bookingForm.addEventListener("submit", async event => {

        event.preventDefault();

        const nameValid = validateName();
        const emailValid = validateEmail();
        const phoneValid = validatePhone();

        if (!nameValid || !emailValid || !phoneValid) {

            if (!nameValid) {
                bookingName.focus();
                return;
            }

            if (!emailValid) {
                bookingEmail.focus();
                return;
            }

            if (!phoneValid) {
                bookingPhone.focus();
                return;
            }
        }

        // ====================================
        // FORMULÁŘ JE VALIDNÍ
        // RECAPTCHA + ODESLÁNÍ NA SERVER
        // ====================================

        try {

            const token = await grecaptcha.execute(
                "6LfGVo4tAAAAAI7NFKP_dm9ECaaM0hG5uUfDMp_7",
                {
                    action: "booking"
                }
            );

            const recaptchaToken =
                document.getElementById("recaptchaToken");

            if (!recaptchaToken) {
                throw new Error("Nenalezeno pole recaptchaToken.");
            }

            recaptchaToken.value = token;


            const formData =
                new FormData(bookingForm);


            const response =
                await fetch("send-booking.php", {
                    method: "POST",
                    body: formData
                });


            const result =
                await response.json();


            if (!response.ok || !result.success) {

                throw new Error(
                    result.message ||
                    "Rezervaci se nepodařilo odeslat."
                );
            }


            // SUCCESS
            bookingForm.style.display = "none";
            bookingSuccess.classList.add("active");


        } catch (error) {

            console.error(
                "Chyba při odesílání rezervace:",
                error
            );

            alert(
                "Rezervaci se nepodařilo odeslat. Zkuste to prosím znovu."
            );
        }

    });

    // TLAČÍTKO ZRUŠIT

    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeModal
        );

    }

    // ZAVŘENÍ PO ÚSPĚŠNÉM ODESLÁNÍ

    if (successCloseButton) {

        successCloseButton.addEventListener(
            "click",
            closeModal
        );

    }

    // KLIK MIMO MODAL

    if (backdrop) {

        backdrop.addEventListener(
            "click",
            closeModal
        );

    }


    // ESC

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                modal.classList.contains("open")
            ) {

                closeModal();

            }

        }
    );

}

// ====================================
// CSV PARSER
// zvládne čárky i zalomení řádků
// uvnitř buněk v uvozovkách
// ====================================

function parseCSV(csvText) {

    const rows = [];

    let row = [];
    let field = "";
    let insideQuotes = false;

    for (let i = 0; i < csvText.length; i++) {

        const char = csvText[i];
        const nextChar = csvText[i + 1];


        // UVOZOVKY
        if (char === '"') {

            // zdvojené uvozovky uvnitř hodnoty
            if (insideQuotes && nextChar === '"') {

                field += '"';
                i++;

            } else {

                insideQuotes = !insideQuotes;

            }

        }


        // ČÁRKA = nový sloupec
        else if (char === "," && !insideQuotes) {

            row.push(field.trim());
            field = "";

        }


        // NOVÝ ŘÁDEK = nový řádek tabulky
        else if (
            (char === "\n" || char === "\r") &&
            !insideQuotes
        ) {

            // Windows CRLF
            if (char === "\r" && nextChar === "\n") {
                i++;
            }

            row.push(field.trim());
            field = "";

            if (
                row.some(value => value !== "")
            ) {
                rows.push(row);
            }

            row = [];

        }


        // OBSAH BUŇKY
        else {

            field += char;

        }

    }


    // POSLEDNÍ HODNOTA
    if (field !== "" || row.length > 0) {

        row.push(field.trim());

        if (
            row.some(value => value !== "")
        ) {
            rows.push(row);
        }

    }


    return rows;
}


// ====================================
// LOAD EVENTS FROM GOOGLE SHEETS
// ====================================

async function loadEventsFromSheets() {

    const eventsList =
        document.getElementById("eventsList");

    if (!eventsList) {
        return;
    }

    try {

        const response =
            await fetchWithRetry(EVENTS_CSV_URL);

        const csvText =
            await response.text();

        const lines =
            csvText
                .trim()
                .split(/\r?\n/);

        // přeskočí hlavičku
        const rows =
            lines.slice(1);

        eventsList.innerHTML = "";

        let visibleEvents = 0;


        rows.forEach(row => {

            if (!row.trim()) {
                return;
            }

            const [
                title,
                description,
                visible
            ] = parseCSVLine(row);


            // pouze řádky s "ano" ve sloupci C
            if (
                visible?.trim().toLowerCase() !== "ano"
            ) {
                return;
            }


            visibleEvents++;


            const eventItem =
                document.createElement("div");

            eventItem.className =
                "event-item";


            if (title) {

                const eventTitle =
                    document.createElement("h3");

                eventTitle.textContent =
                    title;

                eventItem.appendChild(
                    eventTitle
                );
            }


            if (description) {

                const eventDescription =
                    document.createElement("p");

                eventDescription.textContent =
                    description;

                eventItem.appendChild(
                    eventDescription
                );
            }


            eventsList.appendChild(
                eventItem
            );

        });


        // ====================================
        // ŽÁDNÁ AKTIVNÍ AKCE
        // ====================================

        if (visibleEvents === 0) {

            const emptyMessage =
                document.createElement("p");

            emptyMessage.className =
                "events-empty";

            emptyMessage.textContent =
                "Zatím plánujeme další super akci, buďte trpěliví :)";

            eventsList.appendChild(
                emptyMessage
            );
        }


        console.log(
            "Akce načteny z Google Sheets"
        );


    } catch (error) {

        console.error(
            "Chyba při načítání akcí:",
            error
        );

        eventsList.innerHTML = "";

        const errorMessage =
            document.createElement("p");

        errorMessage.className =
            "events-empty";

        errorMessage.textContent =
            "Zatím plánujeme další super akci, buďte trpěliví :)";

        eventsList.appendChild(
            errorMessage
        );
    }
}



// ====================================
// INITIALIZATION
// ====================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        // ====================================
        // INTERAKTIVNÍ PRVKY HNED
        // ====================================

        initBurgerMenu();
        initMenuNavigation();
        initBookingModal();
        initMenuCarouselControls();


        // ====================================
        // MENU - ROZHODNUTÍ CO ZOBRAZIT
        // ====================================

        updateVisibleMenu();


        // ====================================
        // DATA Z GOOGLE SHEETS
        // ====================================

        await loadActiveMenu();


        // malá prodleva, aby Google nedostal
        // více požadavků současně

        await new Promise(resolve =>
            setTimeout(resolve, 500)
        );


        // stálé menu z Google Drive
        // momentálně vypnuto

        // await loadMenuCarousel();


        // akce z Google Sheets

        await loadEventsFromSheets();


        // ====================================
        // AUTOMATICKÉ AKTUALIZACE
        // ====================================

        scheduleMenuLoad();
        scheduleMenuSwitch();

    }
);