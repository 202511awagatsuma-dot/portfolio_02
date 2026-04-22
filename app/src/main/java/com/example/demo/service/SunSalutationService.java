package com.example.demo.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.demo.model.SequenceSunSalutation;
import com.example.demo.model.SunSalutationMaster;
import com.example.demo.repository.SequenceRepository;
import com.example.demo.repository.SequenceSunSalutationRepository;
import com.example.demo.repository.SunSalutationMasterRepository;

@Service
public class SunSalutationService {

    private final SequenceRepository sequenceRepository;
    private final SunSalutationMasterRepository sunSalutationMasterRepository;
    private final SequenceSunSalutationRepository sequenceSunSalutationRepository;

    public SunSalutationService(
            SequenceRepository sequenceRepository,
            SunSalutationMasterRepository sunSalutationMasterRepository,
            SequenceSunSalutationRepository sequenceSunSalutationRepository) {
        this.sequenceRepository = sequenceRepository;
        this.sunSalutationMasterRepository = sunSalutationMasterRepository;
        this.sequenceSunSalutationRepository = sequenceSunSalutationRepository;
    }

    public List<SunSalutationMaster> getSunSalutationMasters() {
        return sunSalutationMasterRepository.findActiveAll();
    }

    public List<SequenceSunSalutation> getSequenceSunSalutations(Long sequenceId) {
        requireSequence(sequenceId);
        return sequenceSunSalutationRepository.findBySequenceId(sequenceId);
    }

    public void addMasterSelection(Long sequenceId, Long sunSalutationMasterId, String memo) {
        requireSequence(sequenceId);
        if (sunSalutationMasterId == null || !sunSalutationMasterRepository.existsActiveById(sunSalutationMasterId)) {
            return;
        }
        sequenceSunSalutationRepository.addMasterSelection(sequenceId, sunSalutationMasterId, normalizeOptionalText(memo));
    }

    public void addCustom(Long sequenceId, String customName, String memo) {
        requireSequence(sequenceId);
        String normalizedName = normalizeOptionalText(customName);
        if (normalizedName == null) {
            return;
        }
        sequenceSunSalutationRepository.addCustom(sequenceId, normalizedName, normalizeOptionalText(memo));
    }

    public void delete(Long sequenceId, Long sunSalutationId) {
        requireSequence(sequenceId);
        sequenceSunSalutationRepository.delete(sunSalutationId, sequenceId);
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
