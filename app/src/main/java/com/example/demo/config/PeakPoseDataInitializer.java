package com.example.demo.config;

import java.util.List;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.example.demo.repository.PeakPoseMasterRepository;

@Configuration
public class PeakPoseDataInitializer {

    @Bean
    ApplicationRunner initializePeakPoseMaster(PeakPoseMasterRepository peakPoseMasterRepository) {
        return args -> {
            List<String> defaultNames = List.of(
                    "アルダ チャンドラーサナ",
                    "ヴィーラバドラーサナ III",
                    "ウッティタ ハスタ パーダングシュターサナ",
                    "ハヌマーンアーサナ",
                    "エーカ パーダ ラージャカポターサナ",
                    "アルダ マツェーンドラーサナ",
                    "パリヴリッタ トリコーナーサナ",
                    "ウシュトラーサナ",
                    "ウールドヴァ ダニュラーサナ",
                    "ナタラージャーサナ",
                    "ピンチャ マユーラーサナ",
                    "パドマーサナ");

            for (int index = 0; index < defaultNames.size(); index += 1) {
                String name = defaultNames.get(index);
                if (!peakPoseMasterRepository.existsByNameJa(name)) {
                    peakPoseMasterRepository.save(name, index + 1);
                }
            }
        };
    }
}
