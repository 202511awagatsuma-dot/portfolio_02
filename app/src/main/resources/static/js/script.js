document.addEventListener("DOMContentLoaded", () => {
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
});
