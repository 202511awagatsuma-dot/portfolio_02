document.addEventListener("DOMContentLoaded", () => {
    initPeakPoseField();
    initGrowthCalendar();
    initSequenceTabs();
    initBreathingEditor();
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

            button.innerHTML = `<span class="calendar-day__number">${date.getDate()}</span>`;

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

function initSequenceTabs() {
    const tabGroups = [
        {
            tabs: document.querySelectorAll(".sequence-tab"),
            sections: document.querySelectorAll(".sequence-card"),
            emptyState: document.getElementById("sequenceEmptyState")
        },
        {
            tabs: document.querySelectorAll(".sequence-comp-tab"),
            sections: document.querySelectorAll(".sequence-comp-section"),
            emptyState: document.getElementById("sequenceCompEmpty")
        }
    ];

    tabGroups.forEach(({ tabs, sections, emptyState }) => {
        if (tabs.length === 0 || sections.length === 0) {
            return;
        }

        const applyFilter = (tabName) => {
            let visibleCount = 0;

            sections.forEach((section) => {
                const shouldShow = tabName === "all" || section.dataset.category === tabName;
                section.hidden = !shouldShow;

                if (shouldShow) {
                    visibleCount += 1;
                }
            });

            if (emptyState) {
                emptyState.hidden = visibleCount > 0;
            }
        };

        tabs.forEach((tab) => {
            tab.addEventListener("click", () => {
                tabs.forEach((candidate) => {
                    const isActive = candidate === tab;
                    candidate.classList.toggle("is-active", isActive);
                    candidate.setAttribute("aria-pressed", String(isActive));
                });

                applyFilter(tab.dataset.tab || "all");
            });
        });

        const activeTab = Array.from(tabs).find((tab) => tab.classList.contains("is-active"))?.dataset.tab || "all";
        applyFilter(activeTab);
    });
}

function initBreathingEditor() {
    const picker = document.getElementById("breathingPicker");
    const form = document.getElementById("breathingPickerForm");
    const label = document.getElementById("breathingPickerLabel");
    const modeLabel = document.getElementById("breathingFormModeLabel");
    const submitButton = document.getElementById("breathingSubmitButton");
    const cancelButton = document.getElementById("breathingCancelButton");
    const masterSelect = document.getElementById("breathingMasterId");
    const memoInput = document.getElementById("breathingMemo");
    const description = document.getElementById("breathingDescription");
    const editButtons = document.querySelectorAll(".sequence-comp-added-item__edit");
    const deleteButtons = document.querySelectorAll("[data-breathing-delete]");

    if (!picker || !form || !label || !modeLabel || !submitButton || !cancelButton || !masterSelect || !memoInput || !description) {
        return;
    }

    const createAction = form.getAttribute("action") || "";
    const createState = {
        pickerLabel: "\u547c\u5438\u6cd5\u3092\u8ffd\u52a0",
        modeLabel: "\u65b0\u898f\u8ffd\u52a0",
        submitLabel: "\u9078\u629e\u3057\u305f\u547c\u5438\u6cd5\u3092\u8ffd\u52a0"
    };
    const editState = {
        pickerLabel: "\u547c\u5438\u6cd5\u3092\u7de8\u96c6",
        modeLabel: "\u7de8\u96c6\u4e2d",
        submitLabel: "\u3053\u306e\u5185\u5bb9\u3067\u66f4\u65b0"
    };

    const syncDescription = () => {
        const selectedOption = masterSelect.options[masterSelect.selectedIndex];
        const text = selectedOption?.dataset.description?.trim() || "";
        description.textContent = text;
        description.hidden = text.length === 0;
    };

    const applyCreateState = () => {
        form.setAttribute("action", createAction);
        form.reset();
        label.textContent = createState.pickerLabel;
        modeLabel.textContent = createState.modeLabel;
        submitButton.textContent = createState.submitLabel;
        cancelButton.hidden = true;
        picker.open = false;
        syncDescription();
    };

    editButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const id = button.dataset.id;
            form.setAttribute("action", `${createAction}/${id}/update`);
            masterSelect.value = button.dataset.breathingMasterId || "";
            memoInput.value = button.dataset.memo || "";
            label.textContent = editState.pickerLabel;
            modeLabel.textContent = editState.modeLabel;
            submitButton.textContent = editState.submitLabel;
            cancelButton.hidden = false;
            picker.open = true;
            syncDescription();
            form.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
    });

    deleteButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            event.stopPropagation();

            const fallbackName = "\u3053\u306e\u547c\u5438\u6cd5";
            const confirmSuffix = " \u3092\u524a\u9664\u3057\u307e\u3059\u304b\uff1f";
            const name = button.dataset.name || fallbackName;

            if (!window.confirm(`${name}${confirmSuffix}`)) {
                event.preventDefault();
            }
        });
    });

    cancelButton.addEventListener("click", applyCreateState);
    masterSelect.addEventListener("change", syncDescription);
    picker.addEventListener("toggle", () => {
        if (!picker.open && !cancelButton.hidden) {
            applyCreateState();
        }
    });

    syncDescription();
}
