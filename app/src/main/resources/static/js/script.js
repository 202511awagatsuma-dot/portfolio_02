const STIKA_SEQUENCE_STORAGE_KEY = "stika_sequences";
const STIKA_SEQUENCE_DRAFT_KEY = "stika_sequence_draft";
const STIKA_SEQUENCE_LIST_PATH = "/sequence-list.html";
const STIKA_SEQUENCE_SETUP_PATH = "/sequence/setup";

document.addEventListener("DOMContentLoaded", () => {
    runInitializer(initPeakPoseField);
    runInitializer(initGrowthCalendar);
    runInitializer(initSequenceTabs);
    runInitializer(initBreathingEditor);
    runInitializer(initSequenceConfirmNavigation);
    runInitializer(initSequenceListNavigation);
    runInitializer(initSequenceSetupDraft);
    runInitializer(initSequenceLocalSave);
    runInitializer(initSequenceListPage);
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
            button.setAttribute("aria-label", `${isoDate}${hasRecord ? " 記録あり" : ""}${isToday ? " 今日" : ""}`);
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

function initSequenceConfirmNavigation() {
    const saveButton = document.querySelector(".sequence-comp-footer__action--save");

    if (!saveButton) {
        return;
    }

    const pathMatch = window.location.pathname.match(/\/sequence\/edit\/(\d+)$/);
    const sequenceId = pathMatch ? pathMatch[1] : null;

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
                notice.textContent = "保存済みシークエンスをもとに編集しています。保存すると新しいシークエンスとして追加されます。";
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
                notice.textContent = "保存に失敗しました。ブラウザの保存設定をご確認のうえ、もう一度お試しください。";
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
        const button = event.target.closest("button[data-action]");

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

    if (peakPose && peakPose !== "ピークポーズ未設定") {
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

    article.appendChild(header);
    article.appendChild(body);
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
