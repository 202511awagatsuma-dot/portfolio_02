package com.example.demo.config;

import java.util.List;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

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
            }
        };
    }
}
