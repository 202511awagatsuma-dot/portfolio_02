package com.example.demo.model;

import java.util.List;

public record SequenceConfirmationSection(
        String category,
        String title,
        String durationLabel,
        List<String> asanaNames) {
}
