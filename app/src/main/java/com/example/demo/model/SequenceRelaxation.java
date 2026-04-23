package com.example.demo.model;

import java.time.LocalDateTime;

public record SequenceRelaxation(
        Long id,
        Long sequenceId,
        Long relaxationMasterId,
        String customName,
        String displayName,
        int sortOrder,
        String memo,
        boolean custom,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
