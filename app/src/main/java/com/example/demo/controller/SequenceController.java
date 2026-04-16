package com.example.demo.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.example.demo.model.Sequence;
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
        model.addAttribute("sequence", sequence);
        model.addAttribute("sequenceId", sequenceId);
        model.addAttribute("levelIndicator", "★".repeat(sequence.level()) + "☆".repeat(Math.max(0, 5 - sequence.level())));
        model.addAttribute(
                "peakPoseLabel",
                sequence.peakPoseEnabled() && sequence.peakPoseName() != null && !sequence.peakPoseName().isBlank()
                        ? sequence.peakPoseName()
                        : "ピークポーズ未設定");
        model.addAttribute("breathingMasters", breathingService.getBreathingMasters());
        model.addAttribute("sequenceBreathings", breathingService.getSequenceBreathings(sequenceId));
        return "sequence-edit";
    }

    @PostMapping("/sequence/{sequenceId}/breathing")
    public String addBreathing(
            @PathVariable Long sequenceId,
            @RequestParam Long breathingMasterId,
            @RequestParam(required = false) String memo) {
        breathingService.addBreathingToSequence(sequenceId, breathingMasterId, memo);
        return "redirect:/sequence/edit/" + sequenceId;
    }
}
