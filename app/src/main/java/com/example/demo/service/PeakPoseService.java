package com.example.demo.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.demo.model.PeakPoseMaster;
import com.example.demo.model.SequencePeakPose;
import com.example.demo.repository.PeakPoseMasterRepository;
import com.example.demo.repository.SequencePeakPoseRepository;
import com.example.demo.repository.SequenceRepository;

@Service
public class PeakPoseService {

    private final SequenceRepository sequenceRepository;
    private final PeakPoseMasterRepository peakPoseMasterRepository;
    private final SequencePeakPoseRepository sequencePeakPoseRepository;

    public PeakPoseService(
            SequenceRepository sequenceRepository,
            PeakPoseMasterRepository peakPoseMasterRepository,
            SequencePeakPoseRepository sequencePeakPoseRepository) {
        this.sequenceRepository = sequenceRepository;
        this.peakPoseMasterRepository = peakPoseMasterRepository;
        this.sequencePeakPoseRepository = sequencePeakPoseRepository;
    }

    public List<PeakPoseMaster> getPeakPoseMasters() {
        return peakPoseMasterRepository.findActiveAll();
    }

    public List<SequencePeakPose> getSequencePeakPoses(Long sequenceId) {
        requireSequence(sequenceId);
        return sequencePeakPoseRepository.findBySequenceId(sequenceId);
    }

    public void addMasterSelection(Long sequenceId, Long peakPoseMasterId) {
        requireSequence(sequenceId);
        if (peakPoseMasterId == null || !peakPoseMasterRepository.existsActiveById(peakPoseMasterId)) {
            return;
        }
        sequencePeakPoseRepository.addMasterSelection(sequenceId, peakPoseMasterId);
    }

    public void addCustom(Long sequenceId, String customName) {
        requireSequence(sequenceId);
        String normalizedName = normalizeOptionalText(customName);
        if (normalizedName == null) {
            return;
        }
        sequencePeakPoseRepository.addCustom(sequenceId, normalizedName);
    }

    public void delete(Long sequenceId, Long sequencePeakPoseId) {
        requireSequence(sequenceId);
        sequencePeakPoseRepository.delete(sequencePeakPoseId, sequenceId);
    }

    private void requireSequence(Long sequenceId) {
        sequenceRepository.findById(sequenceId)
                .orElseThrow(() -> new IllegalArgumentException("Sequence not found: " + sequenceId));
    }

    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
