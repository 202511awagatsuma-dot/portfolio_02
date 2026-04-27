package com.example.demo.service;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.repository.SequenceRepository;

@Service
public class SequenceAsanaReorderService {

    private static final Map<String, ReorderTarget> TARGETS = Map.of(
            "breathing", new ReorderTarget("sequence_breathing", "display_order"),
            "warming-up", new ReorderTarget("sequence_warming_up", "sort_order"),
            "sun-salutation", new ReorderTarget("sequence_sun_salutation", "sort_order"),
            "peak", new ReorderTarget("sequence_peak_pose", "sort_order"),
            "backbend", new ReorderTarget("sequence_backbend", "sort_order"),
            "seated", new ReorderTarget("sequence_seated", "sort_order"),
            "relaxation", new ReorderTarget("sequence_relaxation", "sort_order"));

    private final JdbcTemplate jdbcTemplate;
    private final SequenceRepository sequenceRepository;

    public SequenceAsanaReorderService(JdbcTemplate jdbcTemplate, SequenceRepository sequenceRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.sequenceRepository = sequenceRepository;
    }

    @Transactional
    public void reorder(Long sequenceId, String category, List<Long> itemIds) {
        requireSequence(sequenceId);

        ReorderTarget target = TARGETS.get(category);
        if (target == null || itemIds == null || itemIds.isEmpty()) {
            return;
        }

        List<Long> currentIds = jdbcTemplate.queryForList(
                "SELECT id FROM " + target.tableName() + " WHERE sequence_id = ? ORDER BY " + target.orderColumn() + " ASC, id ASC",
                Long.class,
                sequenceId);

        if (!hasSameIds(currentIds, itemIds)) {
            return;
        }

        for (int index = 0; index < itemIds.size(); index += 1) {
            jdbcTemplate.update(
                    "UPDATE " + target.tableName() + " SET " + target.orderColumn() + " = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND sequence_id = ?",
                    index + 1,
                    itemIds.get(index),
                    sequenceId);
        }
    }

    private boolean hasSameIds(List<Long> currentIds, List<Long> requestedIds) {
        if (currentIds.size() != requestedIds.size()) {
            return false;
        }

        Set<Long> currentSet = new HashSet<>(currentIds);
        Set<Long> requestedSet = new HashSet<>(requestedIds);
        return currentSet.size() == requestedSet.size() && currentSet.equals(requestedSet);
    }

    private void requireSequence(Long sequenceId) {
        sequenceRepository.findById(sequenceId)
                .orElseThrow(() -> new IllegalArgumentException("Sequence not found: " + sequenceId));
    }

    private record ReorderTarget(String tableName, String orderColumn) {
    }
}
