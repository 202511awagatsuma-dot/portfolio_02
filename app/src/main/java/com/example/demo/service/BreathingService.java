package com.example.demo.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.demo.model.BreathingMaster;
import com.example.demo.model.Sequence;
import com.example.demo.model.SequenceBreathing;
import com.example.demo.repository.BreathingMasterRepository;
import com.example.demo.repository.SequenceBreathingRepository;
import com.example.demo.repository.SequenceRepository;

@Service
public class BreathingService {

    public static final String BREATHING_CATEGORY = "BREATHING";

    private final SequenceRepository sequenceRepository;
    private final BreathingMasterRepository breathingMasterRepository;
    private final SequenceBreathingRepository sequenceBreathingRepository;

    public BreathingService(
            SequenceRepository sequenceRepository,
            BreathingMasterRepository breathingMasterRepository,
            SequenceBreathingRepository sequenceBreathingRepository) {
        this.sequenceRepository = sequenceRepository;
        this.breathingMasterRepository = breathingMasterRepository;
        this.sequenceBreathingRepository = sequenceBreathingRepository;
    }

    public Long createSequence(int durationMinutes, int level, boolean peakPoseEnabled, String peakPoseName) {
        String normalizedPeakPoseName = peakPoseEnabled ? peakPoseName : null;
        return sequenceRepository.create(durationMinutes, level, peakPoseEnabled, normalizedPeakPoseName);
    }

    public Sequence getSequence(Long sequenceId) {
        return sequenceRepository.findById(sequenceId)
                .orElseThrow(() -> new IllegalArgumentException("Sequence not found: " + sequenceId));
    }

    public List<BreathingMaster> getBreathingMasters() {
        return breathingMasterRepository.findActiveByCategory(BREATHING_CATEGORY);
    }

    public List<SequenceBreathing> getSequenceBreathings(Long sequenceId) {
        return sequenceBreathingRepository.findBySequenceId(sequenceId);
    }

    public void addBreathingToSequence(Long sequenceId, Long breathingMasterId, String memo) {
        getSequence(sequenceId);
        sequenceBreathingRepository.add(sequenceId, breathingMasterId, memo);
    }
}
