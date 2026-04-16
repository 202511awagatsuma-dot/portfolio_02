package com.example.demo.repository;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.example.demo.model.BreathingMaster;

@Repository
public class BreathingMasterRepository {

    private final JdbcTemplate jdbcTemplate;

    public BreathingMasterRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<BreathingMaster> findActiveByCategory(String category) {
        return jdbcTemplate.query(
                """
                SELECT id, name, category, description, is_active, created_at, updated_at
                FROM breathing_master
                WHERE category = ? AND is_active = TRUE
                ORDER BY name ASC
                """,
                (rs, rowNum) -> new BreathingMaster(
                        rs.getLong("id"),
                        rs.getString("name"),
                        rs.getString("category"),
                        rs.getString("description"),
                        rs.getBoolean("is_active"),
                        rs.getTimestamp("created_at").toLocalDateTime(),
                        rs.getTimestamp("updated_at").toLocalDateTime()),
                category);
    }

    public boolean existsByNameAndCategory(String name, String category) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM breathing_master
                WHERE name = ? AND category = ?
                """,
                Integer.class,
                name,
                category);
        return count != null && count > 0;
    }

    public void save(String name, String category, String description) {
        jdbcTemplate.update(
                """
                INSERT INTO breathing_master (name, category, description, is_active, created_at, updated_at)
                VALUES (?, ?, ?, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """,
                name,
                category,
                description);
    }
}
