package com.example.demo.model;

import java.time.LocalDateTime;

public record Sequence(
        Long id,
        int durationMinutes,
        int level,
        boolean peakPoseEnabled,
        String peakPoseName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
