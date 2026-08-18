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
// LOAD MENU FROM GOOGLE SHEETS
// ====================================

async function loadMenuFromSheets() {

    try {

        const response = await fetch(CSV_URL);
        const csvText = await response.text();

        const lines = csvText.trim().split("\n");

        const daysData = lines.slice(1);


        const daysMap = {

            "Pondělí": "po",
            "Úterý": "ut",
            "Středa": "st",
            "Čtvrtek": "ct",
            "Pátek": "pa"

        };


        daysData.forEach(line => {

            const [
                den,
                datum,
                polEvka,
                jidlo1,
                jidlo2
            ] = line.split(",").map(item => item.trim());


            if (!daysMap[den]) return;


            const dayCode = daysMap[den];


            const dayHeader =
                document.getElementById(`day-${dayCode}`);


            if (dayHeader && datum) {

                dayHeader.textContent =
                    `${den} ${datum}`;

            }


            if (polEvka) {

                document.getElementById(
                    `${dayCode}-soup`
                ).textContent = polEvka;

            }


            if (jidlo1) {

                document.getElementById(
                    `${dayCode}-main1`
                ).textContent = jidlo1;

            }


            if (jidlo2) {

                document.getElementById(
                    `${dayCode}-main2`
                ).textContent = jidlo2;

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

async function loadBrunchFromSheets() {

    try {

        const response = await fetch(BRUNCH_CSV_URL);
        const csvText = await response.text();

        const lines = csvText.trim().split('\n');


        // přeskočíme první řádek s názvem Sobota & Neděle
        const brunchItems = lines.slice(1, 4);


        brunchItems.forEach((line, index) => {

            // rozdělíme pouze na první čárce
            const parts = line.split(/,(.+)/);

            const text = parts[1]
                ? parts[1].replace(/^"|"$/g, '').trim()
                : "";


            const element = document.getElementById(
                `brunch-main${index + 1}`
            );


            if (element) {
                element.textContent = text;
            }

        });


        console.log("Brunch menu načteno");

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



    setTimeout(() => {


        updateVisibleMenu();

        scheduleMenuSwitch();


    }, delay);


}



// ====================================
// MENU DATA AUTO UPDATE
// 8:00 - 11:00 každých 30 minut
// ====================================


function getTimeUntilNextMenuLoad() {


    const now = getCzechTime();


    const hour =
        now.getHours();


    const minutes =
        now.getMinutes();



    if (hour < 8) {


        const next = new Date(now);

        next.setHours(
            8,
            0,
            0,
            0
        );


        return next - now;


    }



    if (hour >= 11) {


        const next = new Date(now);


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



    const next = new Date(now);


    next.setMinutes(
        Math.ceil(minutes / 30) * 30,
        0,
        0
    );


    return next - now;


}



function scheduleMenuLoad() {


    setTimeout(() => {


        loadMenuFromSheets();

        scheduleMenuLoad();


    }, getTimeUntilNextMenuLoad());


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
            await fetch(MENU_CAROUSEL_CSV);


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
// INITIALIZATION
// ====================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadMenuFromSheets();

        loadMenuCarousel();

        initMenuCarouselControls();

        updateVisibleMenu();

        scheduleMenuLoad();

        scheduleMenuSwitch();

        initBurgerMenu();

        initMenuNavigation();

    }
);