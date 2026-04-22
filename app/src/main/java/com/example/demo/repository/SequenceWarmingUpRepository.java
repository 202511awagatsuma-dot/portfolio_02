package com.example.demo.repository;

import java.sql.PreparedStatement;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import com.example.demo.model.SequenceWarmingUp;

@Repository
public class SequenceWarmingUpRepository {

    private final JdbcTemplate jdbcTemplate;

    public SequenceWarmingUpRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<SequenceWarmingUp> findBySequenceId(Long sequenceId) {
        return jdbcTemplate.query(
                """
                SELECT swu.id,
                       swu.sequence_id,
                       swu.warming_up_master_id,
                       swu.custom_name,
                       COALESCE(wum.name_ja, swu.custom_name) AS display_name,
                       wum.name_sanskrit,
                       swu.sort_order,
                       swu.memo,
                       swu.created_at,
                       swu.updated_at
                FROM sequence_warming_up swu
                LEFT JOIN warming_up_master wum ON wum.id = swu.warming_up_master_id
                WHERE swu.sequence_id = ?
                ORDER BY swu.sort_order ASC, swu.id ASC
                """,
                (rs, rowNum) -> new SequenceWarmingUp(
                        rs.getLong("id"),
                        rs.getLong("sequence_id"),
                        getNullableLong(rs, "warming_up_master_id"),
                        rs.getString("custom_name"),
                        rs.getString("display_name"),
                        rs.getString("name_sanskrit"),
                        rs.getInt("sort_order"),
                        rs.getString("memo"),
                        rs.getObject("warming_up_master_id") == null,
                        rs.getTimestamp("created_at").toLocalDateTime(),
                        rs.getTimestamp("updated_at").toLocalDateTime()),
                sequenceId);
    }

    public Optional<SequenceWarmingUp> findByIdAndSequenceId(Long id, Long sequenceId) {
        return jdbcTemplate.query(
                """
                SELECT swu.id,
                       swu.sequence_id,
                       swu.warming_up_master_id,
                       swu.custom_name,
                       COALESCE(wum.name_ja, swu.custom_name) AS display_name,
                       wum.name_sanskrit,
                       swu.sort_order,
                       swu.memo,
                       swu.created_at,
                       swu.updated_at
                FROM sequence_warming_up swu
                LEFT JOIN warming_up_master wum ON wum.id = swu.warming_up_master_id
                WHERE swu.id = ? AND swu.sequence_id = ?
                """,
                (rs, rowNum) -> new SequenceWarmingUp(
                        rs.getLong("id"),
                        rs.getLong("sequence_id"),
                        getNullableLong(rs, "warming_up_master_id"),
                        rs.getString("custom_name"),
                        rs.getString("display_name"),
                        rs.getString("name_sanskrit"),
                        rs.getInt("sort_order"),
                        rs.getString("memo"),
                        rs.getObject("warming_up_master_id") == null,
                        rs.getTimestamp("created_at").toLocalDateTime(),
                        rs.getTimestamp("updated_at").toLocalDateTime()),
                id,
                sequenceId).stream().findFirst();
    }

    public Long addMasterSelection(Long sequenceId, Long warmingUpMasterId, String memo) {
        return insert(sequenceId, warmingUpMasterId, null, memo);
    }

    public Long addCustom(Long sequenceId, String customName, String memo) {
        return insert(sequenceId, null, customName, memo);
    }

    public void updateSortOrder(Long id, Long sequenceId, int sortOrder) {
        jdbcTemplate.update(
                """
                UPDATE sequence_warming_up
                SET sort_order = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND sequence_id = ?
                """,
                sortOrder,
                id,
                sequenceId);
    }

    public void delete(Long id, Long sequenceId) {
        jdbcTemplate.update(
                """
                DELETE FROM sequence_warming_up
                WHERE id = ? AND sequence_id = ?
                """,
                id,
                sequenceId);
    }

    private Long insert(Long sequenceId, Long warmingUpMasterId, String customName, String memo) {
        Integer nextSortOrder = jdbcTemplate.queryForObject(
                """
                SELECT COALESCE(MAX(sort_order), 0) + 1
                FROM sequence_warming_up
                WHERE sequence_id = ?
                """,
                Integer.class,
                sequenceId);

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    """
                    INSERT INTO sequence_warming_up
                    (sequence_id, warming_up_master_id, custom_name, sort_order, memo, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    """,
                    new String[] { "id" });
            statement.setLong(1, sequenceId);
            if (warmingUpMasterId == null) {
                statement.setNull(2, java.sql.Types.BIGINT);
            } else {
                statement.setLong(2, warmingUpMasterId);
            }
            statement.setString(3, customName);
            statement.setInt(4, nextSortOrder == null ? 1 : nextSortOrder);
            statement.setString(5, memo);
            return statement;
        }, keyHolder);

        return extractGeneratedId(keyHolder);
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

        throw new IllegalStateException("Failed to extract generated sequence_warming_up id.");
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

    private Long getNullableLong(java.sql.ResultSet rs, String columnName) throws java.sql.SQLException {
        Object value = rs.getObject(columnName);
        if (value instanceof Number number) {
            return number.longValue();
        }
        return null;
    }
}
