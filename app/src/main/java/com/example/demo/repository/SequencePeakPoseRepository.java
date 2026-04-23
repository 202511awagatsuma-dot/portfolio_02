package com.example.demo.repository;

import java.sql.PreparedStatement;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import com.example.demo.model.SequencePeakPose;

@Repository
public class SequencePeakPoseRepository {

    private final JdbcTemplate jdbcTemplate;

    public SequencePeakPoseRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<SequencePeakPose> findBySequenceId(Long sequenceId) {
        return jdbcTemplate.query(
                """
                SELECT spp.id,
                       spp.sequence_id,
                       spp.peak_pose_master_id,
                       spp.custom_name,
                       COALESCE(ppm.name_ja, spp.custom_name) AS display_name,
                       spp.sort_order,
                       spp.created_at,
                       spp.updated_at
                FROM sequence_peak_pose spp
                LEFT JOIN peak_pose_master ppm ON ppm.id = spp.peak_pose_master_id
                WHERE spp.sequence_id = ?
                ORDER BY spp.sort_order ASC, spp.id ASC
                """,
                (rs, rowNum) -> new SequencePeakPose(
                        rs.getLong("id"),
                        rs.getLong("sequence_id"),
                        getNullableLong(rs, "peak_pose_master_id"),
                        rs.getString("custom_name"),
                        rs.getString("display_name"),
                        rs.getInt("sort_order"),
                        rs.getObject("peak_pose_master_id") == null,
                        rs.getTimestamp("created_at").toLocalDateTime(),
                        rs.getTimestamp("updated_at").toLocalDateTime()),
                sequenceId);
    }

    public Long addMasterSelection(Long sequenceId, Long peakPoseMasterId) {
        return insert(sequenceId, peakPoseMasterId, null);
    }

    public Long addCustom(Long sequenceId, String customName) {
        return insert(sequenceId, null, customName);
    }

    public void delete(Long id, Long sequenceId) {
        jdbcTemplate.update(
                """
                DELETE FROM sequence_peak_pose
                WHERE id = ? AND sequence_id = ?
                """,
                id,
                sequenceId);
    }

    private Long insert(Long sequenceId, Long peakPoseMasterId, String customName) {
        Integer nextSortOrder = jdbcTemplate.queryForObject(
                """
                SELECT COALESCE(MAX(sort_order), 0) + 1
                FROM sequence_peak_pose
                WHERE sequence_id = ?
                """,
                Integer.class,
                sequenceId);

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    """
                    INSERT INTO sequence_peak_pose
                    (sequence_id, peak_pose_master_id, custom_name, sort_order, created_at, updated_at)
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    """,
                    new String[] { "id" });
            statement.setLong(1, sequenceId);
            if (peakPoseMasterId == null) {
                statement.setNull(2, java.sql.Types.BIGINT);
            } else {
                statement.setLong(2, peakPoseMasterId);
            }
            statement.setString(3, customName);
            statement.setInt(4, nextSortOrder == null ? 1 : nextSortOrder);
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

        throw new IllegalStateException("Failed to extract generated sequence_peak_pose id.");
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
