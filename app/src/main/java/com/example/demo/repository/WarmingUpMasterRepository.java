package com.example.demo.repository;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.example.demo.model.WarmingUpMaster;

@Repository
public class WarmingUpMasterRepository {

    private final JdbcTemplate jdbcTemplate;

    public WarmingUpMasterRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<WarmingUpMaster> findActiveAll() {
        return jdbcTemplate.query(
                """
                SELECT id, name_ja, name_sanskrit, display_order, is_active, created_at, updated_at
                FROM warming_up_master
                WHERE is_active = TRUE
                ORDER BY display_order ASC, id ASC
                """,
                (rs, rowNum) -> new WarmingUpMaster(
                        rs.getLong("id"),
                        rs.getString("name_ja"),
                        rs.getString("name_sanskrit"),
                        rs.getInt("display_order"),
                        rs.getBoolean("is_active"),
                        rs.getTimestamp("created_at").toLocalDateTime(),
                        rs.getTimestamp("updated_at").toLocalDateTime()));
    }

    public boolean existsActiveById(Long id) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM warming_up_master
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
                FROM warming_up_master
                WHERE name_ja = ?
                """,
                Integer.class,
                nameJa);
        return count != null && count > 0;
    }

    public void save(String nameJa, String nameSanskrit, int displayOrder) {
        jdbcTemplate.update(
                """
                INSERT INTO warming_up_master (name_ja, name_sanskrit, display_order, is_active, created_at, updated_at)
                VALUES (?, ?, ?, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """,
                nameJa,
                nameSanskrit,
                displayOrder);
    }
}
