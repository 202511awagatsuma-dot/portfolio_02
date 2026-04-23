package com.example.demo.repository;

import java.sql.PreparedStatement;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import com.example.demo.model.SequenceSeated;

@Repository
public class SequenceSeatedRepository {

    private final JdbcTemplate jdbcTemplate;

    public SequenceSeatedRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<SequenceSeated> findBySequenceId(Long sequenceId) {
        return jdbcTemplate.query(
                """
                SELECT ss.id,
                       ss.sequence_id,
                       ss.seated_master_id,
                       ss.custom_name,
                       COALESCE(sm.name_ja, ss.custom_name) AS display_name,
                       ss.sort_order,
                       ss.memo,
                       ss.created_at,
                       ss.updated_at
                FROM sequence_seated ss
                LEFT JOIN seated_master sm ON sm.id = ss.seated_master_id
                WHERE ss.sequence_id = ?
                ORDER BY ss.sort_order ASC, ss.id ASC
                """,
                (rs, rowNum) -> new SequenceSeated(
                        rs.getLong("id"),
                        rs.getLong("sequence_id"),
                        getNullableLong(rs, "seated_master_id"),
                        rs.getString("custom_name"),
                        rs.getString("display_name"),
                        rs.getInt("sort_order"),
                        rs.getString("memo"),
                        rs.getObject("seated_master_id") == null,
                        rs.getTimestamp("created_at").toLocalDateTime(),
                        rs.getTimestamp("updated_at").toLocalDateTime()),
                sequenceId);
    }

    public Long addMasterSelection(Long sequenceId, Long seatedMasterId, String memo) {
        return insert(sequenceId, seatedMasterId, null, memo);
    }

    public Long addCustom(Long sequenceId, String customName, String memo) {
        return insert(sequenceId, null, customName, memo);
    }

    public void delete(Long id, Long sequenceId) {
        jdbcTemplate.update(
                """
                DELETE FROM sequence_seated
                WHERE id = ? AND sequence_id = ?
                """,
                id,
                sequenceId);
    }

    private Long insert(Long sequenceId, Long seatedMasterId, String customName, String memo) {
        Integer nextSortOrder = jdbcTemplate.queryForObject(
                """
                SELECT COALESCE(MAX(sort_order), 0) + 1
                FROM sequence_seated
                WHERE sequence_id = ?
                """,
                Integer.class,
                sequenceId);

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    """
                    INSERT INTO sequence_seated
                    (sequence_id, seated_master_id, custom_name, sort_order, memo, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    """,
                    new String[] { "id" });
            statement.setLong(1, sequenceId);
            if (seatedMasterId == null) {
                statement.setNull(2, java.sql.Types.BIGINT);
            } else {
                statement.setLong(2, seatedMasterId);
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

        throw new IllegalStateException("Failed to extract generated sequence_seated id.");
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
