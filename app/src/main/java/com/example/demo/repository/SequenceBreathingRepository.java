package com.example.demo.repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;

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

        return keyHolder.getKey().longValue();
    }
}
