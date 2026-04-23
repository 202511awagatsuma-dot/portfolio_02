package com.example.demo.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.demo.model.RelaxationMaster;
import com.example.demo.model.SequenceRelaxation;
import com.example.demo.repository.RelaxationMasterRepository;
import com.example.demo.repository.SequenceRelaxationRepository;
import com.example.demo.repository.SequenceRepository;

@Service
public class RelaxationService {

    private final SequenceRepository sequenceRepository;
    private final RelaxationMasterRepository relaxationMasterRepository;
    private final SequenceRelaxationRepository sequenceRelaxationRepository;

    public RelaxationService(
            SequenceRepository sequenceRepository,
            RelaxationMasterRepository relaxationMasterRepository,
            SequenceRelaxationRepository sequenceRelaxationRepository) {
        this.sequenceRepository = sequenceRepository;
        this.relaxationMasterRepository = relaxationMasterRepository;
        this.sequenceRelaxationRepository = sequenceRelaxationRepository;
    }

    public List<RelaxationMaster> getRelaxationMasters() {
        return relaxationMasterRepository.findActiveAll();
    }

    public List<SequenceRelaxation> getSequenceRelaxations(Long sequenceId) {
        requireSequence(sequenceId);
        return sequenceRelaxationRepository.findBySequenceId(sequenceId);
    }

    public void addMasterSelection(Long sequenceId, Long relaxationMasterId, String memo) {
        requireSequence(sequenceId);
        if (relaxationMasterId == null || !relaxationMasterRepository.existsActiveById(relaxationMasterId)) {
            return;
        }
        sequenceRelaxationRepository.addMasterSelection(sequenceId, relaxationMasterId, normalizeOptionalText(memo));
    }

    public void addCustom(Long sequenceId, String customName, String memo) {
        requireSequence(sequenceId);
        String normalizedName = normalizeOptionalText(customName);
        if (normalizedName == null) {
            return;
        }
        sequenceRelaxationRepository.addCustom(sequenceId, normalizedName, normalizeOptionalText(memo));
    }

    public void delete(Long sequenceId, Long sequenceRelaxationId) {
        requireSequence(sequenceId);
        sequenceRelaxationRepository.delete(sequenceRelaxationId, sequenceId);
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
