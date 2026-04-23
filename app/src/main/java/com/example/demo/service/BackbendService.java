package com.example.demo.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.demo.model.BackbendMaster;
import com.example.demo.model.SequenceBackbend;
import com.example.demo.repository.BackbendMasterRepository;
import com.example.demo.repository.SequenceBackbendRepository;
import com.example.demo.repository.SequenceRepository;

@Service
public class BackbendService {

    private final SequenceRepository sequenceRepository;
    private final BackbendMasterRepository backbendMasterRepository;
    private final SequenceBackbendRepository sequenceBackbendRepository;

    public BackbendService(
            SequenceRepository sequenceRepository,
            BackbendMasterRepository backbendMasterRepository,
            SequenceBackbendRepository sequenceBackbendRepository) {
        this.sequenceRepository = sequenceRepository;
        this.backbendMasterRepository = backbendMasterRepository;
        this.sequenceBackbendRepository = sequenceBackbendRepository;
    }

    public List<BackbendMaster> getBackbendMasters() {
        return backbendMasterRepository.findActiveAll();
    }

    public List<SequenceBackbend> getSequenceBackbends(Long sequenceId) {
        requireSequence(sequenceId);
        return sequenceBackbendRepository.findBySequenceId(sequenceId);
    }

    public void addMasterSelection(Long sequenceId, Long backbendMasterId, String memo) {
        requireSequence(sequenceId);
        if (backbendMasterId == null || !backbendMasterRepository.existsActiveById(backbendMasterId)) {
            return;
        }
        sequenceBackbendRepository.addMasterSelection(sequenceId, backbendMasterId, normalizeOptionalText(memo));
    }

    public void addCustom(Long sequenceId, String customName, String memo) {
        requireSequence(sequenceId);
        String normalizedName = normalizeOptionalText(customName);
        if (normalizedName == null) {
            return;
        }
        sequenceBackbendRepository.addCustom(sequenceId, normalizedName, normalizeOptionalText(memo));
    }

    public void delete(Long sequenceId, Long sequenceBackbendId) {
        requireSequence(sequenceId);
        sequenceBackbendRepository.delete(sequenceBackbendId, sequenceId);
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
