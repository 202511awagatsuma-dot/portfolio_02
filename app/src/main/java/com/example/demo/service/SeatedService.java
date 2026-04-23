package com.example.demo.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.demo.model.SeatedMaster;
import com.example.demo.model.SequenceSeated;
import com.example.demo.repository.SeatedMasterRepository;
import com.example.demo.repository.SequenceRepository;
import com.example.demo.repository.SequenceSeatedRepository;

@Service
public class SeatedService {

    private final SequenceRepository sequenceRepository;
    private final SeatedMasterRepository seatedMasterRepository;
    private final SequenceSeatedRepository sequenceSeatedRepository;

    public SeatedService(
            SequenceRepository sequenceRepository,
            SeatedMasterRepository seatedMasterRepository,
            SequenceSeatedRepository sequenceSeatedRepository) {
        this.sequenceRepository = sequenceRepository;
        this.seatedMasterRepository = seatedMasterRepository;
        this.sequenceSeatedRepository = sequenceSeatedRepository;
    }

    public List<SeatedMaster> getSeatedMasters() {
        return seatedMasterRepository.findActiveAll();
    }

    public List<SequenceSeated> getSequenceSeateds(Long sequenceId) {
        requireSequence(sequenceId);
        return sequenceSeatedRepository.findBySequenceId(sequenceId);
    }

    public void addMasterSelection(Long sequenceId, Long seatedMasterId, String memo) {
        requireSequence(sequenceId);
        if (seatedMasterId == null || !seatedMasterRepository.existsActiveById(seatedMasterId)) {
            return;
        }
        sequenceSeatedRepository.addMasterSelection(sequenceId, seatedMasterId, normalizeOptionalText(memo));
    }

    public void addCustom(Long sequenceId, String customName, String memo) {
        requireSequence(sequenceId);
        String normalizedName = normalizeOptionalText(customName);
        if (normalizedName == null) {
            return;
        }
        sequenceSeatedRepository.addCustom(sequenceId, normalizedName, normalizeOptionalText(memo));
    }

    public void delete(Long sequenceId, Long sequenceSeatedId) {
        requireSequence(sequenceId);
        sequenceSeatedRepository.delete(sequenceSeatedId, sequenceId);
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
