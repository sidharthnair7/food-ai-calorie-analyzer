package org.example.gemininutrition.Gemini;

import lombok.RequiredArgsConstructor;
import org.example.gemininutrition.DTO.FoodAnalysisResponse;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FoodAnalysisService {

    private final GeminiService geminiService;

    /** Analyse from raw image bytes (multipart upload) */
    public FoodAnalysisResponse analyzeFoodImage(byte[] imageBytes) throws Exception {
        return geminiService.analyzeFoodImage(imageBytes);
    }

    /** Analyse from base64 string + optional custom prompt (frontend JSON body) */
    public FoodAnalysisResponse analyzeFoodImageBase64(String base64, String prompt) throws Exception {
        return geminiService.analyzeFoodImageBase64(base64, prompt);
    }
}