package com.example.demo.controller;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.example.demo.model.Sequence;
import com.example.demo.model.SequenceBreathing;
import com.example.demo.model.SequenceConfirmationSection;
import com.example.demo.service.BreathingService;

@Controller
public class SequenceController {

    private final BreathingService breathingService;

    public SequenceController(BreathingService breathingService) {
        this.breathingService = breathingService;
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

    @PostMapping("/sequence/create")
    public String createSequence(
            @RequestParam(defaultValue = "60") int duration,
            @RequestParam(defaultValue = "3") int level,
            @RequestParam(defaultValue = "false") boolean peakPoseEnabled,
            @RequestParam(required = false) String peakPoseName) {
        Long sequenceId = breathingService.createSequence(duration, level, peakPoseEnabled, peakPoseName);
        return "redirect:/sequence/edit/" + sequenceId;
    }

    @GetMapping("/sequence/edit/{sequenceId}")
    public String edit(@PathVariable Long sequenceId, Model model) {
        Sequence sequence = breathingService.getSequence(sequenceId);
        List<SequenceBreathing> sequenceBreathings = breathingService.getSequenceBreathings(sequenceId);
        populateSequenceModel(model, sequence, sequenceId, sequenceBreathings);
        model.addAttribute("breathingMasters", breathingService.getBreathingMasters());
        model.addAttribute("sequenceBreathings", sequenceBreathings);
        return "sequence-edit";
    }

    @GetMapping("/sequence/confirm/{sequenceId}")
    public String confirm(@PathVariable Long sequenceId, Model model) {
        Sequence sequence = breathingService.getSequence(sequenceId);
        List<SequenceBreathing> sequenceBreathings = breathingService.getSequenceBreathings(sequenceId);
        populateSequenceModel(model, sequence, sequenceId, sequenceBreathings);
        model.addAttribute("confirmationSections", buildConfirmationSections(sequence, sequenceBreathings));
        return "sequence-confirm";
    }

    @PostMapping("/sequence/{sequenceId}/save")
    public String saveSequence(
            @PathVariable Long sequenceId,
            RedirectAttributes redirectAttributes) {
        redirectAttributes.addFlashAttribute("saveNotice", "保存しました。次回は一覧から確認できます。");
        return "redirect:/sequence/confirm/" + sequenceId;
    }

    @PostMapping("/sequence/{sequenceId}/breathing")
    public String addBreathing(
            @PathVariable Long sequenceId,
            @RequestParam Long breathingMasterId,
            @RequestParam(required = false) String memo) {
        breathingService.addBreathingToSequence(sequenceId, breathingMasterId, memo);
        return "redirect:/sequence/edit/" + sequenceId;
    }

    @PostMapping("/sequence/{sequenceId}/breathing/{breathingId}/update")
    public String updateBreathing(
            @PathVariable Long sequenceId,
            @PathVariable Long breathingId,
            @RequestParam Long breathingMasterId,
            @RequestParam(required = false) String memo) {
        breathingService.updateSequenceBreathing(sequenceId, breathingId, breathingMasterId, memo);
        return "redirect:/sequence/edit/" + sequenceId;
    }

    @PostMapping("/sequence/{sequenceId}/breathing/{breathingId}/delete")
    public String deleteBreathing(
            @PathVariable Long sequenceId,
            @PathVariable Long breathingId) {
        breathingService.deleteSequenceBreathing(sequenceId, breathingId);
        return "redirect:/sequence/edit/" + sequenceId;
    }

    private void populateSequenceModel(
            Model model,
            Sequence sequence,
            Long sequenceId,
            List<SequenceBreathing> sequenceBreathings) {
        model.addAttribute("sequence", sequence);
        model.addAttribute("sequenceId", sequenceId);
        model.addAttribute("levelIndicator", "★".repeat(sequence.level()) + "☆".repeat(Math.max(0, 5 - sequence.level())));
        model.addAttribute("peakPoseLabel", resolvePeakPoseLabel(sequence));
        model.addAttribute("hasSequenceItems", hasSequenceItems(sequence, sequenceBreathings));
    }

    private List<SequenceConfirmationSection> buildConfirmationSections(
            Sequence sequence,
            List<SequenceBreathing> sequenceBreathings) {
        List<String> breathingNames = sequenceBreathings.stream()
                .map(SequenceBreathing::breathingName)
                .toList();
        List<String> peakPoseNames = hasPeakPose(sequence)
                ? List.of(sequence.peakPoseName().trim())
                : List.of();

        return List.of(
                new SequenceConfirmationSection("breathing", "呼吸法", "5分", breathingNames),
                new SequenceConfirmationSection("warming-up", "Warming UP", "10分", List.of()),
                new SequenceConfirmationSection("sun-salutation", "太陽礼拝", "10分", List.of()),
                new SequenceConfirmationSection("standing", "立位", "15分", List.of()),
                new SequenceConfirmationSection("peak", "ピークポーズ", "5分", peakPoseNames),
                new SequenceConfirmationSection("seated", "座位", "5分", List.of()),
                new SequenceConfirmationSection("relaxation", "リラクゼーション", "10分", List.of()));
    }

    private boolean hasSequenceItems(Sequence sequence, List<SequenceBreathing> sequenceBreathings) {
        return !sequenceBreathings.isEmpty() || hasPeakPose(sequence);
    }

    private boolean hasPeakPose(Sequence sequence) {
        return sequence.peakPoseEnabled()
                && sequence.peakPoseName() != null
                && !sequence.peakPoseName().isBlank();
    }

    private String resolvePeakPoseLabel(Sequence sequence) {
        return hasPeakPose(sequence) ? sequence.peakPoseName() : "ピークポーズ未設定";
    }
}
