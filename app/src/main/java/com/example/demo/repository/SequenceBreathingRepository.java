package com.example.demo.repository;

import java.sql.PreparedStatement;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import com.example.demo.model.SequenceBreathing;

@Repository
public class SequenceBreathingRepository {

    private final JdbcTemplate jdbcTemplate;

    public SequenceBreathingRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<SequenceBreathing> findBySequenceId(Long sequenceId) {
        return jdbcTemplate.query(
                """
                SELECT sb.id,
                       sb.sequence_id,
                       sb.breathing_master_id,
                       bm.name AS breathing_name,
                       bm.description AS breathing_description,
                       sb.display_order,
                       sb.memo,
                       sb.created_at,
                       sb.updated_at
                FROM sequence_breathing sb
                INNER JOIN breathing_master bm ON bm.id = sb.breathing_master_id
                WHERE sb.sequence_id = ?
                ORDER BY sb.display_order ASC, sb.id ASC
                """,
                (rs, rowNum) -> new SequenceBreathing(
                        rs.getLong("id"),
                        rs.getLong("sequence_id"),
                        rs.getLong("breathing_master_id"),
                        rs.getString("breathing_name"),
                        rs.getString("breathing_description"),
                        rs.getInt("display_order"),
                        rs.getString("memo"),
                        rs.getTimestamp("created_at").toLocalDateTime(),
                        rs.getTimestamp("updated_at").toLocalDateTime()),
                sequenceId);
    }

    public Long add(Long sequenceId, Long breathingMasterId, String memo) {
        Integer nextDisplayOrder = jdbcTemplate.queryForObject(
                """
                SELECT COALESCE(MAX(display_order), 0) + 1
                FROM sequence_breathing
                WHERE sequence_id = ?
                """,
                Integer.class,
                sequenceId);

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    """
                    INSERT INTO sequence_breathing
                    (sequence_id, breathing_master_id, display_order, memo, created_at, updated_at)
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    """,
                    new String[] { "id" });
            statement.setLong(1, sequenceId);
            statement.setLong(2, breathingMasterId);
            statement.setInt(3, nextDisplayOrder == null ? 1 : nextDisplayOrder);
            statement.setString(4, memo);
            return statement;
        }, keyHolder);

        return extractGeneratedId(keyHolder);
    }

    public void update(Long id, Long sequenceId, Long breathingMasterId, String memo) {
        jdbcTemplate.update(
                """
                UPDATE sequence_breathing
                SET breathing_master_id = ?,
                    memo = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND sequence_id = ?
                """,
                breathingMasterId,
                memo,
                id,
                sequenceId);
    }

    public void delete(Long id, Long sequenceId) {
        jdbcTemplate.update(
                """
                DELETE FROM sequence_breathing
                WHERE id = ? AND sequence_id = ?
                """,
                id,
                sequenceId);
    }

    private Long extractGeneratedId(KeyHolder keyHolder) {
        Map<String, Object> keys = keyHolder.getKeys();
        Long generatedId = extractId(keys);
        if (generatedId != null) {
            return generatedId;
        }

        List<Map<String, Object>> keyList = keyHolder.getKeyList();
        if (keyList.size() == 1) {
            generatedId = extractId(keyList.get(0));
            if (generatedId != null) {
                return generatedId;
            }
        }

        throw new IllegalStateException("Failed to extract generated sequence_breathing id.");
    }

    private Long extractId(Map<String, Object> keys) {
        if (keys == null || keys.isEmpty()) {
            return null;
        }

        for (String candidateKey : new String[] { "id", "ID" }) {
            Object value = keys.get(candidateKey);
            if (value instanceof Number generatedId) {
                return generatedId.longValue();
            }
        }

        if (keys.size() == 1) {
            Object onlyValue = keys.values().iterator().next();
            if (onlyValue instanceof Number generatedId) {
                return generatedId.longValue();
            }
        }

        return null;
    }
}
