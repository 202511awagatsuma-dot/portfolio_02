package com.example.demo.repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import com.example.demo.model.Sequence;

@Repository
public class SequenceRepository {

    private final JdbcTemplate jdbcTemplate;

    public SequenceRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Long create(int durationMinutes, int level, boolean peakPoseEnabled, String peakPoseName) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    """
                    INSERT INTO sequences (duration_minutes, level, peak_pose_enabled, peak_pose_name, created_at, updated_at)
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    """,
                    new String[] { "id" });
            statement.setInt(1, durationMinutes);
            statement.setInt(2, level);
            statement.setBoolean(3, peakPoseEnabled);
            statement.setString(4, peakPoseName);
            return statement;
        }, keyHolder);

        return keyHolder.getKey().longValue();
    }

    public Optional<Sequence> findById(Long id) {
        return jdbcTemplate.query(
                """
                SELECT id, duration_minutes, level, peak_pose_enabled, peak_pose_name, created_at, updated_at
                FROM sequences
                WHERE id = ?
                """,
                (rs, rowNum) -> new Sequence(
                        rs.getLong("id"),
                        rs.getInt("duration_minutes"),
                        rs.getInt("level"),
                        rs.getBoolean("peak_pose_enabled"),
                        rs.getString("peak_pose_name"),
                        rs.getTimestamp("created_at").toLocalDateTime(),
                        rs.getTimestamp("updated_at").toLocalDateTime()),
                id).stream().findFirst();
    }
}
