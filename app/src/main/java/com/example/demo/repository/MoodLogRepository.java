package com.example.demo.repository;

import java.sql.Date;
import java.sql.PreparedStatement;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import com.example.demo.model.MoodLog;

@Repository
public class MoodLogRepository {

    private final JdbcTemplate jdbcTemplate;

    public MoodLogRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<MoodLog> findByDate(LocalDate logDate) {
        return jdbcTemplate.query(
                """
                SELECT id, log_date, mood, memo, created_at, updated_at
                FROM mood_logs
                WHERE log_date = ?
                """,
                (rs, rowNum) -> new MoodLog(
                        rs.getLong("id"),
                        rs.getDate("log_date").toLocalDate(),
                        rs.getString("mood"),
                        rs.getString("memo"),
                        rs.getTimestamp("created_at").toLocalDateTime(),
                        rs.getTimestamp("updated_at").toLocalDateTime()),
                Date.valueOf(logDate)).stream().findFirst();
    }

    public List<LocalDate> findLogDatesInRange(LocalDate fromInclusive, LocalDate toInclusive) {
        return jdbcTemplate.query(
                """
                SELECT log_date
                FROM mood_logs
                WHERE log_date BETWEEN ? AND ?
                ORDER BY log_date ASC
                """,
                (rs, rowNum) -> rs.getDate("log_date").toLocalDate(),
                Date.valueOf(fromInclusive),
                Date.valueOf(toInclusive));
    }

    public Long create(LocalDate logDate, String mood, String memo) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    """
                    INSERT INTO mood_logs (log_date, mood, memo, created_at, updated_at)
                    VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    """,
                    new String[] { "id" });
            statement.setDate(1, Date.valueOf(logDate));
            statement.setString(2, mood);
            statement.setString(3, memo);
            return statement;
        }, keyHolder);

        return extractGeneratedId(keyHolder);
    }

    public int updateByDate(LocalDate logDate, String mood, String memo) {
        return jdbcTemplate.update(
                """
                UPDATE mood_logs
                SET mood = ?,
                    memo = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE log_date = ?
                """,
                mood,
                memo,
                Date.valueOf(logDate));
    }

    public int deleteByDate(LocalDate logDate) {
        return jdbcTemplate.update(
                """
                DELETE FROM mood_logs
                WHERE log_date = ?
                """,
                Date.valueOf(logDate));
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

        throw new IllegalStateException("Failed to extract generated mood_logs id.");
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
