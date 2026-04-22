package com.example.demo.repository;

import java.util.List;
import java.util.Optional;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
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
                SELECT id, name_ja, name_sanskrit, category, standing_subcategory, display_order, is_active, created_at, updated_at
                FROM warming_up_master
                WHERE is_active = TRUE
                ORDER BY display_order ASC, id ASC
                """,
                (rs, rowNum) -> new WarmingUpMaster(
                        rs.getLong("id"),
                        rs.getString("name_ja"),
                        rs.getString("name_sanskrit"),
                        rs.getString("category"),
                        rs.getString("standing_subcategory"),
                        rs.getInt("display_order"),
                        rs.getBoolean("is_active"),
                        rs.getTimestamp("created_at").toLocalDateTime(),
                        rs.getTimestamp("updated_at").toLocalDateTime()));
    }

    public List<WarmingUpMaster> findActiveByCategory(String category) {
        return jdbcTemplate.query(
                """
                SELECT id, name_ja, name_sanskrit, category, standing_subcategory, display_order, is_active, created_at, updated_at
                FROM warming_up_master
                WHERE is_active = TRUE
                  AND category = ?
                ORDER BY display_order ASC, id ASC
                """,
                (rs, rowNum) -> new WarmingUpMaster(
                        rs.getLong("id"),
                        rs.getString("name_ja"),
                        rs.getString("name_sanskrit"),
                        rs.getString("category"),
                        rs.getString("standing_subcategory"),
                        rs.getInt("display_order"),
                        rs.getBoolean("is_active"),
                        rs.getTimestamp("created_at").toLocalDateTime(),
                        rs.getTimestamp("updated_at").toLocalDateTime()),
                category);
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

    public Optional<Long> findActiveIdByNameJa(String nameJa) {
        return jdbcTemplate.query(
                """
                SELECT id
                FROM warming_up_master
                WHERE name_ja = ? AND is_active = TRUE
                """,
                (rs, rowNum) -> rs.getLong("id"),
                nameJa).stream().findFirst();
    }

    public void save(String nameJa, String nameSanskrit, int displayOrder) {
        save(nameJa, nameSanskrit, null, null, displayOrder);
    }

    public Long save(String nameJa, String nameSanskrit, String category, String standingSubcategory, int displayOrder) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(
                connection -> {
                    java.sql.PreparedStatement statement = connection.prepareStatement(
                            """
                            INSERT INTO warming_up_master
                            (name_ja, name_sanskrit, category, standing_subcategory, display_order, is_active, created_at, updated_at)
                            VALUES (?, ?, ?, ?, ?, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                            """,
                            new String[] { "id" });
                    statement.setString(1, nameJa);
                    statement.setString(2, nameSanskrit);
                    statement.setString(3, category);
                    statement.setString(4, standingSubcategory);
                    statement.setInt(5, displayOrder);
                    return statement;
                },
                keyHolder);
        return extractGeneratedId(keyHolder);
    }

    public int nextDisplayOrder() {
        Integer nextOrder = jdbcTemplate.queryForObject(
                """
                SELECT COALESCE(MAX(display_order), 0) + 1
                FROM warming_up_master
                """,
                Integer.class);
        return nextOrder == null ? 1 : nextOrder;
    }

    public void updateClassificationByNameJa(String nameJa, String category, String standingSubcategory) {
        jdbcTemplate.update(
                """
                UPDATE warming_up_master
                SET category = ?,
                    standing_subcategory = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE name_ja = ?
                """,
                category,
                standingSubcategory,
                nameJa);
    }

    private Long extractGeneratedId(KeyHolder keyHolder) {
        Map<String, Object> keys = keyHolder.getKeys();
        if (keys != null) {
            for (String key : new String[] { "id", "ID" }) {
                Object value = keys.get(key);
                if (value instanceof Number number) {
                    return number.longValue();
                }
            }
            if (keys.size() == 1) {
                Object value = keys.values().iterator().next();
                if (value instanceof Number number) {
                    return number.longValue();
                }
            }
        }
        throw new IllegalStateException("Failed to extract generated warming_up_master id.");
    }
}
