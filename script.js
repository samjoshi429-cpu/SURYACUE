/* =========================================================
   SURYACUE
   DYNAMIC SOUNDBOARD + AUTO SAVE
   ========================================================= */


/* =========================================================
   DATABASE
   ========================================================= */

const DB_NAME = "SURYACUE_DATABASE";
const DB_VERSION = 1;
const STORE_NAME = "soundboard";

let database = null;

let tracks = [];

let isRestoring = false;
let saveTimer = null;


/* =========================================================
   OPEN DATABASE
   ========================================================= */

function openDatabase() {

    return new Promise(function (resolve, reject) {

        const request =
            indexedDB.open(
                DB_NAME,
                DB_VERSION
            );


        request.onupgradeneeded =
            function (event) {

                const db =
                    event.target.result;

                if (
                    !db.objectStoreNames.contains(
                        STORE_NAME
                    )
                ) {

                    db.createObjectStore(
                        STORE_NAME
                    );
                }
            };


        request.onsuccess =
            function (event) {

                database =
                    event.target.result;

                resolve(database);
            };


        request.onerror =
            function () {

                reject(
                    request.error
                );
            };

    });
}


/* =========================================================
   DATABASE SAVE
   ========================================================= */

function databasePut(key, value) {

    return new Promise(function (resolve, reject) {

        const transaction =
            database.transaction(
                STORE_NAME,
                "readwrite"
            );

        const store =
            transaction.objectStore(
                STORE_NAME
            );

        const request =
            store.put(
                value,
                key
            );


        request.onsuccess =
            function () {

                resolve();
            };


        request.onerror =
            function () {

                reject(
                    request.error
                );
            };

    });
}


/* =========================================================
   DATABASE GET
   ========================================================= */

function databaseGet(key) {

    return new Promise(function (resolve, reject) {

        const transaction =
            database.transaction(
                STORE_NAME,
                "readonly"
            );

        const store =
            transaction.objectStore(
                STORE_NAME
            );

        const request =
            store.get(
                key
            );


        request.onsuccess =
            function () {

                resolve(
                    request.result
                );
            };


        request.onerror =
            function () {

                reject(
                    request.error
                );
            };

    });
}


/* =========================================================
   DATABASE DELETE
   ========================================================= */

function databaseDelete(key) {

    return new Promise(function (resolve, reject) {

        const transaction =
            database.transaction(
                STORE_NAME,
                "readwrite"
            );

        const store =
            transaction.objectStore(
                STORE_NAME
            );

        const request =
            store.delete(
                key
            );


        request.onsuccess =
            function () {

                resolve();
            };


        request.onerror =
            function () {

                reject(
                    request.error
                );
            };

    });
}


/* =========================================================
   UI REFERENCES
   ========================================================= */

const tracksContainer =
    document.getElementById(
        "tracks-container"
    );

const trackCountInput =
    document.getElementById(
        "track-count"
    );

const createBoardButton =
    document.getElementById(
        "create-board-button"
    );

const saveSetupButton =
    document.getElementById(
        "save-setup-button"
    );

const clearSetupButton =
    document.getElementById(
        "clear-setup-button"
    );

const saveStatus =
    document.getElementById(
        "save-status"
    );


/* =========================================================
   SAVE STATUS
   ========================================================= */

function setSaveStatus(text) {

    saveStatus.textContent =
        text;
}


/* =========================================================
   FORMAT TIME
   ========================================================= */

function formatTime(seconds) {

    if (!isFinite(seconds)) {

        return "00:00";
    }

    seconds =
        Math.max(
            0,
            seconds
        );

    const minutes =
        Math.floor(
            seconds / 60
        );

    const remainingSeconds =
        Math.floor(
            seconds % 60
        );

    return String(minutes).padStart(2, "0") +
        ":" +
        String(remainingSeconds).padStart(2, "0");
}


/* =========================================================
   SCHEDULE AUTO SAVE
   ========================================================= */

function scheduleAutoSave() {

    if (isRestoring) {
        return;
    }

    clearTimeout(
        saveTimer
    );

    setSaveStatus(
        "SAVING..."
    );

    saveTimer =
        setTimeout(
            function () {

                saveSetup();

            },
            700
        );
}


/* =========================================================
   COLLECT SETUP
   ========================================================= */

function collectSetup() {

    const savedTracks =
        tracks.map(
            function (item) {

                const track =
                    item.track;

                return {

                    index:
                        item.index,

                    fileName:
                        item.file
                            ? item.file.name
                            : null,

                    file:
                        item.file || null,

                    volume:
                        Number(
                            item.volumeSlider.value
                        ),

                    rangeStart:
                        Number(
                            item.rangeStartInput.value
                        ),

                    rangeEnd:
                        Number(
                            item.rangeEndInput.value
                        ),

                    rangeLoopEnabled:
                        item.rangeLoopEnabled,

                    loopEnabled:
                        item.loopEnabled,

                    fadeInEnabled:
                        item.fadeInEnabled,

                    fadeInDuration:
                        Number(
                            item.fadeInDurationInput.value
                        ),

                    fadeOutDuration:
                        Number(
                            item.fadeOutDurationInput.value
                        )
                };
            }
        );


    return {

        trackCount:
            tracks.length,

        tracks:
            savedTracks,

        savedAt:
            Date.now()
    };
}


/* =========================================================
   SAVE SETUP
   ========================================================= */

async function saveSetup() {

    if (!database) {
        return;
    }

    try {

        const setup =
            collectSetup();

        await databasePut(
            "currentSetup",
            setup
        );

        setSaveStatus(
            "AUTO-SAVED ✓"
        );

    } catch (error) {

        console.error(
            "SURYACUE save error:",
            error
        );

        setSaveStatus(
            "SAVE ERROR"
        );
    }
}


/* =========================================================
   CREATE TRACK ELEMENT
   ========================================================= */

function createTrackElement(index) {

    const track =
        document.createElement(
            "div"
        );

    track.className =
        "track";


    const number =
        String(index + 1)
            .padStart(2, "0");


    track.innerHTML = `

        <div class="track-number">
            ${number}
        </div>

        <div class="track-info">

            <h2>
                Track ${index + 1}
            </h2>

            <p>
                No audio loaded
            </p>

        </div>

        <button class="load-button">
            LOAD AUDIO
        </button>

        <button class="play-button">
            ▶
        </button>

        <button class="loop-button">
            LOOP OFF
        </button>

        <div class="volume-control">

            <span>
                VOL
            </span>

            <input
                type="range"
                min="0"
                max="100"
                value="100"
            >

        </div>
    `;


    tracksContainer.appendChild(
        track
    );


    return track;
}


/* =========================================================
   INITIALIZE TRACK
   ========================================================= */

function initializeTrack(
    track,
    index
) {

    const loadButton =
        track.querySelector(
            ".load-button"
        );

    const playButton =
        track.querySelector(
            ".play-button"
        );

    const loopButton =
        track.querySelector(
            ".loop-button"
        );

    const volumeSlider =
        track.querySelector(
            'input[type="range"]'
        );

    const trackName =
        track.querySelector(
            ".track-info h2"
        );

    const trackStatus =
        track.querySelector(
            ".track-info p"
        );


    let audio = null;
    let audioUrl = null;
    let currentFile = null;

    let loopEnabled = false;
    let rangeLoopEnabled = false;

    let rangeStart = 0;
    let rangeEnd = 0;

    let baseVolume = 1;

    let fadeInEnabled = false;
    let fadeInTimer = null;

    let fadeOutActive = false;
    let fadeOutTimer = null;


    /* =====================================================
       ACTIVITY VISUALIZER
       ===================================================== */

    const activityContainer =
        document.createElement(
            "div"
        );

    activityContainer.className =
        "audio-activity";


    for (
        let i = 0;
        i < 18;
        i++
    ) {

        const bar =
            document.createElement(
                "span"
            );

        bar.className =
            "activity-bar";

        activityContainer.appendChild(
            bar
        );
    }


    track.insertBefore(
        activityContainer,
        loadButton
    );


    /* =====================================================
       TIMELINE
       ===================================================== */

    const timelineContainer =
        document.createElement(
            "div"
        );

    timelineContainer.className =
        "timeline-container";


    timelineContainer.innerHTML = `

        <div class="timeline-time">

            <span class="current-time">
                00:00
            </span>

            <span class="total-time">
                00:00
            </span>

        </div>

        <div class="timeline-wrapper">

            <div class="range-highlight"></div>

            <input
                class="seek-bar"
                type="range"
                min="0"
                max="0"
                step="0.1"
                value="0"
            >

        </div>
    `;


    track.insertBefore(
        timelineContainer,
        loadButton
    );


    const seekBar =
        timelineContainer.querySelector(
            ".seek-bar"
        );

    const currentTimeDisplay =
        timelineContainer.querySelector(
            ".current-time"
        );

    const totalTimeDisplay =
        timelineContainer.querySelector(
            ".total-time"
        );

    const rangeHighlight =
        timelineContainer.querySelector(
            ".range-highlight"
        );


    /* =====================================================
       RANGE CONTROLS
       ===================================================== */

    const rangeControls =
        document.createElement(
            "div"
        );

    rangeControls.className =
        "range-controls";


    rangeControls.innerHTML = `

        <button class="range-loop-button">
            RANGE OFF
        </button>

        <div class="range-inputs">

            <label>
                START

                <input
                    class="range-start"
                    type="number"
                    min="0"
                    step="0.1"
                    value="0"
                >
            </label>

            <label>
                END

                <input
                    class="range-end"
                    type="number"
                    min="0"
                    step="0.1"
                    value="0"
                >
            </label>

        </div>
    `;


    track.appendChild(
        rangeControls
    );


    const rangeLoopButton =
        rangeControls.querySelector(
            ".range-loop-button"
        );

    const rangeStartInput =
        rangeControls.querySelector(
            ".range-start"
        );

    const rangeEndInput =
        rangeControls.querySelector(
            ".range-end"
        );


    /* =====================================================
       FADE CONTROLS
       ===================================================== */

    const fadeControls =
        document.createElement(
            "div"
        );

    fadeControls.className =
        "fade-controls";


    fadeControls.innerHTML = `

        <button class="fade-in-button">
            FADE IN OFF
        </button>

        <label class="fade-duration">

            IN SEC

            <input
                class="fade-in-duration"
                type="number"
                min="0.1"
                max="60"
                step="0.1"
                value="2"
            >

        </label>

        <button class="fade-out-button">
            FADE OUT
        </button>

        <label class="fade-duration">

            OUT SEC

            <input
                class="fade-out-duration"
                type="number"
                min="0.1"
                max="60"
                step="0.1"
                value="2"
            >

        </label>
    `;


    track.appendChild(
        fadeControls
    );


    const fadeInButton =
        fadeControls.querySelector(
            ".fade-in-button"
        );

    const fadeOutButton =
        fadeControls.querySelector(
            ".fade-out-button"
        );

    const fadeInDurationInput =
        fadeControls.querySelector(
            ".fade-in-duration"
        );

    const fadeOutDurationInput =
        fadeControls.querySelector(
            ".fade-out-duration"
        );


    /* =====================================================
       RANGE HIGHLIGHT
       ===================================================== */

    function updateRangeHighlight() {

        if (
            !audio ||
            !audio.duration
        ) {

            rangeHighlight.style.left =
                "0%";

            rangeHighlight.style.width =
                "0%";

            return;
        }


        const startPercent =
            (
                rangeStart /
                audio.duration
            ) * 100;


        const endPercent =
            (
                rangeEnd /
                audio.duration
            ) * 100;


        rangeHighlight.style.left =
            startPercent + "%";


        rangeHighlight.style.width =
            Math.max(
                0,
                endPercent -
                startPercent
            ) + "%";
    }


    /* =====================================================
       LOOP VISUAL
       ===================================================== */

    function updateLoopVisual() {

        if (loopEnabled) {

            loopButton.classList.add(
                "active"
            );

            loopButton.textContent =
                "LOOP ON";

        } else {

            loopButton.classList.remove(
                "active"
            );

            loopButton.textContent =
                "LOOP OFF";
        }
    }


    /* =====================================================
       RANGE VISUAL
       ===================================================== */

    function updateRangeVisual() {

        if (rangeLoopEnabled) {

            rangeLoopButton.classList.add(
                "active"
            );

            rangeLoopButton.textContent =
                "RANGE ON";

        } else {

            rangeLoopButton.classList.remove(
                "active"
            );

            rangeLoopButton.textContent =
                "RANGE OFF";
        }
    }


    /* =====================================================
       FADE IN VISUAL
       ===================================================== */

    function updateFadeInVisual() {

        if (fadeInEnabled) {

            fadeInButton.classList.add(
                "active"
            );

            fadeInButton.textContent =
                "FADE IN ON";

        } else {

            fadeInButton.classList.remove(
                "active"
            );

            fadeInButton.textContent =
                "FADE IN OFF";
        }
    }


    /* =====================================================
       FADE OUT VISUAL
       ===================================================== */

    function updateFadeOutVisual() {

        if (fadeOutActive) {

            fadeOutButton.classList.add(
                "active"
            );

            fadeOutButton.textContent =
                "FADING OUT...";

        } else {

            fadeOutButton.classList.remove(
                "active"
            );

            fadeOutButton.textContent =
                "FADE OUT";
        }
    }


    /* =====================================================
       ACTIVITY
       ===================================================== */

    function setActivityPlaying(
        isPlaying
    ) {

        if (isPlaying) {

            track.classList.add(
                "playing"
            );

        } else {

            track.classList.remove(
                "playing"
            );
        }
    }


    /* =====================================================
       STOP FADE TIMERS
       ===================================================== */

    function stopFadeTimers() {

        if (fadeInTimer) {

            clearInterval(
                fadeInTimer
            );

            fadeInTimer = null;
        }


        if (fadeOutTimer) {

            clearInterval(
                fadeOutTimer
            );

            fadeOutTimer = null;
        }
    }


    /* =====================================================
       FADE DURATIONS
       ===================================================== */

    function getFadeInDuration() {

        let value =
            Number(
                fadeInDurationInput.value
            );


        if (
            !isFinite(value) ||
            value <= 0
        ) {

            value = 2;

            fadeInDurationInput.value =
                "2";
        }


        if (value > 60) {

            value = 60;

            fadeInDurationInput.value =
                "60";
        }


        return value;
    }


    function getFadeOutDuration() {

        let value =
            Number(
                fadeOutDurationInput.value
            );


        if (
            !isFinite(value) ||
            value <= 0
        ) {

            value = 2;

            fadeOutDurationInput.value =
                "2";
        }


        if (value > 60) {

            value = 60;

            fadeOutDurationInput.value =
                "60";
        }


        return value;
    }


    /* =====================================================
       FADE IN
       ===================================================== */

    function startFadeIn() {

        if (!audio) {
            return;
        }


        if (!fadeInEnabled) {

            audio.volume =
                baseVolume;

            return;
        }


        if (fadeInTimer) {

            clearInterval(
                fadeInTimer
            );

            fadeInTimer = null;
        }


        const duration =
            getFadeInDuration() *
            1000;


        const startTime =
            Date.now();


        audio.volume =
            0;


        fadeInTimer =
            setInterval(
                function () {

                    if (!audio) {

                        clearInterval(
                            fadeInTimer
                        );

                        fadeInTimer = null;

                        return;
                    }


                    const elapsed =
                        Date.now() -
                        startTime;


                    const progress =
                        Math.min(
                            elapsed /
                            duration,
                            1
                        );


                    audio.volume =
                        baseVolume *
                        progress;


                    if (
                        progress >= 1
                    ) {

                        clearInterval(
                            fadeInTimer
                        );

                        fadeInTimer = null;

                        audio.volume =
                            baseVolume;
                    }

                },
                40
            );
    }


    /* =====================================================
       MANUAL FADE OUT
       ===================================================== */

    function startFadeOut() {

        if (!audio) {

            alert(
                "Please load an audio file first."
            );

            return;
        }


        if (audio.paused) {
            return;
        }


        if (fadeOutActive) {
            return;
        }


        fadeOutActive =
            true;


        if (fadeInTimer) {

            clearInterval(
                fadeInTimer
            );

            fadeInTimer = null;
        }


        const startingVolume =
            audio.volume;


        const duration =
            getFadeOutDuration() *
            1000;


        const startTime =
            Date.now();


        updateFadeOutVisual();

        fadeOutButton.disabled =
            true;


        trackStatus.textContent =
            "Fading out";


        fadeOutTimer =
            setInterval(
                function () {

                    if (!audio) {

                        clearInterval(
                            fadeOutTimer
                        );

                        fadeOutTimer = null;

                        fadeOutActive =
                            false;

                        updateFadeOutVisual();

                        fadeOutButton.disabled =
                            false;

                        return;
                    }


                    const elapsed =
                        Date.now() -
                        startTime;


                    const progress =
                        Math.min(
                            elapsed /
                            duration,
                            1
                        );


                    audio.volume =
                        Math.max(
                            0,
                            startingVolume *
                            (1 - progress)
                        );


                    if (
                        progress >= 1
                    ) {

                        clearInterval(
                            fadeOutTimer
                        );

                        fadeOutTimer =
                            null;


                        audio.pause();


                        audio.volume =
                            baseVolume;


                        fadeOutActive =
                            false;


                        updateFadeOutVisual();


                        fadeOutButton.disabled =
                            false;


                        playButton.textContent =
                            "▶";


                        trackStatus.textContent =
                            "Faded out";


                        setActivityPlaying(
                            false
                        );
                    }

                },
                40
            );
    }


    /* =====================================================
       LOAD AUDIO
       ===================================================== */

    loadButton.addEventListener(
        "click",
        function () {

            const fileInput =
                document.createElement(
                    "input"
                );


            fileInput.type =
                "file";


            fileInput.accept =
                "audio/*";


            fileInput.addEventListener(
                "change",
                function () {

                    const file =
                        fileInput.files[0];


                    if (!file) {
                        return;
                    }


                    loadFile(
                        file,
                        true
                    );
                }
            );


            fileInput.click();
        }
    );


    /* =====================================================
       LOAD FILE
       ===================================================== */

    function loadFile(
        file,
        resetRange
    ) {

        stopFadeTimers();


        fadeOutActive =
            false;


        updateFadeOutVisual();


        fadeOutButton.disabled =
            false;


        setActivityPlaying(
            false
        );


        if (audio) {

            audio.pause();

            audio.src = "";

            audio = null;
        }


        if (audioUrl) {

            URL.revokeObjectURL(
                audioUrl
            );

            audioUrl = null;
        }


        currentFile =
            file;


        audioUrl =
            URL.createObjectURL(
                file
            );


        audio =
            new Audio();


        audio.src =
            audioUrl;


        audio.preload =
            "auto";


        audio.loop =
            loopEnabled &&
            !rangeLoopEnabled;


        baseVolume =
            Number(
                volumeSlider.value
            ) / 100;


        audio.volume =
            baseVolume;


        /* =================================================
           LOADED METADATA
           ================================================= */

        audio.addEventListener(
            "loadedmetadata",
            function () {

                seekBar.max =
                    audio.duration;


                seekBar.value =
                    0;


                rangeStartInput.max =
                    audio.duration;


                rangeEndInput.max =
                    audio.duration;


                if (resetRange) {

                    rangeStart =
                        0;

                    rangeEnd =
                        audio.duration;

                    rangeStartInput.value =
                        "0";

                    rangeEndInput.value =
                        audio.duration
                            .toFixed(1);
                }


                currentTimeDisplay.textContent =
                    "00:00";


                totalTimeDisplay.textContent =
                    formatTime(
                        audio.duration
                    );


                updateRangeHighlight();


                trackStatus.textContent =
                    "Ready to play";


                scheduleAutoSave();
            }
        );


        /* =================================================
           PLAY
           ================================================= */

        audio.addEventListener(
            "play",
            function () {

                setActivityPlaying(
                    true
                );
            }
        );


        /* =================================================
           PAUSE
           ================================================= */

        audio.addEventListener(
            "pause",
            function () {

                if (!fadeOutActive) {

                    setActivityPlaying(
                        false
                    );
                }
            }
        );


        /* =================================================
           ENDED
           ================================================= */

        audio.addEventListener(
            "ended",
            function () {

                playButton.textContent =
                    "▶";


                trackStatus.textContent =
                    "Finished";


                setActivityPlaying(
                    false
                );
            }
        );


        /* =================================================
           ERROR
           ================================================= */

        audio.addEventListener(
            "error",
            function () {

                trackStatus.textContent =
                    "Unable to load audio";


                playButton.textContent =
                    "▶";


                setActivityPlaying(
                    false
                );
            }
        );


        /* =================================================
           TIME UPDATE
           ================================================= */

        audio.addEventListener(
            "timeupdate",
            function () {

                if (
                    !audio ||
                    !audio.duration
                ) {

                    return;
                }


                /* CUSTOM RANGE LOOP */

                if (
                    rangeLoopEnabled &&
                    !fadeOutActive &&
                    rangeEnd > rangeStart &&
                    audio.currentTime >= rangeEnd
                ) {

                    audio.currentTime =
                        rangeStart;
                }


                /* SEEK BAR */

                seekBar.value =
                    audio.currentTime;


                currentTimeDisplay.textContent =
                    formatTime(
                        audio.currentTime
                    );


                /* AUTOMATIC 5 SECOND END FADE */

                const timeRemaining =
                    audio.duration -
                    audio.currentTime;


                if (
                    !loopEnabled &&
                    !rangeLoopEnabled &&
                    !fadeOutActive &&
                    timeRemaining <= 5 &&
                    timeRemaining > 0
                ) {

                    audio.volume =
                        baseVolume *
                        (
                            timeRemaining /
                            5
                        );
                }

            }
        );


        trackName.textContent =
            file.name;


        trackStatus.textContent =
            "Ready to play";


        playButton.textContent =
            "▶";


        scheduleAutoSave();
    }


    /* =====================================================
       PLAY / PAUSE
       ===================================================== */

    playButton.addEventListener(
        "click",
        function () {

            if (!audio) {

                alert(
                    "Please load an audio file first."
                );

                return;
            }


            if (audio.paused) {

                if (
                    rangeLoopEnabled &&
                    (
                        audio.currentTime <
                            rangeStart ||
                        audio.currentTime >=
                            rangeEnd
                    )
                ) {

                    audio.currentTime =
                        rangeStart;
                }


                fadeOutActive =
                    false;


                if (fadeOutTimer) {

                    clearInterval(
                        fadeOutTimer
                    );

                    fadeOutTimer =
                        null;
                }


                updateFadeOutVisual();


                fadeOutButton.disabled =
                    false;


                audio.volume =
                    baseVolume;


                const playPromise =
                    audio.play();


                if (
                    playPromise !==
                    undefined
                ) {

                    playPromise
                        .then(
                            function () {

                                playButton.textContent =
                                    "Ⅱ";


                                trackStatus.textContent =
                                    "Playing";


                                startFadeIn();
                            }
                        )
                        .catch(
                            function () {

                                trackStatus.textContent =
                                    "Unable to play audio";
                            }
                        );
                }

            } else {

                audio.pause();


                stopFadeTimers();


                audio.volume =
                    baseVolume;


                playButton.textContent =
                    "▶";


                trackStatus.textContent =
                    "Paused";


                setActivityPlaying(
                    false
                );
            }
        }
    );


    /* =====================================================
       SEEK BAR
       ===================================================== */

    seekBar.addEventListener(
        "input",
        function () {

            if (!audio) {
                return;
            }


            let newPosition =
                Number(
                    seekBar.value
                );


            if (rangeLoopEnabled) {

                if (
                    newPosition <
                    rangeStart
                ) {

                    newPosition =
                        rangeStart;
                }


                if (
                    newPosition >
                    rangeEnd
                ) {

                    newPosition =
                        rangeEnd;
                }


                seekBar.value =
                    newPosition;
            }


            audio.currentTime =
                newPosition;


            currentTimeDisplay.textContent =
                formatTime(
                    newPosition
                );
        }
    );


    /* =====================================================
       VOLUME
       ===================================================== */

    volumeSlider.addEventListener(
        "input",
        function () {

            baseVolume =
                Number(
                    volumeSlider.value
                ) / 100;


            if (
                audio &&
                !fadeOutActive
            ) {

                audio.volume =
                    baseVolume;
            }


            scheduleAutoSave();
        }
    );


    /* =====================================================
       FULL TRACK LOOP
       ===================================================== */

    loopButton.addEventListener(
        "click",
        function () {

            if (!audio) {

                alert(
                    "Please load an audio file first."
                );

                return;
            }


            loopEnabled =
                !loopEnabled;


            /*
             IMPORTANT:
             Range looping remains its own system.
             */

            if (rangeLoopEnabled) {

                audio.loop =
                    false;


                audio.volume =
                    baseVolume;


                trackStatus.textContent =
                    "Range loop: " +
                    formatTime(
                        rangeStart
                    ) +
                    " – " +
                    formatTime(
                        rangeEnd
                    );

            } else if (loopEnabled) {

                audio.loop =
                    true;


                audio.volume =
                    baseVolume;


                trackStatus.textContent =
                    "Full track loop";

            } else {

                audio.loop =
                    false;


                if (!audio.paused) {

                    trackStatus.textContent =
                        "Playing";

                } else {

                    trackStatus.textContent =
                        "Paused";
                }
            }


            updateLoopVisual();

            updateRangeVisual();

            updateRangeHighlight();

            scheduleAutoSave();
        }
    );


    /* =====================================================
       RANGE LOOP
       ===================================================== */

    rangeLoopButton.addEventListener(
        "click",
        function () {

            if (!audio) {

                alert(
                    "Please load an audio file first."
                );

                return;
            }


            const start =
                Number(
                    rangeStartInput.value
                );


            const end =
                Number(
                    rangeEndInput.value
                );


            if (
                isNaN(start) ||
                isNaN(end)
            ) {

                alert(
                    "Please enter valid start and end times."
                );

                return;
            }


            if (start < 0) {

                alert(
                    "Start time cannot be below 0."
                );

                return;
            }


            if (end <= start) {

                alert(
                    "End time must be greater than start time."
                );

                return;
            }


            if (
                audio.duration &&
                end > audio.duration
            ) {

                alert(
                    "End time cannot be longer than the audio."
                );

                return;
            }


            rangeStart =
                start;


            rangeEnd =
                end;


            rangeLoopEnabled =
                !rangeLoopEnabled;


            if (rangeLoopEnabled) {

                /*
                 RANGE becomes active.
                 LOOP setting is NOT changed.
                 */

                audio.loop =
                    false;


                audio.volume =
                    baseVolume;


                if (
                    audio.currentTime <
                        rangeStart ||
                    audio.currentTime >=
                        rangeEnd
                ) {

                    audio.currentTime =
                        rangeStart;


                    seekBar.value =
                        rangeStart;
                }


                trackStatus.textContent =
                    "Range loop: " +
                    formatTime(
                        rangeStart
                    ) +
                    " – " +
                    formatTime(
                        rangeEnd
                    );

            } else {

                /*
                 RANGE is OFF.
                 Full LOOP can resume if it is ON.
                 */

                audio.loop =
                    loopEnabled;


                if (loopEnabled) {

                    trackStatus.textContent =
                        "Full track loop";

                } else if (audio.paused) {

                    trackStatus.textContent =
                        "Paused";

                } else {

                    trackStatus.textContent =
                        "Playing";
                }
            }


            updateLoopVisual();

            updateRangeVisual();

            updateRangeHighlight();

            scheduleAutoSave();
        }
    );


    /* =====================================================
       RANGE START
       ===================================================== */

    rangeStartInput.addEventListener(
        "change",
        function () {

            if (!audio) {
                return;
            }


            let value =
                Number(
                    rangeStartInput.value
                );


            if (value < 0) {

                value =
                    0;
            }


            if (
                audio.duration &&
                value >= audio.duration
            ) {

                value =
                    Math.max(
                        0,
                        audio.duration -
                        0.1
                    );
            }


            rangeStartInput.value =
                value.toFixed(1);


            rangeStart =
                value;


            if (
                rangeEnd <=
                rangeStart
            ) {

                rangeEnd =
                    Math.min(
                        audio.duration,
                        rangeStart +
                        0.1
                    );


                rangeEndInput.value =
                    rangeEnd.toFixed(1);
            }


            updateRangeHighlight();

            scheduleAutoSave();
        }
    );


    /* =====================================================
       RANGE END
       ===================================================== */

    rangeEndInput.addEventListener(
        "change",
        function () {

            if (!audio) {
                return;
            }


            let value =
                Number(
                    rangeEndInput.value
                );


            if (
                value <=
                rangeStart
            ) {

                value =
                    Math.min(
                        audio.duration,
                        rangeStart +
                        0.1
                    );
            }


            if (
                audio.duration &&
                value >
                audio.duration
            ) {

                value =
                    audio.duration;
            }


            rangeEndInput.value =
                value.toFixed(1);


            rangeEnd =
                value;


            updateRangeHighlight();

            scheduleAutoSave();
        }
    );


    /* =====================================================
       FADE IN ON / OFF
       ===================================================== */

    fadeInButton.addEventListener(
        "click",
        function () {

            fadeInEnabled =
                !fadeInEnabled;


            updateFadeInVisual();

            scheduleAutoSave();
        }
    );


    /* =====================================================
       FADE IN DURATION
       ===================================================== */

    fadeInDurationInput.addEventListener(
        "change",
        function () {

            let value =
                Number(
                    fadeInDurationInput.value
                );


            if (
                !isFinite(value) ||
                value <= 0
            ) {

                value =
                    2;
            }


            if (value > 60) {

                value =
                    60;
            }


            fadeInDurationInput.value =
                value;


            scheduleAutoSave();
        }
    );


    /* =====================================================
       FADE OUT
       ===================================================== */

    fadeOutButton.addEventListener(
        "click",
        function () {

            startFadeOut();
        }
    );


    /* =====================================================
       FADE OUT DURATION
       ===================================================== */

    fadeOutDurationInput.addEventListener(
        "change",
        function () {

            let value =
                Number(
                    fadeOutDurationInput.value
                );


            if (
                !isFinite(value) ||
                value <= 0
            ) {

                value =
                    2;
            }


            if (value > 60) {

                value =
                    60;
            }


            fadeOutDurationInput.value =
                value;


            scheduleAutoSave();
        }
    );


    /* =====================================================
       TRACK OBJECT
       ===================================================== */

    const trackObject = {

        track:
            track,

        index:
            index,

        file:
            currentFile,

        loadFile:
            function (file) {

                currentFile =
                    file;

                loadFile(
                    file,
                    false
                );
            },

        get file() {
            return currentFile;
        },

        volumeSlider:
            volumeSlider,

        rangeStartInput:
            rangeStartInput,

        rangeEndInput:
            rangeEndInput,

        fadeInDurationInput:
            fadeInDurationInput,

        fadeOutDurationInput:
            fadeOutDurationInput,

        get loopEnabled() {
            return loopEnabled;
        },

        set loopEnabled(value) {
            loopEnabled =
                Boolean(value);

            updateLoopVisual();

            if (audio) {

                audio.loop =
                    loopEnabled &&
                    !rangeLoopEnabled;
            }
        },

        get rangeLoopEnabled() {
            return rangeLoopEnabled;
        },

        set rangeLoopEnabled(value) {
            rangeLoopEnabled =
                Boolean(value);

            updateRangeVisual();

            if (audio) {

                audio.loop =
                    loopEnabled &&
                    !rangeLoopEnabled;
            }
        },

        get fadeInEnabled() {
            return fadeInEnabled;
        },

        set fadeInEnabled(value) {
            fadeInEnabled =
                Boolean(value);

            updateFadeInVisual();
        },

        setRangeValues:
            function (
                start,
                end
            ) {

                rangeStart =
                    Number(start);

                rangeEnd =
                    Number(end);

                rangeStartInput.value =
                    rangeStart.toFixed(1);

                rangeEndInput.value =
                    rangeEnd.toFixed(1);

                updateRangeHighlight();
            },

        getAudio:
            function () {
                return audio;
            },

        setTrackName:
            function (name) {

                trackName.textContent =
                    name;
            },

        setStatus:
            function (status) {

                trackStatus.textContent =
                    status;
            },

        setBaseVolume:
            function (value) {

                baseVolume =
                    Number(value);

                volumeSlider.value =
                    Math.round(
                        baseVolume * 100
                    );

                if (audio) {

                    audio.volume =
                        baseVolume;
                }
            }
    };


    updateLoopVisual();

    updateRangeVisual();

    updateFadeInVisual();

    updateFadeOutVisual();


    return trackObject;
}


/* =========================================================
   CREATE SOUNDBOARD
   ========================================================= */

function createSoundboard(
    count
) {

    count =
        Number(count);


    if (
        !isFinite(count) ||
        count < 1
    ) {

        count =
            1;
    }


    if (count > 100) {

        count =
            100;
    }


    trackCountInput.value =
        count;


    /*
     Stop old tracks before replacing them.
     */

    tracks.forEach(
        function (item) {

            const audio =
                item.getAudio();

            if (audio) {

                audio.pause();

                audio.src = "";
            }
        }
    );


    tracksContainer.innerHTML =
        "";


    tracks =
        [];


    for (
        let i = 0;
        i < count;
        i++
    ) {

        const track =
            createTrackElement(
                i
            );


        const trackObject =
            initializeTrack(
                track,
                i
            );


        tracks.push(
            trackObject
        );
    }


    scheduleAutoSave();
}


/* =========================================================
   CREATE BUTTON
   ========================================================= */

createBoardButton.addEventListener(
    "click",
    function () {

        const count =
            Number(
                trackCountInput.value
            );


        if (
            !isFinite(count) ||
            count < 1 ||
            count > 100
        ) {

            alert(
                "Please choose a number between 1 and 100."
            );

            return;
        }


        const hasExistingTracks =
            tracks.length > 0;


        if (hasExistingTracks) {

            const confirmed =
                confirm(
                    "Creating a new soundboard will replace the current tracks. Continue?"
                );


            if (!confirmed) {
                return;
            }
        }


        createSoundboard(
            count
        );
    }
);


/* =========================================================
   MANUAL SAVE BUTTON
   ========================================================= */

saveSetupButton.addEventListener(
    "click",
    async function () {

        await saveSetup();

        setSaveStatus(
            "SAVED ✓"
        );
    }
);


/* =========================================================
   CLEAR SAVED SETUP
   ========================================================= */

clearSetupButton.addEventListener(
    "click",
    async function () {

        const confirmed =
            confirm(
                "This will delete the saved SURYACUE setup and audio files from this browser. Continue?"
            );


        if (!confirmed) {
            return;
        }


        try {

            await databaseDelete(
                "currentSetup"
            );


            setSaveStatus(
                "SAVED SETUP CLEARED"
            );


            createSoundboard(
                Number(
                    trackCountInput.value
                )
            );

        } catch (error) {

            console.error(
                error
            );

            setSaveStatus(
                "CLEAR ERROR"
            );
        }
    }
);


/* =========================================================
   RESTORE SETUP
   ========================================================= */

async function restoreSetup() {

    try {

        const savedSetup =
            await databaseGet(
                "currentSetup"
            );


        if (
            !savedSetup ||
            !savedSetup.tracks
        ) {

            createSoundboard(
                12
            );

            setSaveStatus(
                "AUTO-SAVE READY"
            );

            return;
        }


        isRestoring =
            true;


        createSoundboardWithoutSave(
            savedSetup.trackCount
        );


        for (
            let i = 0;
            i < savedSetup.tracks.length;
            i++
        ) {

            const savedTrack =
                savedSetup.tracks[i];


            const item =
                tracks[i];


            if (!item) {
                continue;
            }


            /* VOLUME */

            if (
                savedTrack.volume !==
                undefined
            ) {

                item.setBaseVolume(
                    savedTrack.volume /
                    100
                );
            }


            /* RANGE */

            item.setRangeValues(
                savedTrack.rangeStart || 0,
                savedTrack.rangeEnd || 0
            );


            /* FADE IN */

            item.fadeInEnabled =
                savedTrack.fadeInEnabled ||
                false;


            item.fadeInDurationInput.value =
                savedTrack.fadeInDuration ||
                2;


            /* FADE OUT */

            item.fadeOutDurationInput.value =
                savedTrack.fadeOutDuration ||
                2;


            /* LOOP STATES */

            item.loopEnabled =
                savedTrack.loopEnabled ||
                false;


            item.rangeLoopEnabled =
                savedTrack.rangeLoopEnabled ||
                false;


            /*
             Restore the actual audio file.
             */

            if (savedTrack.file) {

                await new Promise(
                    function (resolve) {

                        const file =
                            new File(
                                [
                                    savedTrack.file
                                ],
                                savedTrack.fileName ||
                                    "audio",
                                {
                                    type:
                                        savedTrack.file.type ||
                                        "audio/mpeg"
                                }
                            );


                        item.loadFile(
                            file
                        );


                        setTimeout(
                            resolve,
                            250
                        );
                    }
                );
            }
        }


        isRestoring =
            false;


        setSaveStatus(
            "SETUP RESTORED ✓"
        );


    } catch (error) {

        console.error(
            "SURYACUE restore error:",
            error
        );


        isRestoring =
            false;


        createSoundboard(
            12
        );


        setSaveStatus(
            "RESTORE ERROR"
        );
    }
}


/* =========================================================
   CREATE WITHOUT SAVE
   ========================================================= */

function createSoundboardWithoutSave(
    count
) {

    count =
        Number(count);


    if (
        !isFinite(count) ||
        count < 1
    ) {

        count =
            12;
    }


    if (count > 100) {

        count =
            100;
    }


    trackCountInput.value =
        count;


    tracksContainer.innerHTML =
        "";


    tracks =
        [];


    for (
        let i = 0;
        i < count;
        i++
    ) {

        const track =
            createTrackElement(
                i
            );


        const trackObject =
            initializeTrack(
                track,
                i
            );


        tracks.push(
            trackObject
        );
    }
}


/* =========================================================
   START SURYACUE
   ========================================================= */

async function startSuryacue() {

    try {

        await openDatabase();

        await restoreSetup();

    } catch (error) {

        console.error(
            "SURYACUE database error:",
            error
        );


        createSoundboard(
            12
        );


        setSaveStatus(
            "LOCAL STORAGE ERROR"
        );
    }
}


startSuryacue();