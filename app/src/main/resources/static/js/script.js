const STIKA_SEQUENCE_STORAGE_KEY = "stika_sequences";
const STIKA_SEQUENCE_DRAFT_KEY = "stika_sequence_draft";
const STIKA_SEQUENCE_LIST_PATH = "/sequence-list.html";
const STIKA_SEQUENCE_DETAIL_PATH = "/sequence-detail.html";
const STIKA_SEQUENCE_SETUP_PATH = "/sequence/setup";

document.addEventListener("DOMContentLoaded", () => {
    runInitializer(initPeakPoseField);
    runInitializer(initGrowthCalendar);
    runInitializer(initSequenceTabs);
    runInitializer(initBreathingEditor);
    runInitializer(initWarmingUpModal);
    runInitializer(initSequenceConfirmNavigation);
    runInitializer(initSequenceListNavigation);
    runInitializer(initSequenceSetupDraft);
    runInitializer(initSequenceLocalSave);
    runInitializer(initSequenceListPage);
    runInitializer(initSequenceDetailPage);
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
            button.setAttribute("aria-label", `${isoDate}${hasRecord ? " 險倬鹸縺ゅｊ" : ""}${isToday ? " 莉頑律" : ""}`);
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
        pickerLabel: "呼吸法を追加",
        modeLabel: "新規追加",
        submitLabel: "選択した呼吸法を追加"
    };
    const editState = {
        pickerLabel: "呼吸法を編集",
        modeLabel: "編集中",
        submitLabel: "この内容で更新"
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
            if (!id) {
                return;
            }

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

            const name = button.dataset.name || "この呼吸法";

            if (!window.confirm(`${name}を削除しますか？`)) {
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

function initWarmingUpModal() {
    const section = document.querySelector(".sequence-comp-section[data-category='warming-up']");
    const modal = document.getElementById("warmingUpModal");
    const dialog = modal?.querySelector(".warming-up-modal__dialog");
    const triggerButton = section?.querySelector("#warmingUpModalOpen");
    const closeButton = document.getElementById("warmingUpModalClose");
    const customToggle = document.getElementById("warmingUpCustomToggle");
    const customForm = document.getElementById("warmingUpCustomForm");
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
    const sections = Array.from(document.querySelectorAll(".sequence-confirm-card")).map((card) => {
        const title = normalizeText(card.querySelector(".sequence-confirm-card__title")?.textContent) || "未設定";
        const durationLabel = normalizeText(card.querySelector(".sequence-confirm-card__time")?.textContent) || "";
        const items = Array.from(card.querySelectorAll(".sequence-confirm-card__items li"))
            .map((item) => normalizeText(item.textContent))
            .filter(Boolean);

        return {
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
