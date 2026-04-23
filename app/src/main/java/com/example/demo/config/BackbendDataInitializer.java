package com.example.demo.config;

import java.util.List;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.example.demo.repository.BackbendMasterRepository;

@Configuration
public class BackbendDataInitializer {

    @Bean
    ApplicationRunner initializeBackbendMaster(BackbendMasterRepository backbendMasterRepository) {
        return args -> {
            List<String> defaultNames = List.of(
                    "スフィンクス",
                    "ブジャンガーサナ",
                    "サラバーサナ",
                    "セツ バンダーサナ",
                    "アンジャネーヤーサナ",
                    "ウシュトラーサナ",
                    "ウルドゥヴァ ムカ シュヴァーナーサナ",
                    "ナタラージャーサナ",
                    "ウールドヴァ ダニュラーサナ",
                    "エーカ パーダ ラージャカポターサナ");

            for (int index = 0; index < defaultNames.size(); index += 1) {
                String name = defaultNames.get(index);
                if (!backbendMasterRepository.existsByNameJa(name)) {
                    backbendMasterRepository.save(name, index + 1);
                }
            }
        };
    }
}
