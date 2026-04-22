package com.example.demo.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.model.AsanaClassification;
import com.example.demo.model.SequenceWarmingUp;
import com.example.demo.model.WarmingUpMaster;
import com.example.demo.repository.SequenceRepository;
import com.example.demo.repository.SequenceWarmingUpRepository;
import com.example.demo.repository.WarmingUpMasterRepository;

@Service
public class WarmingUpService {

    private final SequenceRepository sequenceRepository;
    private final WarmingUpMasterRepository warmingUpMasterRepository;
    private final SequenceWarmingUpRepository sequenceWarmingUpRepository;

    public WarmingUpService(
            SequenceRepository sequenceRepository,
            WarmingUpMasterRepository warmingUpMasterRepository,
            SequenceWarmingUpRepository sequenceWarmingUpRepository) {
        this.sequenceRepository = sequenceRepository;
        this.warmingUpMasterRepository = warmingUpMasterRepository;
        this.sequenceWarmingUpRepository = sequenceWarmingUpRepository;
    }

    public List<WarmingUpMaster> getWarmingUpMasters() {
        return warmingUpMasterRepository.findActiveAll();
    }

    public List<SequenceWarmingUp> getSequenceWarmingUps(Long sequenceId) {
        requireSequence(sequenceId);
        return sequenceWarmingUpRepository.findBySequenceId(sequenceId);
    }

    public void addMasterSelection(Long sequenceId, Long warmingUpMasterId, String memo) {
        requireSequence(sequenceId);
        if (warmingUpMasterId == null || !warmingUpMasterRepository.existsActiveById(warmingUpMasterId)) {
            return;
        }
        sequenceWarmingUpRepository.addMasterSelection(sequenceId, warmingUpMasterId, normalizeOptionalText(memo));
    }

    public void addCustom(Long sequenceId, String customName, String memo) {
        requireSequence(sequenceId);
        String normalizedName = normalizeOptionalText(customName);
        if (normalizedName == null) {
            return;
        }
        sequenceWarmingUpRepository.addCustom(sequenceId, normalizedName, normalizeOptionalText(memo));
    }

    @Transactional
    public void registerMasterAndAdd(
            Long sequenceId,
            String nameJa,
            String nameSanskrit,
            String category,
            String standingSubcategory,
            String memo) {
        requireSequence(sequenceId);

        String normalizedNameJa = normalizeOptionalText(nameJa);
        String normalizedSanskrit = normalizeOptionalText(nameSanskrit);
        String normalizedCategory = normalizeOptionalText(category);
        String normalizedStandingSubcategory = normalizeOptionalText(standingSubcategory);

        if (normalizedNameJa == null || !AsanaClassification.isValidCategory(normalizedCategory)) {
            return;
        }

        if (AsanaClassification.requiresStandingSubcategory(normalizedCategory)) {
            if (!AsanaClassification.isValidStandingSubcategory(normalizedStandingSubcategory)) {
                return;
            }
        } else {
            normalizedStandingSubcategory = null;
        }

        Long masterId = warmingUpMasterRepository.findActiveIdByNameJa(normalizedNameJa)
                .orElseGet(() -> warmingUpMasterRepository.save(
                        normalizedNameJa,
                        normalizedSanskrit,
                        normalizedCategory,
                        normalizedStandingSubcategory,
                        warmingUpMasterRepository.nextDisplayOrder()));

        sequenceWarmingUpRepository.addMasterSelection(sequenceId, masterId, normalizeOptionalText(memo));
    }

    public void delete(Long sequenceId, Long warmingUpId) {
        requireSequence(sequenceId);
        sequenceWarmingUpRepository.delete(warmingUpId, sequenceId);
        resequence(sequenceId);
    }

    @Transactional
    public void move(Long sequenceId, Long warmingUpId, String direction) {
        requireSequence(sequenceId);
        SequenceWarmingUp current = sequenceWarmingUpRepository.findByIdAndSequenceId(warmingUpId, sequenceId)
                .orElse(null);
        if (current == null) {
            return;
        }

        List<SequenceWarmingUp> items = sequenceWarmingUpRepository.findBySequenceId(sequenceId);
        int currentIndex = indexOf(items, warmingUpId);
        if (currentIndex < 0) {
            return;
        }

        int targetIndex = switch (direction == null ? "" : direction) {
            case "up" -> currentIndex - 1;
            case "down" -> currentIndex + 1;
            default -> currentIndex;
        };

        if (targetIndex < 0 || targetIndex >= items.size() || targetIndex == currentIndex) {
            return;
        }

        SequenceWarmingUp target = items.get(targetIndex);
        sequenceWarmingUpRepository.updateSortOrder(current.id(), sequenceId, target.sortOrder());
        sequenceWarmingUpRepository.updateSortOrder(target.id(), sequenceId, current.sortOrder());
        resequence(sequenceId);
    }

    private void requireSequence(Long sequenceId) {
        sequenceRepository.findById(sequenceId)
                .orElseThrow(() -> new IllegalArgumentException("Sequence not found: " + sequenceId));
    }

    private void resequence(Long sequenceId) {
        List<SequenceWarmingUp> items = sequenceWarmingUpRepository.findBySequenceId(sequenceId);
        for (int index = 0; index < items.size(); index += 1) {
            int nextOrder = index + 1;
            if (items.get(index).sortOrder() != nextOrder) {
                sequenceWarmingUpRepository.updateSortOrder(items.get(index).id(), sequenceId, nextOrder);
            }
        }
    }

    private int indexOf(List<SequenceWarmingUp> items, Long warmingUpId) {
        for (int index = 0; index < items.size(); index += 1) {
            if (items.get(index).id().equals(warmingUpId)) {
                return index;
            }
        }
        return -1;
    }

    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
