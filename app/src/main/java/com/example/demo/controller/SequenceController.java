package com.example.demo.controller;

import java.util.List;

import jakarta.servlet.http.HttpSession;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.example.demo.model.AsanaClassification;
import com.example.demo.model.Sequence;
import com.example.demo.model.SequenceBreathing;
import com.example.demo.model.SequenceConfirmationSection;
import com.example.demo.model.SequenceSunSalutation;
import com.example.demo.model.SequenceWarmingUp;
import com.example.demo.model.WarmingUpMaster;
import com.example.demo.service.BreathingService;
import com.example.demo.service.SunSalutationService;
import com.example.demo.service.WarmingUpService;

@Controller
public class SequenceController {

    private static final String CREATE_SEQUENCE_ID_SESSION_KEY = "stikaCreateSequenceId";

    private final BreathingService breathingService;
    private final WarmingUpService warmingUpService;
    private final SunSalutationService sunSalutationService;

    public SequenceController(
            BreathingService breathingService,
            WarmingUpService warmingUpService,
            SunSalutationService sunSalutationService) {
        this.breathingService = breathingService;
        this.warmingUpService = warmingUpService;
        this.sunSalutationService = sunSalutationService;
    }

    @GetMapping("/sequence/setup")
    public String setup() {
        return "sequence-setup";
    }

    @GetMapping("/sequence/edit")
    public String editLegacy() {
        return "redirect:/sequence/setup";
    }

    @GetMapping("/sequence-list.html")
    public String list() {
        return "sequence-list";
    }

    @GetMapping("/sequence-detail.html")
    public String detail() {
        return "sequence-detail";
    }

    @PostMapping({ "/sequence/create", "/sequence/create/init" })
    public String createSequence(
            @RequestParam(defaultValue = "60") int duration,
            @RequestParam(defaultValue = "3") int level,
            @RequestParam(defaultValue = "false") boolean peakPoseEnabled,
            @RequestParam(required = false) String peakPoseName,
            HttpSession session) {
        Long sequenceId = breathingService.createSequence(duration, level, peakPoseEnabled, peakPoseName);
        session.setAttribute(CREATE_SEQUENCE_ID_SESSION_KEY, sequenceId);
        return "redirect:/sequence/create/edit";
    }

    @GetMapping("/sequence/create/edit")
    public String createEdit(HttpSession session, Model model) {
        Object rawSequenceId = session.getAttribute(CREATE_SEQUENCE_ID_SESSION_KEY);

        if (!(rawSequenceId instanceof Long sequenceId)) {
            return "redirect:/sequence/setup";
        }

        Sequence sequence = breathingService.getSequence(sequenceId);
        List<SequenceBreathing> sequenceBreathings = breathingService.getSequenceBreathings(sequenceId);
        List<SequenceWarmingUp> sequenceWarmingUps = warmingUpService.getSequenceWarmingUps(sequenceId);
        List<SequenceSunSalutation> sequenceSunSalutations = sunSalutationService.getSequenceSunSalutations(sequenceId);
        List<WarmingUpMaster> warmingUpMasters = warmingUpService.getWarmingUpMasters();
        populateSequenceModel(model, sequence, sequenceId, sequenceBreathings, sequenceWarmingUps, sequenceSunSalutations);
        model.addAttribute("createMode", true);
        model.addAttribute("pageTitle", "シークエンス新規作成");
        model.addAttribute("breathingMasters", breathingService.getBreathingMasters());
        model.addAttribute("sequenceBreathings", sequenceBreathings);
        model.addAttribute("warmingUpMasters", warmingUpMasters);
        model.addAttribute("standingWarmingUpMasters",
                warmingUpService.getWarmingUpMastersByCategory(AsanaClassification.CATEGORY_STANDING));
        model.addAttribute("sequenceWarmingUps", sequenceWarmingUps);
        model.addAttribute("sunSalutationMasters", sunSalutationService.getSunSalutationMasters());
        model.addAttribute("sequenceSunSalutations", sequenceSunSalutations);
        return "sequence-edit";
    }

    @GetMapping("/sequence/edit/{sequenceId}")
    public String edit(@PathVariable Long sequenceId, Model model) {
        Sequence sequence = breathingService.getSequence(sequenceId);
        List<SequenceBreathing> sequenceBreathings = breathingService.getSequenceBreathings(sequenceId);
        List<SequenceWarmingUp> sequenceWarmingUps = warmingUpService.getSequenceWarmingUps(sequenceId);
        List<SequenceSunSalutation> sequenceSunSalutations = sunSalutationService.getSequenceSunSalutations(sequenceId);
        List<WarmingUpMaster> warmingUpMasters = warmingUpService.getWarmingUpMasters();
        populateSequenceModel(model, sequence, sequenceId, sequenceBreathings, sequenceWarmingUps, sequenceSunSalutations);
        model.addAttribute("createMode", false);
        model.addAttribute("pageTitle", "シークエンス編集");
        model.addAttribute("breathingMasters", breathingService.getBreathingMasters());
        model.addAttribute("sequenceBreathings", sequenceBreathings);
        model.addAttribute("warmingUpMasters", warmingUpMasters);
        model.addAttribute("standingWarmingUpMasters",
                warmingUpService.getWarmingUpMastersByCategory(AsanaClassification.CATEGORY_STANDING));
        model.addAttribute("sequenceWarmingUps", sequenceWarmingUps);
        model.addAttribute("sunSalutationMasters", sunSalutationService.getSunSalutationMasters());
        model.addAttribute("sequenceSunSalutations", sequenceSunSalutations);
        return "sequence-edit";
    }

    @GetMapping("/sequence/confirm/{sequenceId}")
    public String confirm(@PathVariable Long sequenceId, Model model, HttpSession session) {
        Sequence sequence = breathingService.getSequence(sequenceId);
        List<SequenceBreathing> sequenceBreathings = breathingService.getSequenceBreathings(sequenceId);
        List<SequenceWarmingUp> sequenceWarmingUps = warmingUpService.getSequenceWarmingUps(sequenceId);
        List<SequenceSunSalutation> sequenceSunSalutations = sunSalutationService.getSequenceSunSalutations(sequenceId);
        populateSequenceModel(model, sequence, sequenceId, sequenceBreathings, sequenceWarmingUps, sequenceSunSalutations);
        boolean createMode = isCreateSessionSequence(session, sequenceId);
        model.addAttribute("createMode", createMode);
        model.addAttribute("confirmationSections",
                buildConfirmationSections(sequence, sequenceBreathings, sequenceWarmingUps, sequenceSunSalutations));
        return "sequence-confirm";
    }

    @PostMapping("/sequence/{sequenceId}/save")
    public String saveSequence(
            @PathVariable Long sequenceId,
            HttpSession session,
            RedirectAttributes redirectAttributes) {
        if (isCreateSessionSequence(session, sequenceId)) {
            session.removeAttribute(CREATE_SEQUENCE_ID_SESSION_KEY);
        }
        redirectAttributes.addFlashAttribute("saveNotice", "保存しました。次回は一覧から確認できます。");
        return "redirect:/sequence/confirm/" + sequenceId;
    }

    @PostMapping("/sequence/{sequenceId}/breathing")
    public String addBreathing(
            @PathVariable Long sequenceId,
            @RequestParam Long breathingMasterId,
            @RequestParam(required = false, defaultValue = "edit") String mode,
            @RequestParam(required = false) String memo) {
        breathingService.addBreathingToSequence(sequenceId, breathingMasterId, memo);
        return buildEditRedirect(sequenceId, mode);
    }

    @PostMapping("/sequence/{sequenceId}/breathing/{breathingId}/update")
    public String updateBreathing(
            @PathVariable Long sequenceId,
            @PathVariable Long breathingId,
            @RequestParam Long breathingMasterId,
            @RequestParam(required = false, defaultValue = "edit") String mode,
            @RequestParam(required = false) String memo) {
        breathingService.updateSequenceBreathing(sequenceId, breathingId, breathingMasterId, memo);
        return buildEditRedirect(sequenceId, mode);
    }

    @PostMapping("/sequence/{sequenceId}/breathing/{breathingId}/delete")
    public String deleteBreathing(
            @PathVariable Long sequenceId,
            @PathVariable Long breathingId,
            @RequestParam(required = false, defaultValue = "edit") String mode) {
        breathingService.deleteSequenceBreathing(sequenceId, breathingId);
        return buildEditRedirect(sequenceId, mode);
    }

    @PostMapping("/sequence/{sequenceId}/warming-up/master")
    public String addWarmingUpFromMaster(
            @PathVariable Long sequenceId,
            @RequestParam Long warmingUpMasterId,
            @RequestParam(required = false, defaultValue = "edit") String mode,
            @RequestParam(required = false) String memo) {
        warmingUpService.addMasterSelection(sequenceId, warmingUpMasterId, memo);
        return buildEditRedirect(sequenceId, mode);
    }

    @PostMapping("/sequence/{sequenceId}/warming-up/custom")
    public String addCustomWarmingUp(
            @PathVariable Long sequenceId,
            @RequestParam String customName,
            @RequestParam(required = false, defaultValue = "edit") String mode,
            @RequestParam(required = false) String memo) {
        warmingUpService.addCustom(sequenceId, customName, memo);
        return buildEditRedirect(sequenceId, mode);
    }

    @PostMapping("/sequence/{sequenceId}/warming-up/register")
    public String registerWarmingUp(
            @PathVariable Long sequenceId,
            @RequestParam String nameJa,
            @RequestParam(required = false) String nameSanskrit,
            @RequestParam String category,
            @RequestParam(required = false) String standingSubcategory,
            @RequestParam(required = false, defaultValue = "edit") String mode,
            @RequestParam(required = false) String memo) {
        warmingUpService.registerMasterAndAdd(
                sequenceId,
                nameJa,
                nameSanskrit,
                category,
                standingSubcategory,
                memo);
        return buildEditRedirect(sequenceId, mode);
    }

    @PostMapping("/sequence/{sequenceId}/warming-up/{warmingUpId}/delete")
    public String deleteWarmingUp(
            @PathVariable Long sequenceId,
            @PathVariable Long warmingUpId,
            @RequestParam(required = false, defaultValue = "edit") String mode) {
        warmingUpService.delete(sequenceId, warmingUpId);
        return buildEditRedirect(sequenceId, mode);
    }

    @PostMapping("/sequence/{sequenceId}/warming-up/{warmingUpId}/move")
    public String moveWarmingUp(
            @PathVariable Long sequenceId,
            @PathVariable Long warmingUpId,
            @RequestParam(required = false, defaultValue = "edit") String mode,
            @RequestParam String direction) {
        warmingUpService.move(sequenceId, warmingUpId, direction);
        return buildEditRedirect(sequenceId, mode);
    }

    @PostMapping("/sequence/{sequenceId}/sun-salutation/master")
    public String addSunSalutationFromMaster(
            @PathVariable Long sequenceId,
            @RequestParam Long sunSalutationMasterId,
            @RequestParam(required = false, defaultValue = "edit") String mode,
            @RequestParam(required = false) String memo) {
        sunSalutationService.addMasterSelection(sequenceId, sunSalutationMasterId, memo);
        return buildEditRedirect(sequenceId, mode);
    }

    @PostMapping("/sequence/{sequenceId}/sun-salutation/custom")
    public String addCustomSunSalutation(
            @PathVariable Long sequenceId,
            @RequestParam String customName,
            @RequestParam(required = false, defaultValue = "edit") String mode,
            @RequestParam(required = false) String memo) {
        sunSalutationService.addCustom(sequenceId, customName, memo);
        return buildEditRedirect(sequenceId, mode);
    }

    @PostMapping("/sequence/{sequenceId}/sun-salutation/{sunSalutationId}/delete")
    public String deleteSunSalutation(
            @PathVariable Long sequenceId,
            @PathVariable Long sunSalutationId,
            @RequestParam(required = false, defaultValue = "edit") String mode) {
        sunSalutationService.delete(sequenceId, sunSalutationId);
        return buildEditRedirect(sequenceId, mode);
    }

    private String buildEditRedirect(Long sequenceId, String mode) {
        if ("create".equalsIgnoreCase(mode)) {
            return "redirect:/sequence/create/edit";
        }
        return "redirect:/sequence/edit/" + sequenceId;
    }

    private boolean isCreateSessionSequence(HttpSession session, Long sequenceId) {
        Object rawSequenceId = session.getAttribute(CREATE_SEQUENCE_ID_SESSION_KEY);
        return rawSequenceId instanceof Long createSequenceId && createSequenceId.equals(sequenceId);
    }

    private void populateSequenceModel(
            Model model,
            Sequence sequence,
            Long sequenceId,
            List<SequenceBreathing> sequenceBreathings,
            List<SequenceWarmingUp> sequenceWarmingUps,
            List<SequenceSunSalutation> sequenceSunSalutations) {
        model.addAttribute("sequence", sequence);
        model.addAttribute("sequenceId", sequenceId);
        populateAsanaClassificationOptions(model);
        model.addAttribute("levelIndicator", "●".repeat(sequence.level()) + "○".repeat(Math.max(0, 5 - sequence.level())));
        model.addAttribute("peakPoseLabel", resolvePeakPoseLabel(sequence));
        model.addAttribute("hasSequenceItems",
                hasSequenceItems(sequence, sequenceBreathings, sequenceWarmingUps, sequenceSunSalutations));
    }

    private List<SequenceConfirmationSection> buildConfirmationSections(
            Sequence sequence,
            List<SequenceBreathing> sequenceBreathings,
            List<SequenceWarmingUp> sequenceWarmingUps,
            List<SequenceSunSalutation> sequenceSunSalutations) {
        List<String> breathingNames = sequenceBreathings.stream()
                .map(SequenceBreathing::breathingName)
                .toList();
        List<String> warmingUpNames = sequenceWarmingUps.stream()
                .map(this::formatWarmingUpNameForConfirmation)
                .toList();
        List<String> sunSalutationNames = sequenceSunSalutations.stream()
                .map(SequenceSunSalutation::displayName)
                .toList();
        List<String> peakPoseNames = hasPeakPose(sequence)
                ? List.of(sequence.peakPoseName().trim())
                : List.of();

        return List.of(
                new SequenceConfirmationSection("breathing", "呼吸法", "5分", breathingNames),
                new SequenceConfirmationSection("warming-up", "Warming UP", "10分", warmingUpNames),
                new SequenceConfirmationSection("sun-salutation", "太陽礼拝", "10分", sunSalutationNames),
                new SequenceConfirmationSection("standing", "立位", "15分", List.of()),
                new SequenceConfirmationSection("peak", "ピークポーズ", "5分", peakPoseNames),
                new SequenceConfirmationSection("seated", "座位", "5分", List.of()),
                new SequenceConfirmationSection("relaxation", "リラクゼーション", "10分", List.of()));
    }

    private boolean hasSequenceItems(
            Sequence sequence,
            List<SequenceBreathing> sequenceBreathings,
            List<SequenceWarmingUp> sequenceWarmingUps,
            List<SequenceSunSalutation> sequenceSunSalutations) {
        return !sequenceBreathings.isEmpty()
                || !sequenceWarmingUps.isEmpty()
                || !sequenceSunSalutations.isEmpty()
                || hasPeakPose(sequence);
    }

    private boolean hasPeakPose(Sequence sequence) {
        return sequence.peakPoseEnabled()
                && sequence.peakPoseName() != null
                && !sequence.peakPoseName().isBlank();
    }

    private String resolvePeakPoseLabel(Sequence sequence) {
        return hasPeakPose(sequence) ? sequence.peakPoseName() : "ピークポーズ未設定";
    }

    private String formatWarmingUpNameForConfirmation(SequenceWarmingUp item) {
        String classification = item.classificationLabel();
        if (classification == null || classification.isBlank()) {
            return item.displayName();
        }
        return item.displayName() + "（" + classification + "）";
    }

    private void populateAsanaClassificationOptions(Model model) {
        model.addAttribute("asanaCategoryOptions", AsanaClassification.categoryOptions());
        model.addAttribute("standingSubcategoryOptions", AsanaClassification.standingSubcategoryOptions());
    }

}
