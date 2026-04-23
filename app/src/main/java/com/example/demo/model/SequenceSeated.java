package com.example.demo.model;

import java.time.LocalDateTime;

public record SequenceSeated(
        Long id,
        Long sequenceId,
        Long seatedMasterId,
        String customName,
        String displayName,
        int sortOrder,
        String memo,
        boolean custom,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
