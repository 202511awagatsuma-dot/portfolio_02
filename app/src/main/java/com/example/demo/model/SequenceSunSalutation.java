package com.example.demo.model;

import java.time.LocalDateTime;

public record SequenceSunSalutation(
        Long id,
        Long sequenceId,
        Long sunSalutationMasterId,
        String customName,
        String displayName,
        int sortOrder,
        String memo,
        boolean custom,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
