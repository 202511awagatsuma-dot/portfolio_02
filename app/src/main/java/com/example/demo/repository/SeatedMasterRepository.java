package com.example.demo.repository;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.example.demo.model.SeatedMaster;

@Repository
public class SeatedMasterRepository {

    private final JdbcTemplate jdbcTemplate;

    public SeatedMasterRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<SeatedMaster> findActiveAll() {
        return jdbcTemplate.query(
                """
                SELECT id, name_ja, display_order, is_active, created_at, updated_at
                FROM seated_master
                WHERE is_active = TRUE
                ORDER BY display_order ASC, id ASC
                """,
                (rs, rowNum) -> new SeatedMaster(
                        rs.getLong("id"),
                        rs.getString("name_ja"),
                        rs.getInt("display_order"),
                        rs.getBoolean("is_active"),
                        rs.getTimestamp("created_at").toLocalDateTime(),
                        rs.getTimestamp("updated_at").toLocalDateTime()));
    }

    public boolean existsActiveById(Long id) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM seated_master
                WHERE id = ? AND is_active = TRUE
                """,
                Integer.class,
                id);
        return count != null && count > 0;
    }

    public boolean existsByNameJa(String nameJa) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM seated_master
                WHERE name_ja = ?
                """,
                Integer.class,
                nameJa);
        return count != null && count > 0;
    }

    public void save(String nameJa, int displayOrder) {
        jdbcTemplate.update(
                """
                INSERT INTO seated_master (name_ja, display_order, is_active, created_at, updated_at)
                VALUES (?, ?, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """,
                nameJa,
                displayOrder);
    }
}
