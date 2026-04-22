package com.example.demo.config;

import java.util.List;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.example.demo.model.AsanaClassification;
import com.example.demo.repository.WarmingUpMasterRepository;

@Configuration
public class WarmingUpDataInitializer {

    @Bean
    ApplicationRunner initializeWarmingUpMaster(WarmingUpMasterRepository warmingUpMasterRepository) {
        return args -> {
            List<String> defaultNames = List.of(
                    "キャット＆カウ",
                    "猫の背伸びのポーズ",
                    "トラのポーズ",
                    "ダウンドッグ",
                    "閂のポーズ",
                    "ランジ",
                    "ランジツイスト（オープン）",
                    "ランジツイスト（クローズ）",
                    "ハイランジ",
                    "ローランジ",
                    "エクステンド チャイルドポーズ",
                    "チャイルドポーズ",
                    "タダーサナ",
                    "側屈（座り姿勢）",
                    "回旋（座り姿勢）",
                    "首回し",
                    "手首ほぐし");

            for (int index = 0; index < defaultNames.size(); index += 1) {
                String name = defaultNames.get(index);
                if (!warmingUpMasterRepository.existsByNameJa(name)) {
                    warmingUpMasterRepository.save(name, null, index + 1);
                }
                // Legacy data may have been temporarily classified as standing.
                // Keep default warm-up seeds unclassified so they do not leak into standing candidates.
                warmingUpMasterRepository.updateClassificationByNameJa(name, null, null);
            }

            List<StandingAsanaSeed> standingAsanaSeeds = List.of(
                    new StandingAsanaSeed("タダーサナ", "Tadasana", AsanaClassification.STANDING_SUBCATEGORY_SYMMETRIC),
                    new StandingAsanaSeed("ウッターナーサナ", "Uttanasana", AsanaClassification.STANDING_SUBCATEGORY_SYMMETRIC),
                    new StandingAsanaSeed("プラサーリタパードッターナーサナ", "Prasarita Padottanasana",
                            AsanaClassification.STANDING_SUBCATEGORY_SYMMETRIC),
                    new StandingAsanaSeed("アルダプラサーリタパードッターナーサナ", "Ardha Prasarita Padottanasana",
                            AsanaClassification.STANDING_SUBCATEGORY_SYMMETRIC),
                    new StandingAsanaSeed("ウトゥカターサナ", "Utkatasana", AsanaClassification.STANDING_SUBCATEGORY_SYMMETRIC),
                    new StandingAsanaSeed("ハイランジ", "High Lunge",
                            AsanaClassification.STANDING_SUBCATEGORY_ASYMMETRIC_NEUTRAL),
                    new StandingAsanaSeed("パールシュヴォッターナーサナ", "Parsvottanasana",
                            AsanaClassification.STANDING_SUBCATEGORY_ASYMMETRIC_NEUTRAL),
                    new StandingAsanaSeed("ヴィーラバドラアーサナI", "Virabhadrasana I",
                            AsanaClassification.STANDING_SUBCATEGORY_ASYMMETRIC_NEUTRAL),
                    new StandingAsanaSeed("ヴィーラバドラアーサナII", "Virabhadrasana II",
                            AsanaClassification.STANDING_SUBCATEGORY_ASYMMETRIC_EXTERNAL_ROTATION),
                    new StandingAsanaSeed("トリコナーサナ", "Trikonasana",
                            AsanaClassification.STANDING_SUBCATEGORY_ASYMMETRIC_EXTERNAL_ROTATION),
                    new StandingAsanaSeed("パールシュヴァコナーサナ", "Parsvakonasana",
                            AsanaClassification.STANDING_SUBCATEGORY_ASYMMETRIC_EXTERNAL_ROTATION),
                    new StandingAsanaSeed("アルダチャンドラーサナ", "Ardha Chandrasana",
                            AsanaClassification.STANDING_SUBCATEGORY_ASYMMETRIC_EXTERNAL_ROTATION),
                    new StandingAsanaSeed("ヴリクシャーサナ", "Vrksasana",
                            AsanaClassification.STANDING_SUBCATEGORY_ASYMMETRIC_EXTERNAL_ROTATION));

            for (StandingAsanaSeed seed : standingAsanaSeeds) {
                if (!warmingUpMasterRepository.existsByNameJa(seed.nameJa())) {
                    warmingUpMasterRepository.save(
                            seed.nameJa(),
                            seed.nameSanskrit(),
                            AsanaClassification.CATEGORY_STANDING,
                            seed.standingSubcategory(),
                            warmingUpMasterRepository.nextDisplayOrder());
                } else {
                    warmingUpMasterRepository.updateClassificationByNameJa(
                            seed.nameJa(),
                            AsanaClassification.CATEGORY_STANDING,
                            seed.standingSubcategory());
                }
            }
        };
    }

    private record StandingAsanaSeed(
            String nameJa,
            String nameSanskrit,
            String standingSubcategory) {
    }
}
