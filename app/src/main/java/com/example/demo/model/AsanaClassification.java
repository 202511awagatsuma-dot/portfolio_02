package com.example.demo.model;

import java.util.List;
import java.util.Set;

public final class AsanaClassification {

    public static final String CATEGORY_STANDING = "standing";
    public static final String CATEGORY_SEATED = "seated";
    public static final String CATEGORY_BACKBEND = "backbend";
    public static final String CATEGORY_CORE_ARM_BALANCE = "core_arm_balance";
    public static final String CATEGORY_RELAXATION = "relaxation";
    public static final String CATEGORY_FORWARD_FOLD = "forward_fold";

    public static final String STANDING_SUBCATEGORY_SYMMETRIC = "symmetric";
    public static final String STANDING_SUBCATEGORY_ASYMMETRIC_NEUTRAL = "asymmetric_neutral";
    public static final String STANDING_SUBCATEGORY_ASYMMETRIC_EXTERNAL_ROTATION = "asymmetric_external_rotation";

    private static final Set<String> VALID_CATEGORIES = Set.of(
            CATEGORY_STANDING,
            CATEGORY_SEATED,
            CATEGORY_BACKBEND,
            CATEGORY_CORE_ARM_BALANCE,
            CATEGORY_RELAXATION,
            CATEGORY_FORWARD_FOLD);

    private static final Set<String> VALID_STANDING_SUBCATEGORIES = Set.of(
            STANDING_SUBCATEGORY_SYMMETRIC,
            STANDING_SUBCATEGORY_ASYMMETRIC_NEUTRAL,
            STANDING_SUBCATEGORY_ASYMMETRIC_EXTERNAL_ROTATION);

    private static final List<SelectOption> CATEGORY_OPTIONS = List.of(
            new SelectOption(CATEGORY_STANDING, "立位"),
            new SelectOption(CATEGORY_SEATED, "座位"),
            new SelectOption(CATEGORY_BACKBEND, "後屈"),
            new SelectOption(CATEGORY_CORE_ARM_BALANCE, "体幹（アームバランス）"),
            new SelectOption(CATEGORY_RELAXATION, "リラクゼーション"),
            new SelectOption(CATEGORY_FORWARD_FOLD, "前屈"));

    private static final List<SelectOption> STANDING_SUBCATEGORY_OPTIONS = List.of(
            new SelectOption(STANDING_SUBCATEGORY_SYMMETRIC, "左右対称立位"),
            new SelectOption(STANDING_SUBCATEGORY_ASYMMETRIC_NEUTRAL, "左右非対称ニュートラル立位"),
            new SelectOption(STANDING_SUBCATEGORY_ASYMMETRIC_EXTERNAL_ROTATION, "左右非対称外旋立位"));

    private AsanaClassification() {
    }

    public static boolean isValidCategory(String value) {
        return value != null && VALID_CATEGORIES.contains(value);
    }

    public static boolean isValidStandingSubcategory(String value) {
        return value != null && VALID_STANDING_SUBCATEGORIES.contains(value);
    }

    public static boolean requiresStandingSubcategory(String category) {
        return CATEGORY_STANDING.equals(category);
    }

    public static List<SelectOption> categoryOptions() {
        return CATEGORY_OPTIONS;
    }

    public static List<SelectOption> standingSubcategoryOptions() {
        return STANDING_SUBCATEGORY_OPTIONS;
    }

    public static String toCategoryLabel(String value) {
        return switch (value == null ? "" : value) {
            case CATEGORY_STANDING -> "立位";
            case CATEGORY_SEATED -> "座位";
            case CATEGORY_BACKBEND -> "後屈";
            case CATEGORY_CORE_ARM_BALANCE -> "体幹（アームバランス）";
            case CATEGORY_RELAXATION -> "リラクゼーション";
            case CATEGORY_FORWARD_FOLD -> "前屈";
            default -> "";
        };
    }

    public static String toStandingSubcategoryLabel(String value) {
        return switch (value == null ? "" : value) {
            case STANDING_SUBCATEGORY_SYMMETRIC -> "左右対称立位";
            case STANDING_SUBCATEGORY_ASYMMETRIC_NEUTRAL -> "左右非対称ニュートラル立位";
            case STANDING_SUBCATEGORY_ASYMMETRIC_EXTERNAL_ROTATION -> "左右非対称外旋立位";
            default -> "";
        };
    }
}
