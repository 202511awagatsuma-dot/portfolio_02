document.addEventListener("DOMContentLoaded", () => {
    initPeakPoseField();
    initGrowthCalendar();
});

function initPeakPoseField() {
    const peakPoseField = document.getElementById("peakPoseField");
    const peakPoseInput = document.getElementById("peakPoseName");
    const toggleInputs = document.querySelectorAll("input[name='peakPoseEnabled']");

    if (!peakPoseField || !peakPoseInput || toggleInputs.length === 0) {
        return;
    }

    const syncPeakPoseVisibility = () => {
        const enabled = document.querySelector("input[name='peakPoseEnabled']:checked")?.value === "true";
        peakPoseField.hidden = !enabled;
        peakPoseInput.required = enabled;

        if (!enabled) {
            peakPoseInput.value = "";
        }
    };

    toggleInputs.forEach((input) => {
        input.addEventListener("change", syncPeakPoseVisibility);
    });

    syncPeakPoseVisibility();
}

function initGrowthCalendar() {
    const calendarRoot = document.getElementById("growthCalendar");
    const calendarGrid = document.getElementById("calendarGrid");
    const monthLabel = document.getElementById("calendarMonthLabel");
    const navButtons = document.querySelectorAll("[data-calendar-nav]");

    if (!calendarRoot || !calendarGrid || !monthLabel || navButtons.length === 0) {
        return;
    }

    const recordedDates = [
        "2026-04-03",
        "2026-04-08",
        "2026-04-12",
        "2026-04-15",
        "2026-04-19",
        "2026-04-24",
        "2026-04-28",
        "2026-05-02",
        "2026-05-06",
        "2026-05-14"
    ];

    const recordSet = new Set(recordedDates);
    const today = createDateOnly(new Date());
    let currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    let selectedDate = null;

    navButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const direction = button.dataset.calendarNav === "next" ? 1 : -1;
            currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1);
            renderCalendar();
        });
    });

    function renderCalendar() {
        monthLabel.textContent = formatMonthLabel(currentMonth);
        calendarGrid.innerHTML = "";

        const firstDayIndex = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
        const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
        const totalCells = Math.ceil((firstDayIndex + daysInMonth) / 7) * 7;

        for (let cellIndex = 0; cellIndex < totalCells; cellIndex += 1) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), cellIndex - firstDayIndex + 1);
            const isoDate = formatIsoDate(date);
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
            const isToday = isSameDate(date, today);
            const isSelected = selectedDate === isoDate;
            const hasRecord = recordSet.has(isoDate);

            const button = document.createElement("button");
            button.type = "button";
            button.className = "calendar-day";
            button.dataset.date = isoDate;
            button.setAttribute("role", "gridcell");
            button.setAttribute("aria-label", `${isoDate}${hasRecord ? " レポートあり" : ""}${isToday ? " 今日" : ""}`);
            button.setAttribute("aria-selected", String(isSelected));

            if (!isCurrentMonth) {
                button.classList.add("calendar-day--muted");
            }
            if (isToday) {
                button.classList.add("calendar-day--today");
            }
            if (isSelected) {
                button.classList.add("calendar-day--selected");
            }
            if (hasRecord) {
                button.classList.add("calendar-day--has-record");
            }

            button.innerHTML = `
                <span class="calendar-day__number">${date.getDate()}</span>
                <span class="calendar-day__markers">${hasRecord ? '<span class="calendar-day__dot" aria-hidden="true"></span>' : ""}</span>
            `;

            button.addEventListener("click", () => {
                selectedDate = isoDate;
                console.log(`Selected date: ${isoDate}`);
                renderCalendar();
            });

            calendarGrid.appendChild(button);
        }
    }

    renderCalendar();
}

function formatMonthLabel(date) {
    return new Intl.DateTimeFormat("ja-JP", {
        year: "numeric",
        month: "long"
    }).format(date);
}

function formatIsoDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function createDateOnly(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDate(a, b) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}
