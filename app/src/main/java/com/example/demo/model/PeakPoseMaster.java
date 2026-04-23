package com.example.demo.model;

import java.time.LocalDateTime;

public record PeakPoseMaster(
        Long id,
        String nameJa,
        int displayOrder,
        boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
