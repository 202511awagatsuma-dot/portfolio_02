const STIKA_SEQUENCE_STORAGE_KEY = "stika_sequences";
const STIKA_SEQUENCE_DRAFT_KEY = "stika_sequence_draft";
const STIKA_SEQUENCE_LIST_PATH = "/sequence-list.html";
const STIKA_SEQUENCE_DETAIL_PATH = "/sequence-detail.html";
const STIKA_SEQUENCE_SETUP_PATH = "/sequence/setup";
const STIKA_DYNAMIC_SECTIONS_STORAGE_PREFIX = "stika_dynamic_sections_";
const STIKA_REMOVED_SECTIONS_STORAGE_PREFIX = "stika_removed_sections_";
const STIKA_SECTION_ORDER_STORAGE_PREFIX = "stika_section_order_";
const STIKA_SECTION_DURATIONS_STORAGE_PREFIX = "stika_section_durations_";
const STIKA_SECTION_DURATION_OPTIONS = [3, 5, 8, 10, 12, 15, 20, 25, 30];
const STIKA_ALLOWED_SECTION_CATEGORIES = ["breathing", "warming-up", "sun-salutation", "standing", "peak", "backbend", "seated", "relaxation"];
const STIKA_SECTION_LABELS = {
    breathing: "呼吸法",
    "warming-up": "Warming UP",
    "sun-salutation": "太陽礼拝",
    standing: "立位",
    peak: "ピークポーズ",
    backbend: "後屈",
    seated: "座位",
    relaxation: "リラクゼーション"
};

document.addEventListener("DOMContentLoaded", () => {
    runInitializer(initPeakPoseField);
    runInitializer(initGrowthCalendar);
    runInitializer(initSequenceTabs);
    runInitializer(initSectionDurationPicker);
    runInitializer(initBreathingModal);
    runInitializer(initWarmingUpModal);
    runInitializer(initAsanaCandidateSelectionState);
    runInitializer(initAsanaCardSortable);
    runInitializer(initSunSalutationModal);
    runInitializer(initPeakPoseModal);
    runInitializer(initBackbendModal);
    runInitializer(initSeatedModal);
    runInitializer(initRelaxationModal);
    runInitializer(initStandingAsanaPicker);
    runInitializer(initDynamicSectionManager);
    runInitializer(initDynamicSectionsOnConfirmPage);
    runInitializer(initSequenceConfirmNavigation);
    runInitializer(initSequenceListNavigation);
    runInitializer(initSequenceSetupDraft);
    runInitializer(initSequenceLocalSave);
    runInitializer(initSequenceListPage);
    runInitializer(initSequenceDetailPage);
    runInitializer(initSelfCareToggles);
    runInitializer(initSelfCareMoodLog);
    runInitializer(initKnowledgeTabs);
});

function runInitializer(initializer) {
    if (typeof initializer !== "function") {
        return;
    }

    try {
        initializer();
    } catch (error) {
        console.warn(`[stika] initializer failed: ${initializer.name}`, error);
    }
}

function initAsanaCandidateSelectionState() {
    const candidateSelector = ".sequence-comp-modal .warming-up-modal__master-button";
    const selectedClass = "asana-option-selected";

    const markSelected = (button) => {
        if (!button?.matches(candidateSelector)) {
            return;
        }

        const modal = button.closest(".sequence-comp-modal");
        if (modal?.classList.contains("sequence-duration-modal") || modal?.classList.contains("sequence-comp-modal--section-add")) {
            return;
        }

        const optionList = button.closest(".warming-up-modal__master-list");
        optionList?.querySelectorAll(candidateSelector).forEach((candidate) => {
            candidate.classList.toggle(selectedClass, candidate === button);
            candidate.classList.toggle("is-selected", candidate === button);
            candidate.setAttribute("aria-selected", String(candidate === button));
        });

        window.setTimeout(() => {
            if (modal?.hidden) {
                clearSelected(modal);
            }
        }, 180);
    };

    const clearSelected = (modal) => {
        modal?.querySelectorAll(candidateSelector).forEach((candidate) => {
            candidate.classList.remove(selectedClass, "is-selected");
            candidate.setAttribute("aria-selected", "false");
        });
    };

    document.querySelectorAll(candidateSelector).forEach((button) => {
        button.setAttribute("aria-selected", button.classList.contains(selectedClass) || button.classList.contains("is-selected") ? "true" : "false");
    });

    document.addEventListener("pointerdown", (event) => {
        markSelected(event.target.closest(candidateSelector));
    });

    document.addEventListener("submit", (event) => {
        markSelected(event.target.querySelector(candidateSelector));
    }, true);

    document.querySelectorAll(".sequence-comp-modal").forEach((modal) => {
        const observer = new MutationObserver(() => {
            if (modal.hidden) {
                window.setTimeout(() => clearSelected(modal), 180);
            }
        });

        observer.observe(modal, { attributes: true, attributeFilter: ["hidden"] });
    });
}

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
    const reportScreen = document.querySelector(".report-screen");
    const reportMoodModal = document.getElementById("reportMoodModal");
    const reportMoodModalBackdrop = document.getElementById("reportMoodModalBackdrop");
    const reportMoodModalCloseButton = document.getElementById("reportMoodModalCloseButton");
    const reportMoodModalOkButton = document.getElementById("reportMoodModalOkButton");
    const reportMoodModalDate = document.getElementById("reportMoodModalDate");
    const reportMoodModalMood = document.getElementById("reportMoodModalMood");
    const reportMoodModalMemo = document.getElementById("reportMoodModalMemo");

    if (!calendarRoot || !calendarGrid || !monthLabel || navButtons.length === 0 || !reportScreen) {
        return;
    }

    const today = createDateOnly(new Date());
    let currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    let selectedDate = null;
    let monthMoodLogDates = new Set();
    let monthMoodLogMap = new Map();
    let fetchSerial = 0;
    const moodLabels = {
        good: "良い",
        normal: "普通",
        tired: "疲れ気味"
    };

    const closeMoodLogModal = () => {
        if (!reportMoodModal) {
            return;
        }
        reportMoodModal.hidden = true;
        reportMoodModal.classList.remove("is-open");
        reportMoodModal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
    };

    const openMoodLogModal = (isoDate, logItem) => {
        if (!reportMoodModal || !reportMoodModalDate || !reportMoodModalMood || !reportMoodModalMemo) {
            return;
        }
        const [year, month, day] = isoDate.split("-").map((value) => Number.parseInt(value, 10));
        const displayDate = Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)
            ? new Date(year, month - 1, day)
            : new Date(isoDate);
        reportMoodModalDate.textContent = new Intl.DateTimeFormat("ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric"
        }).format(displayDate);
        reportMoodModalMood.textContent = moodLabels[logItem?.mood] || "-";
        reportMoodModalMemo.textContent = logItem?.memo || "メモはありません";
        reportMoodModal.hidden = false;
        reportMoodModal.classList.add("is-open");
        reportMoodModal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
    };

    const fetchMoodLogByDate = async (isoDate) => {
        const response = await fetch(`/api/self-care/mood-logs/by-date?date=${encodeURIComponent(isoDate)}`);
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.exists) {
            return null;
        }
        return payload;
    };

    const bindCloseHandler = (element) => {
        element?.addEventListener("click", (event) => {
            event.preventDefault();
            closeMoodLogModal();
        });
    };

    bindCloseHandler(reportMoodModalBackdrop);
    bindCloseHandler(reportMoodModalCloseButton);
    bindCloseHandler(reportMoodModalOkButton);
    reportMoodModal?.addEventListener("click", (event) => {
        if (event.target === reportMoodModal) {
            closeMoodLogModal();
        }
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && reportMoodModal && !reportMoodModal.hidden) {
            closeMoodLogModal();
        }
    });

    navButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const direction = button.dataset.calendarNav === "next" ? 1 : -1;
            currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1);
            closeMoodLogModal();
            updateMonthMoodLogsAndRender();
        });
    });

    async function updateMonthMoodLogsAndRender() {
        const currentFetchId = fetchSerial + 1;
        fetchSerial = currentFetchId;

        try {
            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth() + 1;
            const response = await fetch(`/api/self-care/mood-logs/month?year=${year}&month=${month}`);
            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(payload?.message || "Failed to fetch month mood logs.");
            }

            const dates = Array.isArray(payload?.dates) ? payload.dates : [];
            const logs = Array.isArray(payload?.logs) ? payload.logs : [];
            monthMoodLogDates = new Set(dates);
            monthMoodLogMap = new Map(
                logs
                    .filter((entry) => typeof entry?.date === "string")
                    .map((entry) => [entry.date, entry]));
        } catch (error) {
            console.warn("[stika] failed to fetch month mood logs", error);
            monthMoodLogDates = new Set();
            monthMoodLogMap = new Map();
        }

        if (currentFetchId !== fetchSerial) {
            return;
        }

        renderCalendar();
    }

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
            const hasMoodLog = monthMoodLogDates.has(isoDate);

            const button = document.createElement("button");
            button.type = "button";
            button.className = "calendar-day";
            button.dataset.date = isoDate;
            button.setAttribute("role", "gridcell");
            button.setAttribute("aria-label", `${isoDate}${hasMoodLog ? " 記録あり" : ""}${isToday ? " 今日" : ""}`);
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
            if (hasMoodLog) {
                button.classList.add("has-mood-log");
                button.classList.add("calendar-day--has-record");
            }

            button.innerHTML = `<span class="calendar-day__number">${date.getDate()}</span>`;
            button.addEventListener("click", async () => {
                selectedDate = isoDate;
                renderCalendar();
                if (!hasMoodLog) {
                    return;
                }
                const moodLog = monthMoodLogMap.get(isoDate) || await fetchMoodLogByDate(isoDate);
                if (!moodLog) {
                    return;
                }
                openMoodLogModal(isoDate, moodLog);
            });

            calendarGrid.appendChild(button);
        }
    }

    updateMonthMoodLogsAndRender();
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

function initSelfCareToggles() {
    const toggles = document.querySelectorAll("[data-self-care-toggle]");

    if (toggles.length === 0) {
        return;
    }

    toggles.forEach((toggle) => {
        const label = toggle.querySelector(".self-care-toggle__label");

        const syncState = () => {
            const isOn = toggle.classList.contains("is-on");
            toggle.setAttribute("aria-checked", String(isOn));

            if (label) {
                label.textContent = isOn ? "ON" : "OFF";
            }
        };

        toggle.addEventListener("click", () => {
            toggle.classList.toggle("is-on");
            syncState();
        });

        syncState();
    });
}

function initSelfCareMoodLog() {
    const card = document.getElementById("selfCareMoodCard");
    const form = document.getElementById("selfCareMoodForm");
    const noteField = document.getElementById("selfCareNote");
    const recordButton = document.getElementById("selfCareRecordButton");
    const feedback = document.getElementById("selfCareMoodFeedback");
    const registeredView = document.getElementById("selfCareMoodRegistered");
    const registeredMoodLabel = document.getElementById("selfCareRegisteredMoodLabel");
    const registeredMemo = document.getElementById("selfCareRegisteredMemo");
    const editButton = document.getElementById("selfCareEditButton");
    const deleteButton = document.getElementById("selfCareDeleteButton");
    const deleteModal = document.getElementById("selfCareDeleteModal");
    const deleteModalBackdrop = document.getElementById("selfCareDeleteModalBackdrop");
    const deleteCancelButton = document.getElementById("selfCareDeleteCancelButton");
    const deleteConfirmButton = document.getElementById("selfCareDeleteConfirmButton");
    const completeModal = document.getElementById("selfCareCompleteModal");
    const completeModalBackdrop = document.getElementById("selfCareCompleteModalBackdrop");
    const completeCloseButton = document.getElementById("selfCareCompleteCloseButton");
    const completeReportButton = document.getElementById("selfCareCompleteReportButton");
    const moodInputs = document.querySelectorAll("input[name='todayMood']");

    if (!card || !form || !noteField || !recordButton || !registeredView || !registeredMoodLabel || !registeredMemo
        || !editButton || !deleteButton || !deleteModal || !deleteModalBackdrop || !deleteCancelButton
        || !deleteConfirmButton || !completeModal || !completeModalBackdrop || !completeCloseButton
        || !completeReportButton || moodInputs.length === 0) {
        return;
    }

    const moodLabels = {
        good: "良い",
        normal: "普通",
        tired: "疲れ気味"
    };

    let currentLog = null;
    let isEditMode = false;
    let isSubmitting = false;

    const getSelectedMood = () => document.querySelector("input[name='todayMood']:checked")?.value || "";

    const setSelectedMood = (moodValue) => {
        moodInputs.forEach((input) => {
            input.checked = input.value === moodValue;
        });
    };

    const normalizeMemo = (memo) => (typeof memo === "string" ? memo.trim() : "");

    const setFeedback = (message, isError = false) => {
        if (!feedback) {
            return;
        }

        feedback.textContent = message || "";
        feedback.classList.toggle("is-error", Boolean(isError && message));
    };

    const closeDeleteModal = () => {
        deleteModal.hidden = true;
        if (completeModal.hidden) {
            document.body.classList.remove("modal-open");
        }
    };

    const openDeleteModal = () => {
        deleteModal.hidden = false;
        document.body.classList.add("modal-open");
    };

    const closeCompleteModal = () => {
        completeModal.hidden = true;
        if (deleteModal.hidden) {
            document.body.classList.remove("modal-open");
        }
    };

    const openCompleteModal = () => {
        completeModal.hidden = false;
        document.body.classList.add("modal-open");
    };

    closeDeleteModal();
    closeCompleteModal();

    const renderState = () => {
        const hasLog = Boolean(currentLog);
        const showEditForm = !hasLog || isEditMode;

        form.hidden = !showEditForm;
        recordButton.hidden = !showEditForm;
        registeredView.hidden = !hasLog || isEditMode;

        if (showEditForm) {
            recordButton.textContent = hasLog ? "保存する" : "記録する";
        }

        if (hasLog) {
            registeredMoodLabel.textContent = moodLabels[currentLog.mood] || "-";
            registeredMemo.textContent = currentLog.memo || "（メモなし）";
        } else {
            setSelectedMood("good");
            noteField.value = "";
        }
    };

    const applyLogToForm = () => {
        if (!currentLog) {
            setSelectedMood("good");
            noteField.value = "";
            return;
        }

        setSelectedMood(currentLog.mood || "good");
        noteField.value = currentLog.memo || "";
    };

    const fetchMoodLog = async () => {
        const response = await fetch("/api/self-care/mood-logs/today");
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
            throw new Error(payload?.message || "今日の気分ログの取得に失敗しました。");
        }

        return payload;
    };

    const saveMoodLog = async (method, mood, memo) => {
        const response = await fetch("/api/self-care/mood-logs/today", {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mood, memo })
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
            const error = new Error(payload?.message || "気分ログの保存に失敗しました。");
            error.status = response.status;
            throw error;
        }

        return payload;
    };

    const deleteMoodLog = async () => {
        const response = await fetch("/api/self-care/mood-logs/today", { method: "DELETE" });
        if (!response.ok && response.status !== 404) {
            const payload = await response.json().catch(() => null);
            throw new Error(payload?.message || "気分ログの削除に失敗しました。");
        }
    };

    recordButton.addEventListener("click", async () => {
        if (isSubmitting) {
            return;
        }

        const selectedMood = getSelectedMood();
        if (!moodLabels[selectedMood]) {
            setFeedback("気分を選択してください。", true);
            return;
        }

        isSubmitting = true;
        recordButton.disabled = true;
        setFeedback("");

        try {
            const method = currentLog && isEditMode ? "PUT" : "POST";
            const saved = await saveMoodLog(method, selectedMood, normalizeMemo(noteField.value) || null);
            currentLog = saved?.exists ? saved : null;
            isEditMode = false;
            applyLogToForm();
            renderState();
            openCompleteModal();
            setFeedback(method === "POST" ? "今日の気分を記録しました。" : "今日の気分を更新しました。");
        } catch (error) {
            if (error?.status === 409) {
                setFeedback("今日の気分はすでに登録されています。編集から更新してください。", true);
            } else {
                setFeedback(error?.message || "処理に失敗しました。時間をおいて再度お試しください。", true);
            }
        } finally {
            isSubmitting = false;
            recordButton.disabled = false;
        }
    });

    editButton.addEventListener("click", () => {
        if (!currentLog) {
            return;
        }

        isEditMode = true;
        applyLogToForm();
        renderState();
        setFeedback("");
    });

    deleteButton.addEventListener("click", () => {
        if (!currentLog) {
            return;
        }
        openDeleteModal();
    });

    deleteModalBackdrop.addEventListener("click", closeDeleteModal);
    deleteCancelButton.addEventListener("click", closeDeleteModal);
    completeModalBackdrop.addEventListener("click", closeCompleteModal);
    completeCloseButton.addEventListener("click", closeCompleteModal);
    completeReportButton.addEventListener("click", () => {
        window.location.href = "/report.html";
    });

    deleteConfirmButton.addEventListener("click", async () => {
        if (isSubmitting) {
            return;
        }

        isSubmitting = true;
        deleteConfirmButton.disabled = true;
        setFeedback("");

        try {
            await deleteMoodLog();
            currentLog = null;
            isEditMode = false;
            applyLogToForm();
            renderState();
            closeDeleteModal();
            setFeedback("今日の気分ログを削除しました。");
        } catch (error) {
            setFeedback(error?.message || "削除に失敗しました。時間をおいて再度お試しください。", true);
        } finally {
            isSubmitting = false;
            deleteConfirmButton.disabled = false;
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") {
            return;
        }
        if (!deleteModal.hidden) {
            closeDeleteModal();
        }
        if (!completeModal.hidden) {
            closeCompleteModal();
        }
    });

    (async () => {
        setFeedback("読み込み中...");

        try {
            const payload = await fetchMoodLog();
            currentLog = payload?.exists ? payload : null;
            isEditMode = false;
            applyLogToForm();
            renderState();
            setFeedback("");
        } catch (error) {
            setFeedback(error?.message || "今日の気分ログを読み込めませんでした。", true);
            currentLog = null;
            isEditMode = false;
            renderState();
        }
    })();
}

function initKnowledgeTabs() {
    const pageRoot = document.getElementById("knowledgePage");
    const tabs = Array.from(document.querySelectorAll("[data-knowledge-tab]"));
    const panels = Array.from(document.querySelectorAll("[data-knowledge-panel]"));

    if (!pageRoot || tabs.length === 0 || panels.length === 0) {
        return;
    }

    const activateTab = (tabKey) => {
        tabs.forEach((tab) => {
            const isActive = tab.dataset.knowledgeTab === tabKey;
            tab.classList.toggle("is-active", isActive);
            tab.setAttribute("aria-selected", String(isActive));
        });

        panels.forEach((panel) => {
            panel.hidden = panel.dataset.knowledgePanel !== tabKey;
        });
    };

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            activateTab(tab.dataset.knowledgeTab || "");
        });
    });

    activateTab("philosophy");
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

function initBreathingModal() {
    const section = document.querySelector(".sequence-comp-section[data-category='breathing']");
    const modal = document.getElementById("breathingModal");
    const dialog = modal?.querySelector(".sequence-comp-modal__dialog");
    const triggerButton = section?.querySelector("#breathingModalOpen");
    const closeButton = document.getElementById("breathingModalClose");
    const deleteButtons = document.querySelectorAll("[data-breathing-delete]");

    deleteButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            event.stopPropagation();

            const name = button.dataset.name || "この呼吸法";

            if (!window.confirm(`${name}を削除しますか？`)) {
                event.preventDefault();
            }
        });
    });

    if (!section || !modal || !dialog || !closeButton || !triggerButton) {
        return;
    }

    const closeModal = () => {
        modal.hidden = true;
        modal.setAttribute("aria-hidden", "true");
        modal.classList.remove("open", "is-open", "active", "show");
        document.body.classList.remove("modal-open");
    };

    const openModal = () => {
        modal.hidden = false;
        modal.setAttribute("aria-hidden", "false");
        modal.classList.remove("open", "is-open", "active", "show");
        document.body.classList.add("modal-open");
    };

    closeModal();

    triggerButton.addEventListener("click", (event) => {
        event.preventDefault();
        openModal();
    });

    closeButton.addEventListener("click", closeModal);

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    dialog.addEventListener("click", (event) => {
        event.stopPropagation();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) {
            closeModal();
        }
    });
}

function initSectionDurationPicker() {
    const screen = document.querySelector(".sequence-comp-screen");
    const sectionTimes = document.querySelectorAll(".sequence-comp-screen .sequence-comp-section__time");
    const sequenceId = resolveEditSequenceId();
    const sectionDurations = loadSectionDurationsState(sequenceId);
    const sectionsRoot = screen?.querySelector(".sequence-comp-sections");

    if (!screen || sectionTimes.length === 0) {
        return;
    }

    const modal = document.createElement("div");
    modal.className = "sequence-comp-modal sequence-duration-modal";
    modal.id = "sectionDurationModal";
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
        <div class="sequence-comp-modal__dialog warming-up-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="sectionDurationModalTitle">
            <button class="sequence-comp-modal__close" type="button" aria-label="モーダルを閉じる">×</button>
            <div class="sequence-comp-modal__header">
                <h3 class="sequence-comp-modal__title" id="sectionDurationModalTitle">時間を選択</h3>
            </div>
            <div class="warming-up-modal__content">
                <div class="warming-up-modal__master-list" id="sectionDurationOptionList"></div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const closeButton = modal.querySelector(".sequence-comp-modal__close");
    const optionList = modal.querySelector("#sectionDurationOptionList");
    let activeTimeElement = null;
    let activeSectionId = "";

    const parseMinutes = (text) => {
        const match = String(text || "").match(/\d+/);
        return match ? Number.parseInt(match[0], 10) : null;
    };

    const getDurationLabel = (minutes) => (Number.isFinite(minutes) ? `${minutes}分` : "時間を選択");

    const closeModal = () => {
        modal.hidden = true;
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
        activeTimeElement = null;
        activeSectionId = "";
    };

    const applyDurationToSection = (timeElement, minutes) => {
        if (!timeElement || !Number.isFinite(minutes)) {
            return;
        }

        const section = timeElement.closest(".sequence-comp-section");
        const sectionId = ensureSectionIdentity(section);

        timeElement.textContent = getDurationLabel(minutes);
        timeElement.dataset.durationMinutes = String(minutes);

        if (sectionId) {
            timeElement.dataset.sectionId = sectionId;
            sectionDurations[sectionId] = minutes;
            saveSectionDurationsState(sequenceId, sectionDurations);
        }

        if (section?.dataset.dynamicSection === "true" && sequenceId && sectionsRoot) {
            saveDynamicSectionsState(sequenceId, sectionsRoot);
            saveSectionOrderState(sequenceId, sectionsRoot);
        }
    };

    const renderOptions = (selectedMinutes) => {
        optionList.innerHTML = "";

        STIKA_SECTION_DURATION_OPTIONS.forEach((minutes) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "warming-up-modal__master-button sequence-duration-option";
            button.textContent = `${minutes}分`;

            const isSelected = selectedMinutes === minutes;
            button.classList.toggle("is-selected", isSelected);
            button.setAttribute("aria-pressed", String(isSelected));

            button.addEventListener("click", () => {
                if (!activeTimeElement || !activeSectionId) {
                    closeModal();
                    return;
                }

                applyDurationToSection(activeTimeElement, minutes);
                closeModal();
            });

            optionList.appendChild(button);
        });
    };

    const openModal = (timeElement) => {
        const sectionId = normalizeText(timeElement?.dataset.sectionId);
        if (!sectionId) {
            return;
        }

        activeTimeElement = timeElement;
        activeSectionId = sectionId;
        const selectedMinutes = parseMinutes(timeElement.dataset.durationMinutes || timeElement.textContent);
        renderOptions(selectedMinutes);
        modal.hidden = false;
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
    };

    const bindDurationPickerToTimeElement = (timeElement) => {
        if (!timeElement || timeElement.dataset.durationPickerBound === "true") {
            return;
        }

        const section = timeElement.closest(".sequence-comp-section");
        const sectionId = ensureSectionIdentity(section);
        timeElement.dataset.sectionId = sectionId;

        const currentMinutes = parseMinutes(timeElement.dataset.durationMinutes || timeElement.textContent);
        const storedMinutes = Number.parseInt(sectionDurations[sectionId], 10);
        const initialMinutes = Number.isFinite(storedMinutes) ? storedMinutes : currentMinutes;

        if (initialMinutes) {
            timeElement.dataset.durationMinutes = String(initialMinutes);
            timeElement.textContent = getDurationLabel(initialMinutes);
        } else {
            timeElement.textContent = "時間を選択";
        }

        timeElement.classList.add("sequence-comp-section__time--selectable");
        timeElement.setAttribute("role", "button");
        timeElement.setAttribute("tabindex", "0");
        timeElement.setAttribute("aria-haspopup", "dialog");
        timeElement.setAttribute("aria-controls", "sectionDurationModal");
        timeElement.setAttribute("aria-label", "時間を選択");
        timeElement.dataset.durationPickerBound = "true";
    };

    sectionTimes.forEach(bindDurationPickerToTimeElement);
    window.__stikaBindDurationPickerToTimeElement = bindDurationPickerToTimeElement;

    closeButton?.addEventListener("click", closeModal);

    screen.addEventListener("click", (event) => {
        const timeElement = event.target.closest(".sequence-comp-section__time--selectable");
        if (!timeElement || !screen.contains(timeElement)) {
            return;
        }

        event.preventDefault();
        openModal(timeElement);
    });

    screen.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") {
            return;
        }

        const timeElement = event.target.closest(".sequence-comp-section__time--selectable");
        if (!timeElement || !screen.contains(timeElement)) {
            return;
        }

        event.preventDefault();
        openModal(timeElement);
    });

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) {
            closeModal();
        }
    });
}

function initWarmingUpModal() {
    const section = document.querySelector(".sequence-comp-section[data-category='warming-up']");
    const modal = document.getElementById("warmingUpModal");
    const dialog = modal?.querySelector(".warming-up-modal__dialog");
    const triggerButton = section?.querySelector("#warmingUpModalOpen");
    const closeButton = document.getElementById("warmingUpModalClose");
    const customToggle = document.getElementById("warmingUpCustomToggle");
    const customForm = document.getElementById("warmingUpCustomForm");
    const categorySelect = document.getElementById("warmingUpCategory");
    const standingSubcategoryField = document.getElementById("warmingUpStandingSubcategoryField");
    const standingSubcategorySelect = document.getElementById("warmingUpStandingSubcategory");
    const deleteButtons = document.querySelectorAll("[data-warming-up-delete]");

    deleteButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            event.stopPropagation();

            const name = button.dataset.name || "この Warming UP";
            if (!window.confirm(`${name}を削除しますか？`)) {
                event.preventDefault();
            }
        });
    });

    if (!section || !modal || !dialog || !closeButton || !triggerButton) {
        return;
    }

    // Force closed state on initial render (create/edit both)
    const forceClosedState = () => {
        modal.hidden = true;
        modal.setAttribute("aria-hidden", "true");
        modal.classList.remove("open", "is-open", "active", "show");
        document.body.classList.remove("modal-open");
    };

    const openModal = () => {
        modal.hidden = false;
        modal.setAttribute("aria-hidden", "false");
        modal.classList.remove("open", "is-open", "active", "show");
        document.body.classList.add("modal-open");
    };

    const closeModal = () => {
        forceClosedState();
    };

    forceClosedState();

    triggerButton.addEventListener("click", (event) => {
        event.preventDefault();
        openModal();
    });

    closeButton.addEventListener("click", closeModal);

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    dialog.addEventListener("click", (event) => {
        event.stopPropagation();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) {
            closeModal();
        }
    });

    if (customToggle && customForm) {
        customToggle.addEventListener("click", () => {
            const shouldExpand = customForm.hidden;
            customForm.hidden = !shouldExpand ? true : false;
            customToggle.setAttribute("aria-expanded", String(shouldExpand));
        });
    }

    if (categorySelect && standingSubcategoryField && standingSubcategorySelect) {
        const syncStandingSubcategoryVisibility = () => {
            const shouldShow = categorySelect.value === "standing";
            standingSubcategoryField.hidden = !shouldShow;
            standingSubcategorySelect.disabled = !shouldShow;
            standingSubcategorySelect.required = shouldShow;

            if (!shouldShow) {
                standingSubcategorySelect.value = "";
            }
        };

        categorySelect.addEventListener("change", syncStandingSubcategoryVisibility);
        syncStandingSubcategoryVisibility();
    }
}

function initAsanaCardSortable() {
    if (typeof window.Sortable === "undefined") {
        return;
    }

    const lists = document.querySelectorAll("[data-asana-sortable]");
    lists.forEach(initializeAsanaSortableList);
}

function initializeAsanaSortableList(list) {
    if (!list || list.dataset.sortableInitialized === "true" || typeof window.Sortable === "undefined") {
        return;
    }

    list.dataset.sortableInitialized = "true";
    updateAsanaSortOrderFields(list);

    window.Sortable.create(list, {
        animation: 150,
        handle: ".asana-drag-handle",
        draggable: ".asana-card",
        ghostClass: "asana-card-ghost",
        chosenClass: "asana-card-chosen",
        dragClass: "asana-card-dragging",
        forceFallback: false,
        fallbackOnBody: true,
        swapThreshold: 0.65,
        onStart: () => {
            list.classList.add("is-sorting");
        },
        onEnd: () => {
            list.classList.remove("is-sorting");
            const orderedAsanaIds = getOrderedAsanaIds(list);
            updateAsanaSortOrderFields(list);
            persistAsanaOrder(list, orderedAsanaIds);
        }
    });
}

function getOrderedAsanaIds(list) {
    return Array.from(list.querySelectorAll(".asana-card"))
        .map((item) => normalizeText(item.dataset.asanaId || item.dataset.itemId || item.dataset.id))
        .filter(Boolean);
}

function updateAsanaSortOrderFields(list) {
    Array.from(list.querySelectorAll(".asana-card")).forEach((item, index) => {
        const nextSortOrder = index + 1;
        const labelOrder = String(nextSortOrder).padStart(2, "0");
        item.dataset.order = String(nextSortOrder);
        item.dataset.index = String(index);

        const handle = item.querySelector(".asana-drag-handle");
        if (handle) {
            handle.textContent = `${labelOrder} ≡`;
        }

        let sortOrderInput = item.querySelector("input[data-asana-sort-order]");
        if (!sortOrderInput) {
            sortOrderInput = document.createElement("input");
            sortOrderInput.type = "hidden";
            sortOrderInput.dataset.asanaSortOrder = "true";
            sortOrderInput.name = "sortOrder";
            item.appendChild(sortOrderInput);
        }
        sortOrderInput.value = String(nextSortOrder);
    });
}

async function persistAsanaOrder(list, orderedAsanaIds) {
    const reorderUrl = normalizeText(list.dataset.reorderUrl);
    const reorderParam = normalizeText(list.dataset.reorderParam);
    if (!reorderUrl || !reorderParam || orderedAsanaIds.length < 2) {
        return;
    }

    const params = new URLSearchParams();
    orderedAsanaIds.forEach((id) => {
        params.append(reorderParam, id);
    });
    params.append("mode", normalizeText(list.dataset.mode) || "edit");

    const csrfToken = normalizeText(
        document.querySelector("meta[name='_csrf']")?.getAttribute("content")
        || document.querySelector("input[name='_csrf']")?.value
    );
    if (csrfToken) {
        params.append("_csrf", csrfToken);
    }

    try {
        const response = await fetch(reorderUrl, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "X-Requested-With": "XMLHttpRequest",
                ...(csrfToken ? { "X-CSRF-TOKEN": csrfToken } : {})
            },
            body: params.toString()
        });

        if (!response.ok) {
            throw new Error(`asana reorder failed: ${response.status}`);
        }
    } catch (_error) {
        // Keep the updated DOM order visible even if persistence fails.
    }
}

function initSunSalutationModal() {
    const section = document.querySelector(".sequence-comp-section[data-category='sun-salutation']");
    const modal = document.getElementById("sunSalutationModal");
    const dialog = modal?.querySelector(".sequence-comp-modal__dialog");
    const triggerButton = section?.querySelector("#sunSalutationModalOpen");
    const closeButton = document.getElementById("sunSalutationModalClose");
    const customToggle = document.getElementById("sunSalutationCustomToggle");
    const customForm = document.getElementById("sunSalutationCustomForm");
    const deleteButtons = document.querySelectorAll("[data-sun-salutation-delete]");

    deleteButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            event.stopPropagation();

            const name = button.dataset.name || "この太陽礼拝";
            if (!window.confirm(`${name}を削除しますか？`)) {
                event.preventDefault();
            }
        });
    });

    if (!section || !modal || !dialog || !closeButton || !triggerButton) {
        return;
    }

    const closeModal = () => {
        modal.hidden = true;
        modal.setAttribute("aria-hidden", "true");
        modal.classList.remove("open", "is-open", "active", "show");
        document.body.classList.remove("modal-open");
    };

    const openModal = () => {
        modal.hidden = false;
        modal.setAttribute("aria-hidden", "false");
        modal.classList.remove("open", "is-open", "active", "show");
        document.body.classList.add("modal-open");
    };

    closeModal();

    triggerButton.addEventListener("click", (event) => {
        event.preventDefault();
        openModal();
    });

    closeButton.addEventListener("click", closeModal);

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    dialog.addEventListener("click", (event) => {
        event.stopPropagation();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) {
            closeModal();
        }
    });

    if (customToggle && customForm) {
        customToggle.addEventListener("click", () => {
            const shouldExpand = customForm.hidden;
            customForm.hidden = !shouldExpand;
            customToggle.setAttribute("aria-expanded", String(shouldExpand));
        });
    }
}

function initPeakPoseModal() {
    const section = document.querySelector(".sequence-comp-section[data-category='peak']");
    const modal = document.getElementById("peakPoseModal");
    const dialog = modal?.querySelector(".sequence-comp-modal__dialog");
    const triggerButton = section?.querySelector("#peakPoseModalOpen");
    const closeButton = document.getElementById("peakPoseModalClose");
    const customToggle = document.getElementById("peakPoseCustomToggle");
    const customForm = document.getElementById("peakPoseCustomForm");
    const deleteButtons = document.querySelectorAll("[data-peak-pose-delete]");

    deleteButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            event.stopPropagation();

            const name = button.dataset.name || "このピークポーズ";
            if (!window.confirm(`${name}を削除しますか？`)) {
                event.preventDefault();
            }
        });
    });

    if (!section || !modal || !dialog || !closeButton || !triggerButton) {
        return;
    }

    const closeModal = () => {
        modal.hidden = true;
        modal.setAttribute("aria-hidden", "true");
        modal.classList.remove("open", "is-open", "active", "show");
        document.body.classList.remove("modal-open");
    };

    const openModal = () => {
        modal.hidden = false;
        modal.setAttribute("aria-hidden", "false");
        modal.classList.remove("open", "is-open", "active", "show");
        document.body.classList.add("modal-open");
    };

    closeModal();

    triggerButton.addEventListener("click", (event) => {
        event.preventDefault();
        openModal();
    });

    closeButton.addEventListener("click", closeModal);

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    dialog.addEventListener("click", (event) => {
        event.stopPropagation();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) {
            closeModal();
        }
    });

    if (customToggle && customForm) {
        customToggle.addEventListener("click", () => {
            const shouldExpand = customForm.hidden;
            customForm.hidden = !shouldExpand;
            customToggle.setAttribute("aria-expanded", String(shouldExpand));
        });
    }
}

function initBackbendModal() {
    const section = document.querySelector(".sequence-comp-section[data-category='backbend']");
    const modal = document.getElementById("backbendModal");
    const dialog = modal?.querySelector(".sequence-comp-modal__dialog");
    const triggerButton = section?.querySelector("#backbendModalOpen");
    const closeButton = document.getElementById("backbendModalClose");
    const customToggle = document.getElementById("backbendCustomToggle");
    const customForm = document.getElementById("backbendCustomForm");
    const deleteButtons = document.querySelectorAll("[data-backbend-delete]");

    deleteButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            event.stopPropagation();

            const name = button.dataset.name || "この後屈";
            if (!window.confirm(`${name}を削除しますか？`)) {
                event.preventDefault();
            }
        });
    });

    if (!section || !modal || !dialog || !closeButton || !triggerButton) {
        return;
    }

    const closeModal = () => {
        modal.hidden = true;
        modal.setAttribute("aria-hidden", "true");
        modal.classList.remove("open", "is-open", "active", "show");
        document.body.classList.remove("modal-open");
    };

    const openModal = () => {
        modal.hidden = false;
        modal.setAttribute("aria-hidden", "false");
        modal.classList.remove("open", "is-open", "active", "show");
        document.body.classList.add("modal-open");
    };

    closeModal();

    triggerButton.addEventListener("click", (event) => {
        event.preventDefault();
        openModal();
    });

    closeButton.addEventListener("click", closeModal);

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    dialog.addEventListener("click", (event) => {
        event.stopPropagation();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) {
            closeModal();
        }
    });

    if (customToggle && customForm) {
        customToggle.addEventListener("click", () => {
            const shouldExpand = customForm.hidden;
            customForm.hidden = !shouldExpand;
            customToggle.setAttribute("aria-expanded", String(shouldExpand));
        });
    }
}

function initSeatedModal() {
    const section = document.querySelector(".sequence-comp-section[data-category='seated']");
    const modal = document.getElementById("seatedModal");
    const dialog = modal?.querySelector(".sequence-comp-modal__dialog");
    const triggerButton = section?.querySelector("#seatedModalOpen");
    const closeButton = document.getElementById("seatedModalClose");
    const customToggle = document.getElementById("seatedCustomToggle");
    const customForm = document.getElementById("seatedCustomForm");
    const deleteButtons = document.querySelectorAll("[data-seated-delete]");

    deleteButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            event.stopPropagation();

            const name = button.dataset.name || "この座位";
            if (!window.confirm(`${name}を削除しますか？`)) {
                event.preventDefault();
            }
        });
    });

    if (!section || !modal || !dialog || !closeButton || !triggerButton) {
        return;
    }

    const closeModal = () => {
        modal.hidden = true;
        modal.setAttribute("aria-hidden", "true");
        modal.classList.remove("open", "is-open", "active", "show");
        document.body.classList.remove("modal-open");
    };

    const openModal = () => {
        modal.hidden = false;
        modal.setAttribute("aria-hidden", "false");
        modal.classList.remove("open", "is-open", "active", "show");
        document.body.classList.add("modal-open");
    };

    closeModal();

    triggerButton.addEventListener("click", (event) => {
        event.preventDefault();
        openModal();
    });

    closeButton.addEventListener("click", closeModal);

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    dialog.addEventListener("click", (event) => {
        event.stopPropagation();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) {
            closeModal();
        }
    });

    if (customToggle && customForm) {
        customToggle.addEventListener("click", () => {
            const shouldExpand = customForm.hidden;
            customForm.hidden = !shouldExpand;
            customToggle.setAttribute("aria-expanded", String(shouldExpand));
        });
    }
}

function initRelaxationModal() {
    const section = document.querySelector(".sequence-comp-section[data-category='relaxation']");
    const modal = document.getElementById("relaxationModal");
    const dialog = modal?.querySelector(".sequence-comp-modal__dialog");
    const triggerButton = section?.querySelector("#relaxationModalOpen");
    const closeButton = document.getElementById("relaxationModalClose");
    const customToggle = document.getElementById("relaxationCustomToggle");
    const customForm = document.getElementById("relaxationCustomForm");
    const deleteButtons = document.querySelectorAll("[data-relaxation-delete]");

    deleteButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            event.stopPropagation();

            const name = button.dataset.name || "このリラクゼーション";
            if (!window.confirm(`${name}を削除しますか？`)) {
                event.preventDefault();
            }
        });
    });

    if (!section || !modal || !dialog || !closeButton || !triggerButton) {
        return;
    }

    const closeModal = () => {
        modal.hidden = true;
        modal.setAttribute("aria-hidden", "true");
        modal.classList.remove("open", "is-open", "active", "show");
        document.body.classList.remove("modal-open");
    };

    const openModal = () => {
        modal.hidden = false;
        modal.setAttribute("aria-hidden", "false");
        modal.classList.remove("open", "is-open", "active", "show");
        document.body.classList.add("modal-open");
    };

    closeModal();

    triggerButton.addEventListener("click", (event) => {
        event.preventDefault();
        openModal();
    });

    closeButton.addEventListener("click", closeModal);

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    dialog.addEventListener("click", (event) => {
        event.stopPropagation();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) {
            closeModal();
        }
    });

    if (customToggle && customForm) {
        customToggle.addEventListener("click", () => {
            const shouldExpand = customForm.hidden;
            customForm.hidden = !shouldExpand;
            customToggle.setAttribute("aria-expanded", String(shouldExpand));
        });
    }
}

function initStandingAsanaPicker() {
    const section = document.querySelector(".sequence-comp-section[data-category='standing']");
    const addButton = section?.querySelector("[data-standing-slot]");
    const modal = document.getElementById("standingAsanaModal");
    const dialog = modal?.querySelector(".sequence-comp-modal__dialog");
    const closeButton = document.getElementById("standingAsanaModalClose");
    const candidateButtons = modal?.querySelectorAll("[data-standing-candidate-button]");

    if (!section || !addButton || !modal || !dialog || !closeButton) {
        return;
    }

    const closeModal = () => {
        modal.hidden = true;
        modal.setAttribute("aria-hidden", "true");
        modal.classList.remove("open", "is-open", "active", "show");
        document.body.classList.remove("modal-open");
    };

    const openModal = () => {
        modal.hidden = false;
        modal.setAttribute("aria-hidden", "false");
        modal.classList.remove("open", "is-open", "active", "show");
        document.body.classList.add("modal-open");
    };

    closeModal();

    addButton.addEventListener("click", (event) => {
        event.preventDefault();
        openModal();
    });

    closeButton.addEventListener("click", closeModal);

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    dialog.addEventListener("click", (event) => {
        event.stopPropagation();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) {
            closeModal();
        }
    });

    candidateButtons?.forEach((button) => {
        button.addEventListener("click", () => {
            const selectedName = button.dataset.asanaName?.trim() || "";
            if (!selectedName) {
                closeModal();
                return;
            }

            appendDynamicSectionItem(section, {
                id: createDynamicSectionItemId(),
                name: selectedName,
                source: "candidate"
            }, true);
            closeModal();
        });
    });

    section.addEventListener("click", (event) => {
        const deleteButton = event.target.closest("[data-dynamic-delete]");
        if (!deleteButton || !section.contains(deleteButton)) {
            return;
        }

        const item = deleteButton.closest(".sequence-comp-added-item");
        item?.remove();
        syncDynamicSectionItemOrder(section);
        syncDynamicSectionEmptyState(section);
    });

    syncDynamicSectionEmptyState(section);
}

function initDynamicSectionManager() {
    const screen = document.querySelector(".sequence-comp-screen");
    const sectionsRoot = screen?.querySelector(".sequence-comp-sections");
    const sequenceId = resolveEditSequenceId();

    if (!screen || !sectionsRoot || !sequenceId) {
        return;
    }

    const candidates = getSectionCandidatesFromTabs(screen);
    if (candidates.length === 0) {
        return;
    }

    const templateCache = buildSectionTemplateCache(sectionsRoot);
    const removedSectionIds = new Set(loadRemovedSectionsState(sequenceId));
    const persistState = () => {
        saveDynamicSectionsState(sequenceId, sectionsRoot);
        saveRemovedSectionsState(sequenceId, removedSectionIds);
        saveSectionOrderState(sequenceId, sectionsRoot);
    };

    const syncSectionActionButtons = () => {
        const sections = Array.from(sectionsRoot.querySelectorAll(".sequence-comp-section"));
        const canDelete = sections.length > 1;

        sections.forEach((section, index) => {
            ensureSectionIdentity(section);
            const controls = ensureSectionControlButtons(section);
            const removeButton = controls?.removeButton;
            const moveUpButton = controls?.moveUpButton;
            const moveDownButton = controls?.moveDownButton;

            if (!removeButton) {
                return;
            }

            removeButton.disabled = !canDelete;
            removeButton.setAttribute("aria-disabled", String(!canDelete));
            removeButton.title = canDelete ? "" : "セクションは1つ以上必要です";

            if (moveUpButton) {
                const disableUp = index === 0;
                moveUpButton.disabled = disableUp;
                moveUpButton.setAttribute("aria-disabled", String(disableUp));
            }

            if (moveDownButton) {
                const disableDown = index === sections.length - 1;
                moveDownButton.disabled = disableDown;
                moveDownButton.setAttribute("aria-disabled", String(disableDown));
            }
        });
    };

    const applyRemovedSections = () => {
        if (removedSectionIds.size === 0) {
            return;
        }

        const sections = Array.from(sectionsRoot.querySelectorAll(".sequence-comp-section"));
        sections.forEach((section) => {
            const currentCount = sectionsRoot.querySelectorAll(".sequence-comp-section").length;
            if (currentCount <= 1) {
                return;
            }

            const sectionId = ensureSectionIdentity(section);
            if (removedSectionIds.has(sectionId)) {
                section.remove();
            }
        });
    };

    let activeInsertButton = null;
    const deleteModal = createSectionDeleteModal({
        onConfirm: (targetSection) => {
            if (!targetSection || !sectionsRoot.contains(targetSection)) {
                return;
            }

            if (sectionsRoot.querySelectorAll(".sequence-comp-section").length <= 1) {
                syncSectionActionButtons();
                return;
            }

            const sectionId = ensureSectionIdentity(targetSection);
            targetSection.remove();
            removedSectionIds.add(sectionId);
            persistState();
            syncSectionActionButtons();
        }
    });

    sectionsRoot.querySelectorAll(".sequence-comp-section").forEach((section) => {
        ensureSectionIdentity(section);
        ensureSectionControlButtons(section);
    });

    applyRemovedSections();
    restoreDynamicSections(sequenceId, sectionsRoot, templateCache);

    sectionsRoot.querySelectorAll(".sequence-comp-section").forEach((section) => {
        ensureSectionIdentity(section);
        ensureSectionControlButtons(section);
    });

    applySectionOrderState(sequenceId, sectionsRoot);
    syncSectionActionButtons();

    const addModal = createSectionAddModal(candidates, {
        onCancel: () => {
            activeInsertButton = null;
        },
        onSubmit: (selectedCategory) => {
            if (!selectedCategory || !activeInsertButton) {
                return;
            }

            const insertedSection = insertDynamicSection({
                sectionsRoot,
                insertButton: activeInsertButton,
                category: selectedCategory,
                sectionState: null,
                templateCache
            });

            if (!insertedSection) {
                activeInsertButton = null;
                return;
            }

            ensureSectionIdentity(insertedSection);
            ensureSectionControlButtons(insertedSection);
            persistState();
            syncSectionActionButtons();
            activeInsertButton = null;
        }
    });

    sectionsRoot.addEventListener("click", (event) => {
        const moveButton = event.target.closest("[data-section-move]");

        if (moveButton && sectionsRoot.contains(moveButton)) {
            const section = moveButton.closest(".sequence-comp-section");
            const direction = moveButton.dataset.sectionMove;

            if (!section || (direction !== "up" && direction !== "down") || moveButton.disabled) {
                return;
            }

            event.preventDefault();
            const sections = Array.from(sectionsRoot.querySelectorAll(".sequence-comp-section"));
            const currentIndex = sections.indexOf(section);

            if (currentIndex < 0) {
                return;
            }

            if (direction === "up" && currentIndex > 0) {
                sectionsRoot.insertBefore(section, sections[currentIndex - 1]);
            }

            if (direction === "down" && currentIndex < sections.length - 1) {
                sectionsRoot.insertBefore(sections[currentIndex + 1], section);
            }

            persistState();
            syncSectionActionButtons();
            return;
        }

        const removeButton = event.target.closest("[data-section-remove]");

        if (removeButton && sectionsRoot.contains(removeButton)) {
            const section = removeButton.closest(".sequence-comp-section");
            if (!section || removeButton.disabled) {
                return;
            }

            event.preventDefault();
            deleteModal.open(section);
            return;
        }

        const addButton = event.target.closest(".sequence-comp-add--section-divider");

        if (!addButton || !sectionsRoot.contains(addButton)) {
            return;
        }

        event.preventDefault();
        activeInsertButton = addButton;
        addModal.open();
    });
}

function initDynamicSectionsOnConfirmPage() {
    const confirmPathMatch = window.location.pathname.match(/^\/sequence\/confirm\/(\d+)$/);
    const sequenceId = confirmPathMatch?.[1] || "";
    const list = document.querySelector(".sequence-confirm-list");
    const sectionDurations = loadSectionDurationsState(sequenceId);

    if (!sequenceId || !list) {
        return;
    }

    const removedSectionIds = new Set(loadRemovedSectionsState(sequenceId));
    list.querySelectorAll(".sequence-confirm-card").forEach((card) => {
        if (!card.dataset.sectionId) {
            const category = normalizeText(card.dataset.category) || "section";
            card.dataset.sectionId = `base_${category}`;
        }

        const durationLabel = card.querySelector(".sequence-confirm-card__time");
        const minutes = Number.parseInt(sectionDurations[card.dataset.sectionId], 10);
        if (durationLabel && Number.isFinite(minutes)) {
            durationLabel.textContent = `${minutes}分`;
        }

        if (removedSectionIds.has(card.dataset.sectionId)) {
            card.remove();
        }
    });

    const dynamicSections = loadDynamicSectionsState(sequenceId)
        .slice()
        .sort((a, b) => (a.orderIndex ?? Number.MAX_SAFE_INTEGER) - (b.orderIndex ?? Number.MAX_SAFE_INTEGER));

    dynamicSections.forEach((section) => {
        if (removedSectionIds.has(section.id)) {
            return;
        }
        const card = createConfirmCardFromDynamicSection(section);
        const durationLabel = card.querySelector(".sequence-confirm-card__time");
        const minutes = Number.parseInt(sectionDurations[section.id], 10);
        if (durationLabel && Number.isFinite(minutes)) {
            durationLabel.textContent = `${minutes}分`;
        }
        list.appendChild(card);
    });

    const sectionOrderIds = loadSectionOrderState(sequenceId);
    if (sectionOrderIds.length > 0) {
        const cards = Array.from(list.querySelectorAll(".sequence-confirm-card"));
        const cardMap = new Map(cards.map((card) => [card.dataset.sectionId || "", card]));
        const appended = new Set();

        sectionOrderIds.forEach((sectionId) => {
            const card = cardMap.get(sectionId);
            if (!card || appended.has(card)) {
                return;
            }
            list.appendChild(card);
            appended.add(card);
        });

        cards.forEach((card) => {
            if (appended.has(card)) {
                return;
            }
            list.appendChild(card);
        });
    }

    const emptyNotice = document.querySelector(".sequence-confirm-empty");
    if (emptyNotice) {
        emptyNotice.hidden = list.querySelectorAll(".sequence-confirm-card").length > 0;
    }
}

function createSectionAddModal(candidates, handlers) {
    const existingModal = document.getElementById("sequenceSectionAddModal");
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement("div");
    modal.className = "sequence-comp-modal sequence-comp-modal--section-add";
    modal.id = "sequenceSectionAddModal";
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
        <div class="sequence-comp-modal__dialog warming-up-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="sequenceSectionAddModalTitle">
            <button class="sequence-comp-modal__close" type="button" aria-label="モーダルを閉じる">×</button>
            <div class="sequence-comp-modal__header">
                <h3 class="sequence-comp-modal__title" id="sequenceSectionAddModalTitle">追加するセクションを選択</h3>
            </div>
            <div class="warming-up-modal__content">
                <div class="warming-up-modal__master-list" data-section-add-options role="listbox" aria-multiselectable="false" aria-labelledby="sequenceSectionAddModalTitle"></div>
                <div class="sequence-comp-modal__actions">
                    <button class="sequence-comp-cancel" type="button" data-section-add-cancel>キャンセル</button>
                    <button class="sequence-comp-add sequence-comp-add--inline" type="button" data-section-add-submit disabled>追加する</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const dialog = modal.querySelector(".sequence-comp-modal__dialog");
    const closeButton = modal.querySelector(".sequence-comp-modal__close");
    const cancelButton = modal.querySelector("[data-section-add-cancel]");
    const submitButton = modal.querySelector("[data-section-add-submit]");
    const optionsRoot = modal.querySelector("[data-section-add-options]");
    let selectedCategory = "";

    const close = () => {
        modal.hidden = true;
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
        selectedCategory = "";
        updateOptionState();
        handlers?.onCancel?.();
    };

    const open = () => {
        modal.hidden = false;
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
        selectedCategory = "";
        updateOptionState();
    };

    const updateOptionState = () => {
        const optionButtons = optionsRoot?.querySelectorAll("[data-section-category]") || [];
        optionButtons.forEach((button) => {
            const isSelected = button.dataset.sectionCategory === selectedCategory;
            button.classList.toggle("is-selected", isSelected);
            button.setAttribute("aria-selected", String(isSelected));
        });

        if (submitButton) {
            submitButton.disabled = selectedCategory.length === 0;
        }
    };

    candidates.forEach((candidate) => {
        const optionButton = document.createElement("button");
        optionButton.type = "button";
        optionButton.className = "warming-up-modal__master-button section-option";
        optionButton.dataset.sectionCategory = candidate.category;
        optionButton.setAttribute("role", "option");
        optionButton.setAttribute("aria-selected", "false");
        optionButton.textContent = candidate.label;

        optionButton.addEventListener("click", () => {
            selectedCategory = candidate.category;
            updateOptionState();
        });

        optionsRoot?.appendChild(optionButton);
    });

    submitButton?.addEventListener("click", () => {
        if (!selectedCategory) {
            return;
        }
        handlers?.onSubmit?.(selectedCategory);
        close();
    });

    closeButton?.addEventListener("click", close);
    cancelButton?.addEventListener("click", close);

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            close();
        }
    });

    dialog?.addEventListener("click", (event) => {
        event.stopPropagation();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) {
            close();
        }
    });

    return { open, close };
}

function getSectionCandidatesFromTabs(screen) {
    const tabs = screen.querySelectorAll(".sequence-comp-tab[data-tab]");
    const availableCategories = new Set(
        Array.from(tabs)
            .map((tab) => tab.dataset.tab || "")
            .filter((category) => STIKA_ALLOWED_SECTION_CATEGORIES.includes(category))
    );

    return STIKA_ALLOWED_SECTION_CATEGORIES
        .filter((category) => availableCategories.has(category))
        .map((category) => ({
            category,
            label: STIKA_SECTION_LABELS[category] || category
        }));
}

function insertDynamicSection({ sectionsRoot, insertButton, category, sectionState, templateCache }) {
    const anchorSection = insertButton?.closest(".sequence-comp-section");
    const templateSection =
        sectionsRoot.querySelector(`.sequence-comp-section[data-category='${category}']:not([data-dynamic-section='true'])`) ||
        templateCache?.get(category);

    if (!anchorSection || !templateSection) {
        return null;
    }

    const sectionId = sectionState?.id || createDynamicSectionId();
    const dynamicSection = templateSection.cloneNode(true);
    dynamicSection.dataset.dynamicSection = "true";
    dynamicSection.dataset.sectionId = sectionId;
    dynamicSection.dataset.category = category;

    if (!dynamicSection.querySelector(".sequence-comp-section__time")) {
        const fallbackTime = document.createElement("div");
        fallbackTime.className = "sequence-comp-section__time";
        fallbackTime.textContent = "5分";
        dynamicSection.insertAdjacentElement("afterbegin", fallbackTime);
    }

    if (!dynamicSection.querySelector(".sequence-comp-section__content")) {
        const fallbackContent = document.createElement("div");
        fallbackContent.className = "sequence-comp-section__content";
        dynamicSection.appendChild(fallbackContent);
    }

    uniquifySectionIds(dynamicSection, sectionId);
    resetDynamicSection(dynamicSection, category, sectionState);
    setupDynamicSectionInteractions(dynamicSection);

    const allSections = Array.from(sectionsRoot.querySelectorAll(".sequence-comp-section"));
    const desiredIndex = Number.isFinite(sectionState?.orderIndex) ? sectionState.orderIndex : allSections.indexOf(anchorSection) + 1;
    const currentSections = Array.from(sectionsRoot.querySelectorAll(".sequence-comp-section"));
    const insertBeforeTarget = currentSections[desiredIndex] || null;
    sectionsRoot.insertBefore(dynamicSection, insertBeforeTarget);

    return dynamicSection;
}

function restoreDynamicSections(sequenceId, sectionsRoot, templateCache) {
    const savedSections = loadDynamicSectionsState(sequenceId)
        .slice()
        .sort((a, b) => (a.orderIndex ?? Number.MAX_SAFE_INTEGER) - (b.orderIndex ?? Number.MAX_SAFE_INTEGER));

    if (savedSections.length === 0) {
        return;
    }

    const firstButton = sectionsRoot.querySelector(".sequence-comp-add--section-divider");
    if (!firstButton) {
        return;
    }

    savedSections.forEach((sectionState) => {
        insertDynamicSection({
            sectionsRoot,
            insertButton: firstButton,
            category: sectionState.category,
            sectionState,
            templateCache
        });
    });
}

function resetDynamicSection(section, category, sectionState) {
    const sectionTitle = section.querySelector(".sequence-comp-section__title");
    const timeElement = section.querySelector(".sequence-comp-section__time");
    const addedList = section.querySelector(".sequence-comp-added-list");
    const selectedLabel = STIKA_SECTION_LABELS[category] || normalizeText(sectionTitle?.textContent) || "セクション";
    const initialDuration = Number.isFinite(sectionState?.durationMinutes) ? sectionState.durationMinutes : 5;

    if (sectionTitle) {
        const dot = sectionTitle.querySelector(".sequence-comp-section__dot");
        sectionTitle.innerHTML = "";
        if (dot) {
            sectionTitle.appendChild(dot);
        } else {
            const newDot = document.createElement("span");
            newDot.className = "sequence-comp-section__dot";
            sectionTitle.appendChild(newDot);
        }
        sectionTitle.append(selectedLabel);
    }

    if (timeElement) {
        timeElement.textContent = `${initialDuration}分`;
        timeElement.dataset.durationMinutes = String(initialDuration);
        window.__stikaBindDurationPickerToTimeElement?.(timeElement);
    }

    if (addedList) {
        addedList.hidden = false;
        addedList.innerHTML = "";
    }

    const items = Array.isArray(sectionState?.items) ? sectionState.items : [];
    const legacyStandingItems = category === "standing" && Array.isArray(sectionState?.slotSelections)
        ? sectionState.slotSelections
            .map((name) => normalizeText(name))
            .filter(Boolean)
            .map((name) => ({
                id: createDynamicSectionItemId(),
                name,
                source: "candidate"
            }))
        : [];
    const restoredItems = items.length > 0 ? items : legacyStandingItems;
    restoredItems.forEach((item) => appendDynamicSectionItem(section, item, false));
    syncDynamicSectionEmptyState(section);
}

function setupDynamicSectionInteractions(section) {
    const category = section.dataset.category || "";
    const sequenceId = resolveEditSequenceId();
    const sectionsRoot = section.closest(".sequence-comp-sections");

    const persist = () => {
        if (!sequenceId || !sectionsRoot) {
            return;
        }
        saveDynamicSectionsState(sequenceId, sectionsRoot);
    };

    section.addEventListener("click", (event) => {
        const deleteButton = event.target.closest("[data-dynamic-delete]");
        if (!deleteButton || !section.contains(deleteButton)) {
            return;
        }

        const item = deleteButton.closest(".sequence-comp-added-item");
        item?.remove();
        syncDynamicSectionItemOrder(section);
        syncDynamicSectionEmptyState(section);
        persist();
    });

    if (category === "standing") {
        setupDynamicStandingSection(section, persist);
        return;
    }

    setupDynamicModalSection(section, persist);
}

function setupDynamicModalSection(section, persist) {
    const modal = section.querySelector(".sequence-comp-modal");
    const dialog = modal?.querySelector(".sequence-comp-modal__dialog");
    const openButton = section.querySelector("[aria-haspopup='dialog']");
    const closeButton = modal?.querySelector(".sequence-comp-modal__close");
    const customToggle = modal?.querySelector(".warming-up-modal__custom-toggle");
    const customForm = modal?.querySelector(".warming-up-modal__custom-form");
    const candidateForms = modal?.querySelectorAll(".warming-up-modal__master-item");

    if (!modal || !dialog || !openButton || !closeButton) {
        return;
    }

    const closeModal = () => {
        modal.hidden = true;
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
    };

    const openModal = () => {
        modal.hidden = false;
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
    };

    closeModal();

    openButton.addEventListener("click", (event) => {
        event.preventDefault();
        openModal();
    });

    closeButton.addEventListener("click", closeModal);

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    dialog.addEventListener("click", (event) => {
        event.stopPropagation();
    });

    if (customToggle && customForm) {
        customToggle.addEventListener("click", () => {
            const shouldExpand = customForm.hidden;
            customForm.hidden = !shouldExpand;
            customToggle.setAttribute("aria-expanded", String(shouldExpand));
        });

        customForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const nameInput = customForm.querySelector("input[name='nameJa'], input[name='customName']");
            const memoInput = customForm.querySelector("input[name='memo']");
            const name = normalizeText(nameInput?.value);
            const memo = normalizeText(memoInput?.value);

            if (!name) {
                return;
            }

            appendDynamicSectionItem(section, {
                id: createDynamicSectionItemId(),
                name,
                memo,
                source: "custom"
            }, true);

            customForm.reset();
            customForm.hidden = true;
            customToggle.setAttribute("aria-expanded", "false");
            closeModal();
            persist();
        });
    }

    candidateForms?.forEach((form) => {
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const name = normalizeText(form.querySelector(".warming-up-modal__master-name")?.textContent);
            const description = normalizeText(form.querySelector(".warming-up-modal__master-sub")?.textContent);

            if (!name) {
                return;
            }

            appendDynamicSectionItem(section, {
                id: createDynamicSectionItemId(),
                name,
                description,
                source: "candidate"
            }, true);

            closeModal();
            persist();
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) {
            closeModal();
        }
    });
}

function setupDynamicStandingSection(section, persist) {
    const addButton = section.querySelector("[data-standing-slot]");
    const modal = section.querySelector(".sequence-comp-modal");
    const dialog = modal?.querySelector(".sequence-comp-modal__dialog");
    const closeButton = modal?.querySelector(".sequence-comp-modal__close");
    const candidateButtons = modal?.querySelectorAll("[data-standing-candidate-button]");

    if (!modal || !dialog || !closeButton || !addButton) {
        return;
    }

    const closeModal = () => {
        modal.hidden = true;
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
    };

    const openModal = () => {
        modal.hidden = false;
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
    };

    closeModal();

    addButton.addEventListener("click", (event) => {
        event.preventDefault();
        openModal();
    });

    closeButton.addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
    dialog.addEventListener("click", (event) => {
        event.stopPropagation();
    });

    candidateButtons?.forEach((button) => {
        button.addEventListener("click", () => {
            const selectedName = normalizeText(button.dataset.asanaName);
            if (!selectedName) {
                closeModal();
                return;
            }

            appendDynamicSectionItem(section, {
                id: createDynamicSectionItemId(),
                name: selectedName,
                source: "candidate"
            }, true);
            closeModal();
            persist();
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) {
            closeModal();
        }
    });
}

function appendDynamicSectionItem(section, itemData, syncOrder) {
    const list = ensureDynamicSectionList(section);
    if (!list) {
        return;
    }

    const item = document.createElement("div");
    item.className = "sequence-comp-added-item asana-card";
    item.dataset.dynamicItem = "true";
    item.dataset.itemId = itemData?.id || createDynamicSectionItemId();
    item.dataset.asanaId = item.dataset.itemId;
    item.dataset.source = itemData?.source === "custom" ? "custom" : "candidate";

    const handle = document.createElement("button");
    handle.className = "asana-drag-handle";
    handle.type = "button";
    handle.setAttribute("aria-label", `${itemData?.name || "このアーサナ"} をドラッグして並び替え`);
    handle.textContent = `${String(list.children.length + 1).padStart(2, "0")} ≡`;

    const body = document.createElement("div");
    body.className = "sequence-comp-added-item__body";

    const name = document.createElement("span");
    name.className = "sequence-comp-added-item__name";
    name.textContent = itemData?.name || "名称未設定";
    body.appendChild(name);

    if (itemData?.memo) {
        const memo = document.createElement("span");
        memo.className = "sequence-comp-added-item__memo";
        memo.textContent = itemData.memo;
        body.appendChild(memo);
    }

    if (itemData?.description) {
        const description = document.createElement("span");
        description.className = "sequence-comp-added-item__description";
        description.textContent = itemData.description;
        body.appendChild(description);
    }

    const tools = document.createElement("div");
    tools.className = "sequence-comp-added-item__tools";

    const deleteButton = document.createElement("button");
    deleteButton.className = "sequence-comp-delete";
    deleteButton.type = "button";
    deleteButton.dataset.dynamicDelete = "true";
    deleteButton.setAttribute("aria-label", `${name.textContent} を削除`);
    deleteButton.innerHTML = `
        <svg class="sequence-comp-delete__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M9 3.75h6a1 1 0 0 1 1 1V6h3a.75.75 0 0 1 0 1.5h-1.1l-.77 11.02A2.5 2.5 0 0 1 14.64 21h-5.28a2.5 2.5 0 0 1-2.49-2.48L6.1 7.5H5a.75.75 0 0 1 0-1.5h3V4.75a1 1 0 0 1 1-1Zm5.5 2.25V5.25H9.5V6h5Zm-5.88 1.5.74 10.91a1 1 0 0 0 1 .94h5.28a1 1 0 0 0 1-.94l.74-10.91H8.62Zm2.13 2.25c.41 0 .75.34.75.75v5.5a.75.75 0 0 1-1.5 0v-5.5c0-.41.34-.75.75-.75Zm4.5 0c.41 0 .75.34.75.75v5.5a.75.75 0 0 1-1.5 0v-5.5c0-.41.34-.75.75-.75Z"></path>
        </svg>
    `;

    tools.appendChild(deleteButton);
    item.appendChild(handle);
    item.appendChild(body);
    item.appendChild(tools);
    list.appendChild(item);
    initializeAsanaSortableList(list);

    if (syncOrder) {
        syncDynamicSectionItemOrder(section);
    }
    syncDynamicSectionEmptyState(section);
}

function ensureDynamicSectionList(section) {
    let list = section.querySelector(".sequence-comp-added-list");

    if (!list) {
        list = document.createElement("div");
        list.className = "sequence-comp-added-list asana-sortable-list";
        list.dataset.asanaSortable = "";
        const title = section.querySelector(".sequence-comp-section__title");
        if (title) {
            title.insertAdjacentElement("afterend", list);
        } else {
            section.querySelector(".sequence-comp-section__content")?.prepend(list);
        }
    }

    list.hidden = false;
    return list;
}

function syncDynamicSectionItemOrder(section) {
    const items = section.querySelectorAll(".sequence-comp-added-list .sequence-comp-added-item");
    items.forEach((item, index) => {
        const order = item.querySelector(".sequence-comp-added-item__order");
        if (order) {
            order.textContent = String(index + 1);
        }
    });
}

function syncDynamicSectionEmptyState(section) {
    const list = section.querySelector(".sequence-comp-added-list");
    const hasItems = Boolean(list && list.children.length > 0);

    if (list) {
        list.hidden = !hasItems;
    }
}

function saveDynamicSectionsState(sequenceId, sectionsRoot) {
    const sections = Array.from(sectionsRoot.querySelectorAll(".sequence-comp-section"));
    const dynamicSections = sections
        .filter((section) => section.dataset.dynamicSection === "true")
        .map((section) => {
            const category = section.dataset.category || "";
            const title = normalizeText(section.querySelector(".sequence-comp-section__title")?.textContent) || (STIKA_SECTION_LABELS[category] || "セクション");
            const durationMinutes = Number.parseInt(section.querySelector(".sequence-comp-section__time")?.dataset.durationMinutes || "5", 10) || 5;
            const orderIndex = sections.indexOf(section);
            const items = Array.from(section.querySelectorAll(".sequence-comp-added-list .sequence-comp-added-item")).map((item) => ({
                id: item.dataset.itemId || createDynamicSectionItemId(),
                name: normalizeText(item.querySelector(".sequence-comp-added-item__name")?.textContent),
                memo: normalizeText(item.querySelector(".sequence-comp-added-item__memo")?.textContent),
                description: normalizeText(item.querySelector(".sequence-comp-added-item__description")?.textContent),
                source: item.dataset.source === "custom" ? "custom" : "candidate"
            })).filter((item) => item.name);

            return {
                id: section.dataset.sectionId || createDynamicSectionId(),
                category,
                title,
                durationMinutes,
                orderIndex,
                items
            };
        });

    writeWebStorage(window.sessionStorage, `${STIKA_DYNAMIC_SECTIONS_STORAGE_PREFIX}${sequenceId}`, JSON.stringify(dynamicSections));
}

function saveRemovedSectionsState(sequenceId, removedSectionIds) {
    const normalizedId = normalizeText(sequenceId);
    if (!normalizedId) {
        return;
    }

    const removedList = Array.from(removedSectionIds || []).filter(Boolean);
    writeWebStorage(window.sessionStorage, `${STIKA_REMOVED_SECTIONS_STORAGE_PREFIX}${normalizedId}`, JSON.stringify(removedList));
}

function saveSectionOrderState(sequenceId, sectionsRoot) {
    const normalizedId = normalizeText(sequenceId);
    if (!normalizedId || !sectionsRoot) {
        return;
    }

    const order = Array.from(sectionsRoot.querySelectorAll(".sequence-comp-section"))
        .map((section) => ensureSectionIdentity(section))
        .filter(Boolean);

    writeWebStorage(window.sessionStorage, `${STIKA_SECTION_ORDER_STORAGE_PREFIX}${normalizedId}`, JSON.stringify(order));
}

function saveSectionDurationsState(sequenceId, sectionDurations) {
    const normalizedId = normalizeText(sequenceId);
    if (!normalizedId || !sectionDurations || typeof sectionDurations !== "object") {
        return;
    }

    writeWebStorage(window.sessionStorage, `${STIKA_SECTION_DURATIONS_STORAGE_PREFIX}${normalizedId}`, JSON.stringify(sectionDurations));
}

function loadDynamicSectionsState(sequenceId) {
    const raw = readWebStorage(window.sessionStorage, `${STIKA_DYNAMIC_SECTIONS_STORAGE_PREFIX}${sequenceId}`);

    if (!raw) {
        return [];
    }

    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item === "object" && typeof item.category === "string") : [];
    } catch (_error) {
        return [];
    }
}

function loadRemovedSectionsState(sequenceId) {
    const raw = readWebStorage(window.sessionStorage, `${STIKA_REMOVED_SECTIONS_STORAGE_PREFIX}${sequenceId}`);

    if (!raw) {
        return [];
    }

    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.map((id) => normalizeText(id)).filter(Boolean) : [];
    } catch (_error) {
        return [];
    }
}

function loadSectionOrderState(sequenceId) {
    const raw = readWebStorage(window.sessionStorage, `${STIKA_SECTION_ORDER_STORAGE_PREFIX}${sequenceId}`);

    if (!raw) {
        return [];
    }

    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.map((id) => normalizeText(id)).filter(Boolean) : [];
    } catch (_error) {
        return [];
    }
}

function loadSectionDurationsState(sequenceId) {
    const normalizedId = normalizeText(sequenceId);
    if (!normalizedId) {
        return {};
    }

    const raw = readWebStorage(window.sessionStorage, `${STIKA_SECTION_DURATIONS_STORAGE_PREFIX}${normalizedId}`);
    if (!raw) {
        return {};
    }

    try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") {
            return {};
        }

        return Object.entries(parsed).reduce((accumulator, [sectionId, value]) => {
            const normalizedSectionId = normalizeText(sectionId);
            const minutes = Number.parseInt(value, 10);
            if (normalizedSectionId && Number.isFinite(minutes)) {
                accumulator[normalizedSectionId] = minutes;
            }
            return accumulator;
        }, {});
    } catch (_error) {
        return {};
    }
}

function clearDynamicSectionsState(sequenceId) {
    const normalizedId = normalizeText(sequenceId);
    if (!normalizedId) {
        return;
    }

    try {
        window.sessionStorage.removeItem(`${STIKA_DYNAMIC_SECTIONS_STORAGE_PREFIX}${normalizedId}`);
    } catch (_error) {
        return;
    }
}

function clearRemovedSectionsState(sequenceId) {
    const normalizedId = normalizeText(sequenceId);
    if (!normalizedId) {
        return;
    }

    try {
        window.sessionStorage.removeItem(`${STIKA_REMOVED_SECTIONS_STORAGE_PREFIX}${normalizedId}`);
    } catch (_error) {
        return;
    }
}

function clearSectionOrderState(sequenceId) {
    const normalizedId = normalizeText(sequenceId);
    if (!normalizedId) {
        return;
    }

    try {
        window.sessionStorage.removeItem(`${STIKA_SECTION_ORDER_STORAGE_PREFIX}${normalizedId}`);
    } catch (_error) {
        return;
    }
}

function clearSectionDurationsState(sequenceId) {
    const normalizedId = normalizeText(sequenceId);
    if (!normalizedId) {
        return;
    }

    try {
        window.sessionStorage.removeItem(`${STIKA_SECTION_DURATIONS_STORAGE_PREFIX}${normalizedId}`);
    } catch (_error) {
        return;
    }
}

function applySectionOrderState(sequenceId, sectionsRoot) {
    const order = loadSectionOrderState(sequenceId);
    if (order.length === 0 || !sectionsRoot) {
        return;
    }

    const sections = Array.from(sectionsRoot.querySelectorAll(".sequence-comp-section"));
    const sectionMap = new Map(sections.map((section) => [ensureSectionIdentity(section), section]));
    const appended = new Set();

    order.forEach((sectionId) => {
        const section = sectionMap.get(sectionId);
        if (!section || appended.has(section)) {
            return;
        }

        sectionsRoot.appendChild(section);
        appended.add(section);
    });

    sections.forEach((section) => {
        if (appended.has(section)) {
            return;
        }
        sectionsRoot.appendChild(section);
    });
}

function buildSectionTemplateCache(sectionsRoot) {
    const templates = new Map();

    sectionsRoot.querySelectorAll(".sequence-comp-section:not([data-dynamic-section='true'])").forEach((section) => {
        const category = normalizeText(section.dataset.category);
        if (!category || templates.has(category)) {
            return;
        }

        templates.set(category, section.cloneNode(true));
    });

    return templates;
}

function ensureSectionIdentity(section) {
    if (!section) {
        return "";
    }

    const existingId = normalizeText(section.dataset.sectionId);
    if (existingId) {
        return existingId;
    }

    const category = normalizeText(section.dataset.category) || "section";
    const sectionId = section.dataset.dynamicSection === "true"
        ? createDynamicSectionId()
        : `base_${category}`;

    section.dataset.sectionId = sectionId;
    return sectionId;
}

function ensureSectionControlButtons(section) {
    const content = section?.querySelector(".sequence-comp-section__content");
    if (!content) {
        return null;
    }

    let actionRoot = content.querySelector(".sequence-comp-section__actions");
    if (!actionRoot) {
        actionRoot = document.createElement("div");
        actionRoot.className = "sequence-comp-section__actions";
        content.appendChild(actionRoot);
    }

    let moveUpButton = actionRoot.querySelector("[data-section-move='up']");
    if (!moveUpButton) {
        moveUpButton = document.createElement("button");
        moveUpButton.type = "button";
        moveUpButton.className = "sequence-comp-section__move";
        moveUpButton.dataset.sectionMove = "up";
        moveUpButton.setAttribute("aria-label", "セクションを上へ移動");
        moveUpButton.textContent = "↑";
        actionRoot.appendChild(moveUpButton);
    }

    let moveDownButton = actionRoot.querySelector("[data-section-move='down']");
    if (!moveDownButton) {
        moveDownButton = document.createElement("button");
        moveDownButton.type = "button";
        moveDownButton.className = "sequence-comp-section__move";
        moveDownButton.dataset.sectionMove = "down";
        moveDownButton.setAttribute("aria-label", "セクションを下へ移動");
        moveDownButton.textContent = "↓";
        actionRoot.appendChild(moveDownButton);
    }

    let removeButton = actionRoot.querySelector("[data-section-remove]");
    if (!removeButton) {
        removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "sequence-comp-section__remove";
        removeButton.dataset.sectionRemove = "true";
        removeButton.setAttribute("aria-label", "このセクションを削除");
        removeButton.innerHTML = `
            <span class="sequence-comp-section__remove-icon" aria-hidden="true">×</span>
            <span>削除</span>
        `;
        actionRoot.appendChild(removeButton);
    }

    return {
        actionRoot,
        moveUpButton,
        moveDownButton,
        removeButton
    };
}

function createSectionDeleteModal(handlers) {
    const existingModal = document.getElementById("sequenceSectionDeleteModal");
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement("div");
    modal.className = "sequence-comp-modal sequence-comp-modal--section-delete";
    modal.id = "sequenceSectionDeleteModal";
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
        <div class="sequence-comp-modal__dialog warming-up-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="sequenceSectionDeleteModalTitle">
            <button class="sequence-comp-modal__close" type="button" aria-label="モーダルを閉じる">×</button>
            <div class="sequence-comp-modal__header">
                <h3 class="sequence-comp-modal__title" id="sequenceSectionDeleteModalTitle">このセクションを削除しますか？</h3>
            </div>
            <div class="warming-up-modal__content">
                <div class="sequence-comp-modal__actions">
                    <button class="sequence-comp-cancel sequence-comp-modal__cancel" type="button" data-section-delete-cancel>キャンセル</button>
                    <button class="sequence-comp-modal__delete" type="button" data-section-delete-confirm>削除する</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const dialog = modal.querySelector(".sequence-comp-modal__dialog");
    const closeButton = modal.querySelector(".sequence-comp-modal__close");
    const cancelButton = modal.querySelector("[data-section-delete-cancel]");
    const confirmButton = modal.querySelector("[data-section-delete-confirm]");
    let targetSection = null;

    const close = () => {
        modal.hidden = true;
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
        targetSection = null;
    };

    const open = (section) => {
        targetSection = section || null;
        modal.hidden = false;
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
    };

    closeButton?.addEventListener("click", close);
    cancelButton?.addEventListener("click", close);
    confirmButton?.addEventListener("click", () => {
        handlers?.onConfirm?.(targetSection);
        close();
    });

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            close();
        }
    });

    dialog?.addEventListener("click", (event) => {
        event.stopPropagation();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) {
            close();
        }
    });

    return { open, close };
}

function createConfirmCardFromDynamicSection(section) {
    const article = document.createElement("article");
    article.className = "sequence-confirm-card";
    article.dataset.category = section?.category || "";

    if (section?.id) {
        article.dataset.sectionId = section.id;
    }

    const header = document.createElement("div");
    header.className = "sequence-confirm-card__header";

    const time = document.createElement("span");
    time.className = "sequence-confirm-card__time";
    time.textContent = `${Number.parseInt(section?.durationMinutes || 5, 10) || 5}分`;

    const title = document.createElement("h2");
    title.className = "sequence-confirm-card__title";
    title.textContent = normalizeText(section?.title) || STIKA_SECTION_LABELS[section?.category] || "セクション";

    header.appendChild(time);
    header.appendChild(title);
    article.appendChild(header);

    const items = Array.isArray(section?.items)
        ? section.items.map((item) => normalizeText(item?.name)).filter(Boolean)
        : [];

    if (items.length > 0) {
        const list = document.createElement("ul");
        list.className = "sequence-confirm-card__items";

        items.forEach((itemName) => {
            const listItem = document.createElement("li");
            listItem.textContent = itemName;
            list.appendChild(listItem);
        });

        article.appendChild(list);
    }

    return article;
}

function resolveEditSequenceId() {
    const screen = document.querySelector(".sequence-comp-screen");
    const fromDataset = normalizeText(screen?.dataset.sequenceId);
    if (fromDataset) {
        return fromDataset;
    }

    const match = window.location.pathname.match(/\/sequence\/edit\/(\d+)$/);
    return match?.[1] || "";
}

function resolveConfirmSequenceIdFromPath() {
    return window.location.pathname.match(/^\/sequence\/confirm\/(\d+)$/)?.[1] || "";
}

function createDynamicSectionId() {
    return `dynamic_section_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createDynamicSectionItemId() {
    return `dynamic_item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function uniquifySectionIds(section, suffix) {
    const idMap = new Map();
    const elementsWithId = section.querySelectorAll("[id]");

    elementsWithId.forEach((element) => {
        const oldId = element.id;
        const newId = `${oldId}_${suffix}`;
        idMap.set(oldId, newId);
        element.id = newId;
    });

    const refAttributes = ["for", "aria-controls", "aria-labelledby"];
    const elements = section.querySelectorAll("*");

    elements.forEach((element) => {
        refAttributes.forEach((attribute) => {
            const value = element.getAttribute(attribute);
            if (!value) {
                return;
            }

            const nextValue = value
                .split(/\s+/)
                .map((token) => idMap.get(token) || token)
                .join(" ");

            element.setAttribute(attribute, nextValue);
        });
    });
}

function initSequenceConfirmNavigation() {
    const saveButton = document.querySelector(".sequence-comp-footer__action--save");

    if (!saveButton) {
        return;
    }

    const pathMatch = window.location.pathname.match(/\/sequence\/edit\/(\d+)$/);
    const pageRoot = document.querySelector(".sequence-comp-screen");
    const sequenceId = pathMatch ? pathMatch[1] : pageRoot?.dataset.sequenceId || null;

    if (!sequenceId) {
        return;
    }

    saveButton.addEventListener("click", (event) => {
        event.preventDefault();
        window.location.href = `/sequence/confirm/${sequenceId}`;
    });
}

function initSequenceListNavigation() {
    const listButtons = document.querySelectorAll(".sequence-comp-footer__action--list");

    if (listButtons.length === 0) {
        return;
    }

    listButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            event.preventDefault();
            window.location.href = STIKA_SEQUENCE_LIST_PATH;
        });
    });
}

function initSequenceSetupDraft() {
    const form = document.querySelector(".setup-form");

    if (!form) {
        return;
    }

    const titleInput = form.querySelector("[name='sequenceTitle']");
    const targetInput = form.querySelector("[name='target']");
    const memoInput = form.querySelector("[name='sequenceMemo']");
    const peakPoseInput = form.querySelector("[name='peakPoseName']");
    const notice = document.getElementById("sequenceDraftNotice");
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("editId");

    if (editId) {
        const savedSequence = getSavedSequences().find((item) => item.id === editId);
        if (savedSequence) {
            applySavedSequenceToSetupForm(form, savedSequence);

            if (notice) {
                notice.textContent = "\u4fdd\u5b58\u6e08\u307f\u30b7\u30fc\u30af\u30a8\u30f3\u30b9\u3092\u3082\u3068\u306b\u7de8\u96c6\u3057\u3066\u3044\u307e\u3059\u3002\u4fdd\u5b58\u3059\u308b\u3068\u65b0\u3057\u3044\u30b7\u30fc\u30af\u30a8\u30f3\u30b9\u3068\u3057\u3066\u8ffd\u52a0\u3055\u308c\u307e\u3059\u3002";
                notice.hidden = false;
            }
        }
    } else {
        const draft = getSequenceDraft();
        if (draft) {
            fillFieldValue(titleInput, draft.title);
            fillFieldValue(targetInput, draft.target);
            fillFieldValue(memoInput, draft.memo);
            fillFieldValue(peakPoseInput, draft.peakPoseName);

            if (draft.duration) {
                const durationRadio = form.querySelector(`input[name='duration'][value='${draft.duration}']`);
                if (durationRadio) {
                    durationRadio.checked = true;
                }
            }

            if (draft.peakPoseName) {
                const enabledRadio = form.querySelector("input[name='peakPoseEnabled'][value='true']");
                if (enabledRadio) {
                    enabledRadio.checked = true;
                    enabledRadio.dispatchEvent(new Event("change", { bubbles: true }));
                }
            }
        }
    }

    form.addEventListener("submit", () => {
        const formData = new FormData(form);
        const draft = {
            title: normalizeText(formData.get("sequenceTitle")),
            target: normalizeText(formData.get("target")),
            memo: normalizeText(formData.get("sequenceMemo")),
            duration: normalizeText(formData.get("duration")),
            peakPoseName: normalizeText(formData.get("peakPoseName")),
            editId: editId || "",
            savedAt: new Date().toISOString()
        };

        setSequenceDraft(draft);
    });
}

function initSequenceLocalSave() {
    const form = document.getElementById("sequenceLocalSaveForm");

    if (!form) {
        return;
    }

    const notice = document.getElementById("sequenceLocalSaveNotice");
    const draft = getSequenceDraft();
    syncConfirmDraftMeta(draft);

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const sequence = buildSequenceFromConfirmPage(draft);
        const savedSequences = getSavedSequences();
        savedSequences.push(sequence);

        const saveSucceeded = setSavedSequences(savedSequences);

        if (!saveSucceeded) {
            if (notice) {
                notice.textContent = "\u4fdd\u5b58\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002\u30d6\u30e9\u30a6\u30b6\u306e\u4fdd\u5b58\u8a2d\u5b9a\u3092\u78ba\u8a8d\u306e\u3046\u3048\u3001\u3082\u3046\u4e00\u5ea6\u304a\u8a66\u3057\u304f\u3060\u3055\u3044\u3002";
                notice.hidden = false;
            }
            return;
        }

        clearSequenceDraft();
        clearDynamicSectionsState(resolveConfirmSequenceIdFromPath() || draft?.editId || "");
        clearRemovedSectionsState(resolveConfirmSequenceIdFromPath() || draft?.editId || "");
        clearSectionOrderState(resolveConfirmSequenceIdFromPath() || draft?.editId || "");
        clearSectionDurationsState(resolveConfirmSequenceIdFromPath() || draft?.editId || "");
        window.location.href = STIKA_SEQUENCE_LIST_PATH;
    });
}

function initSequenceListPage() {
    const root = document.getElementById("sequenceListPage");
    const list = document.getElementById("sequenceList");
    const empty = document.getElementById("sequenceListEmpty");

    if (!root || !list || !empty) {
        return;
    }

    const render = () => {
        const sequences = getSavedSequences()
            .slice()
            .sort((a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt));

        list.innerHTML = "";

        if (sequences.length === 0) {
            empty.hidden = false;
            return;
        }

        empty.hidden = true;

        sequences.forEach((sequence) => {
            list.appendChild(createSequenceListCard(sequence));
        });
    };

    list.addEventListener("click", (event) => {
        const detailLink = event.target.closest("a[data-sequence-link]");
        const button = event.target.closest("button[data-action]");

        if (detailLink) {
            return;
        }

        if (!button) {
            return;
        }

        const sequenceId = button.dataset.sequenceId;
        const action = button.dataset.action;

        if (!sequenceId || !action) {
            return;
        }

        if (action === "delete") {
            const sequences = getSavedSequences();
            const target = sequences.find((item) => item.id === sequenceId);
            const title = target?.title || "このシークエンス";

            if (!window.confirm(`${title}を削除しますか？`)) {
                return;
            }

            const nextSequences = sequences.filter((item) => item.id !== sequenceId);
            setSavedSequences(nextSequences);
            render();
            return;
        }

        if (action === "edit") {
            const target = getSavedSequences().find((item) => item.id === sequenceId);

            if (!target) {
                return;
            }

            setSequenceDraft({
                title: normalizeText(target.title),
                target: normalizeText(target.target),
                memo: normalizeText(target.memo),
                duration: normalizeDurationValue(target.duration),
                peakPoseName: extractPeakPoseName(target.sections),
                editId: target.id,
                savedAt: new Date().toISOString()
            });

            window.location.href = `${STIKA_SEQUENCE_SETUP_PATH}?editId=${encodeURIComponent(sequenceId)}`;
        }
    });

    render();
}

function initSequenceDetailPage() {
    const root = document.getElementById("sequenceDetailPage");

    if (!root) {
        return;
    }

    const error = document.getElementById("sequenceDetailError");
    const content = document.getElementById("sequenceDetailContent");
    const editButton = document.getElementById("sequenceDetailEditButton");
    const deleteButton = document.getElementById("sequenceDetailDeleteButton");
    const params = new URLSearchParams(window.location.search);
    const sequenceId = normalizeText(params.get("id"));
    const savedSequences = getSavedSequences();

    if (savedSequences.length === 0) {
        showSequenceDetailError("\u4fdd\u5b58\u6e08\u307f\u306e\u30b7\u30fc\u30af\u30a8\u30f3\u30b9\u304c\u3042\u308a\u307e\u305b\u3093\u3002\u4e00\u89a7\u3078\u623b\u3063\u3066\u65b0\u3057\u304f\u4f5c\u6210\u3057\u3066\u304f\u3060\u3055\u3044\u3002");
        return;
    }

    if (!sequenceId) {
        showSequenceDetailError("\u5bfe\u8c61\u306e\u30b7\u30fc\u30af\u30a8\u30f3\u30b9\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093\u3002\u4e00\u89a7\u304b\u3089\u3082\u3046\u4e00\u5ea6\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044\u3002");
        return;
    }

    const sequence = savedSequences.find((item) => item.id === sequenceId);

    if (!sequence) {
        showSequenceDetailError("\u5bfe\u8c61\u306e\u30b7\u30fc\u30af\u30a8\u30f3\u30b9\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093\u3002\u4e00\u89a7\u304b\u3089\u5225\u306e\u9805\u76ee\u3092\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044\u3002");
        return;
    }

    renderSequenceDetail(sequence);

    if (content) {
        content.hidden = false;
    }

    if (error) {
        error.hidden = true;
    }

    if (editButton) {
        editButton.addEventListener("click", () => {
            setSequenceDraft({
                title: normalizeText(sequence.title),
                target: normalizeText(sequence.target),
                memo: normalizeText(sequence.memo),
                duration: normalizeDurationValue(sequence.duration),
                peakPoseName: extractPeakPoseName(sequence.sections),
                editId: sequence.id,
                savedAt: new Date().toISOString()
            });

            window.location.href = `${STIKA_SEQUENCE_SETUP_PATH}?editId=${encodeURIComponent(sequence.id)}`;
        });
    }

    if (deleteButton) {
        deleteButton.addEventListener("click", () => {
            const title = sequence.title || "このシークエンス";

            if (!window.confirm(`${title}を削除しますか？`)) {
                return;
            }

            const nextSequences = savedSequences.filter((item) => item.id !== sequence.id);
            setSavedSequences(nextSequences);
            window.location.href = STIKA_SEQUENCE_LIST_PATH;
        });
    }

    function showSequenceDetailError(message) {
        if (content) {
            content.hidden = true;
        }

        if (error) {
            error.textContent = message;
            error.hidden = false;
        }
    }
}

function syncConfirmDraftMeta(draft) {
    const titleElement = document.getElementById("sequenceDraftTitle");
    const targetElement = document.getElementById("sequenceDraftTarget");
    const memoElement = document.getElementById("sequenceDraftMemo");
    const memoWrapper = document.getElementById("sequenceDraftMemoRow");
    const durationElement = document.getElementById("sequenceDraftDuration");

    if (!titleElement || !targetElement || !memoElement || !memoWrapper || !durationElement) {
        return;
    }

    const fallbackDuration = normalizeText(document.querySelector(".sequence-comp-summary__time")?.textContent) || "-";
    const title = draft?.title || buildFallbackSequenceTitle();
    const target = draft?.target || "未設定";
    const memo = draft?.memo || "";
    const duration = draft?.duration ? `${draft.duration}分` : fallbackDuration;

    titleElement.textContent = title;
    targetElement.textContent = target;
    durationElement.textContent = duration;
    memoElement.textContent = memo;
    memoWrapper.hidden = memo.length === 0;
}

function buildSequenceFromConfirmPage(draft) {
    const duration = normalizeText(document.querySelector(".sequence-comp-summary__time")?.textContent) || "未設定";
    const sections = Array.from(document.querySelectorAll(".sequence-confirm-card")).map((card, index) => {
        const title = normalizeText(card.querySelector(".sequence-confirm-card__title")?.textContent) || "未設定";
        const durationLabel = normalizeText(card.querySelector(".sequence-confirm-card__time")?.textContent) || "";
        const items = Array.from(card.querySelectorAll(".sequence-confirm-card__items li"))
            .map((item) => normalizeText(item.textContent))
            .filter(Boolean);

        return {
            sectionId: card.dataset.sectionId || "",
            orderIndex: index,
            category: card.dataset.category || "",
            title,
            duration: durationLabel,
            items
        };
    });

    return {
        id: createSequenceStorageId(),
        title: draft?.title || buildFallbackSequenceTitle(),
        duration,
        target: draft?.target || "未設定",
        createdAt: new Date().toISOString(),
        sections,
        memo: draft?.memo || ""
    };
}

function buildFallbackSequenceTitle() {
    const peakPose = normalizeText(document.querySelector(".sequence-comp-summary__peak")?.textContent);
    const duration = normalizeText(document.querySelector(".sequence-comp-summary__time")?.textContent) || "シークエンス";

    if (peakPose && peakPose !== "\u30d4\u30fc\u30af\u30dd\u30fc\u30ba\u672a\u8a2d\u5b9a") {
        return `${peakPose}のシークエンス`;
    }

    return `${duration}のシークエンス`;
}

function createSequenceStorageId() {
    const randomPart = Math.random().toString(36).slice(2, 8);
    return `sequence_${Date.now()}_${randomPart}`;
}

function createSequenceListCard(sequence) {
    const article = document.createElement("article");
    article.className = "sequence-list-card";

    const link = document.createElement("a");
    link.className = "sequence-list-card__link";
    link.href = `${STIKA_SEQUENCE_DETAIL_PATH}?id=${encodeURIComponent(sequence.id)}`;
    link.dataset.sequenceLink = "true";
    link.setAttribute("aria-label", `${sequence.title || "シークエンス"}の内容を確認する`);

    const content = document.createElement("div");
    content.className = "sequence-list-card__content";

    const header = document.createElement("div");
    header.className = "sequence-list-card__header";

    const title = document.createElement("h2");
    title.className = "sequence-list-card__title";
    title.textContent = sequence.title || "シークエンス";

    const date = document.createElement("p");
    date.className = "sequence-list-card__date";
    date.textContent = formatDateTimeLabel(sequence.createdAt);

    header.appendChild(title);
    header.appendChild(date);

    const body = document.createElement("dl");
    body.className = "sequence-list-card__meta";

    body.appendChild(createMetaRow("所要時間", sequence.duration || "-"));
    body.appendChild(createMetaRow("対象", sequence.target || "未設定"));

    if (sequence.memo) {
        body.appendChild(createMetaRow("メモ", sequence.memo));
    }

    const footer = document.createElement("div");
    footer.className = "sequence-list-card__actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "secondary-button sequence-list-card__button";
    editButton.dataset.action = "edit";
    editButton.dataset.sequenceId = sequence.id;
    editButton.textContent = "編集";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "sequence-list-card__delete";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.sequenceId = sequence.id;
    deleteButton.textContent = "削除";

    footer.appendChild(editButton);
    footer.appendChild(deleteButton);

    content.appendChild(header);
    content.appendChild(body);

    article.appendChild(link);
    article.appendChild(content);
    article.appendChild(footer);

    return article;
}

function createMetaRow(labelText, valueText) {
    const fragment = document.createDocumentFragment();
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");

    dt.textContent = labelText;
    dd.textContent = valueText;

    fragment.appendChild(dt);
    fragment.appendChild(dd);
    return fragment;
}

function renderSequenceDetail(sequence) {
    const titleElement = document.getElementById("sequenceDetailTitle");
    const dateElement = document.getElementById("sequenceDetailDate");
    const durationElement = document.getElementById("sequenceDetailDuration");
    const targetElement = document.getElementById("sequenceDetailTarget");
    const memoElement = document.getElementById("sequenceDetailMemo");
    const memoRow = document.getElementById("sequenceDetailMemoRow");
    const sectionCountElement = document.getElementById("sequenceDetailSectionCount");
    const asanaSummaryElement = document.getElementById("sequenceDetailAsanaSummary");
    const sectionsRoot = document.getElementById("sequenceDetailSections");

    if (!titleElement || !dateElement || !durationElement || !targetElement || !memoElement || !memoRow || !sectionCountElement || !asanaSummaryElement || !sectionsRoot) {
        return;
    }

    titleElement.textContent = sequence.title || "シークエンス";
    dateElement.textContent = formatDateTimeLabel(sequence.createdAt);
    durationElement.textContent = sequence.duration || "-";
    targetElement.textContent = sequence.target || "未設定";
    memoElement.textContent = sequence.memo || "";
    memoRow.hidden = !normalizeText(sequence.memo);

    const sections = Array.isArray(sequence.sections) ? sequence.sections : [];
    const asanaNames = sections
        .flatMap((section) => Array.isArray(section?.items) ? section.items : [])
        .filter(Boolean);

    sectionCountElement.textContent = `${sections.length}件`;
    asanaSummaryElement.textContent = asanaNames.length > 0
        ? `アーサナ一覧: ${asanaNames.join(" / ")}`
        : "登録されているアーサナはありません。";

    sectionsRoot.innerHTML = "";

    if (sections.length === 0) {
        const empty = document.createElement("p");
        empty.className = "sequence-confirm-empty";
        empty.textContent = "セクション情報が見つかりません。";
        sectionsRoot.appendChild(empty);
        return;
    }

    sections.forEach((section) => {
        sectionsRoot.appendChild(createSequenceDetailSection(section));
    });
}

function createSequenceDetailSection(section) {
    const article = document.createElement("article");
    article.className = "sequence-confirm-card sequence-detail-card";
    article.dataset.category = section?.category || "";

    const header = document.createElement("div");
    header.className = "sequence-confirm-card__header";

    const time = document.createElement("span");
    time.className = "sequence-confirm-card__time";
    time.textContent = normalizeText(section?.duration) || "-";

    const title = document.createElement("h2");
    title.className = "sequence-confirm-card__title";
    title.textContent = normalizeText(section?.title) || "セクション";

    header.appendChild(time);
    header.appendChild(title);
    article.appendChild(header);

    const items = Array.isArray(section?.items) ? section.items.filter(Boolean) : [];

    if (items.length === 0) {
        const empty = document.createElement("p");
        empty.className = "sequence-detail-card__empty";
        empty.textContent = "登録されている項目はありません。";
        article.appendChild(empty);
        return article;
    }

    const list = document.createElement("ul");
    list.className = "sequence-confirm-card__items";

    items.forEach((item) => {
        const listItem = document.createElement("li");
        listItem.textContent = item;
        list.appendChild(listItem);
    });

    article.appendChild(list);
    return article;
}

function applySavedSequenceToSetupForm(form, sequence) {
    if (!form || !sequence) {
        return;
    }

    const titleInput = form.querySelector("[name='sequenceTitle']");
    const targetInput = form.querySelector("[name='target']");
    const memoInput = form.querySelector("[name='sequenceMemo']");
    const peakPoseInput = form.querySelector("[name='peakPoseName']");
    const durationValue = normalizeDurationValue(sequence.duration);

    fillFieldValue(titleInput, sequence.title);
    fillFieldValue(targetInput, sequence.target);
    fillFieldValue(memoInput, sequence.memo);
    fillFieldValue(peakPoseInput, extractPeakPoseName(sequence.sections));

    if (durationValue) {
        const durationRadio = form.querySelector(`input[name='duration'][value='${durationValue}']`);
        if (durationRadio) {
            durationRadio.checked = true;
        }
    }

    if (peakPoseInput && peakPoseInput.value) {
        const enabledRadio = form.querySelector("input[name='peakPoseEnabled'][value='true']");
        if (enabledRadio) {
            enabledRadio.checked = true;
            enabledRadio.dispatchEvent(new Event("change", { bubbles: true }));
        }
    }
}

function extractPeakPoseName(sections) {
    if (!Array.isArray(sections)) {
        return "";
    }

    const peakSection = sections.find((section) => section?.category === "peak");
    const peakName = peakSection?.items?.[0];
    return normalizeText(peakName);
}

function fillFieldValue(field, value) {
    if (!field || typeof value !== "string" || field.value) {
        return;
    }

    field.value = value;
}

function getSavedSequences() {
    const rawValue = readWebStorage(window.localStorage, STIKA_SEQUENCE_STORAGE_KEY);

    if (!rawValue) {
        return [];
    }

    try {
        const parsedValue = JSON.parse(rawValue);
        return Array.isArray(parsedValue) ? parsedValue.filter(isSequenceLike) : [];
    } catch (_error) {
        return [];
    }
}

function setSavedSequences(sequences) {
    return writeWebStorage(window.localStorage, STIKA_SEQUENCE_STORAGE_KEY, JSON.stringify(Array.isArray(sequences) ? sequences : []));
}

function getSequenceDraft() {
    const rawValue = readWebStorage(window.sessionStorage, STIKA_SEQUENCE_DRAFT_KEY);

    if (!rawValue) {
        return null;
    }

    try {
        const parsedValue = JSON.parse(rawValue);
        return parsedValue && typeof parsedValue === "object" ? parsedValue : null;
    } catch (_error) {
        return null;
    }
}

function setSequenceDraft(draft) {
    if (!draft || typeof draft !== "object") {
        return false;
    }

    return writeWebStorage(window.sessionStorage, STIKA_SEQUENCE_DRAFT_KEY, JSON.stringify(draft));
}

function clearSequenceDraft() {
    try {
        window.sessionStorage.removeItem(STIKA_SEQUENCE_DRAFT_KEY);
    } catch (_error) {
        return;
    }
}

function readWebStorage(storage, key) {
    if (!storage || !key) {
        return "";
    }

    try {
        return storage.getItem(key) || "";
    } catch (_error) {
        return "";
    }
}

function writeWebStorage(storage, key, value) {
    if (!storage || !key) {
        return false;
    }

    try {
        storage.setItem(key, value);
        return true;
    } catch (_error) {
        return false;
    }
}

function isSequenceLike(value) {
    return Boolean(value) && typeof value === "object" && typeof value.id === "string";
}

function normalizeText(value) {
    return typeof value === "string" ? value.trim() : "";
}

function normalizeDurationValue(value) {
    const matchedValue = String(value || "").match(/\d+/);
    return matchedValue ? matchedValue[0] : "";
}

function formatDateTimeLabel(value) {
    const timestamp = getTimestamp(value);

    if (!timestamp) {
        return "-";
    }

    return new Intl.DateTimeFormat("ja-JP", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }).format(new Date(timestamp));
}

function getTimestamp(value) {
    const timestamp = Date.parse(value || "");
    return Number.isFinite(timestamp) ? timestamp : 0;
}
