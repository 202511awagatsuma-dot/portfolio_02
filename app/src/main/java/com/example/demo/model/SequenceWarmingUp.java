package com.example.demo.model;

import java.time.LocalDateTime;

public record SequenceWarmingUp(
        Long id,
        Long sequenceId,
        Long warmingUpMasterId,
        String customName,
        String displayName,
        String nameSanskrit,
        int sortOrder,
        String memo,
        boolean custom,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
