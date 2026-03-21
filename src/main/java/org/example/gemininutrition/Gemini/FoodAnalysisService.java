package org.example.gemininutrition.Gemini;

import lombok.RequiredArgsConstructor;
import org.example.gemininutrition.DTO.FoodAnalysisResponse;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FoodAnalysisService {

    private final GeminiService geminiService;

    public FoodAnalysisResponse analyzeFoodImage(byte[] imageBytes) throws Exception {
        return geminiService.analyzeFoodImage(imageBytes);
    }
}
