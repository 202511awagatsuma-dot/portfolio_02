package com.example.demo.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record MoodLog(
        Long id,
        LocalDate logDate,
        String mood,
        String memo,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
