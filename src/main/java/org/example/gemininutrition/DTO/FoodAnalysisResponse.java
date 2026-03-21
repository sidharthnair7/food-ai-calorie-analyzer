package org.example.gemininutrition.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FoodAnalysisResponse {


    private String detectedFood;
    private String calories;
    private String assumptions;
    private String confidence;
    private String confidenceReason;


    private String sugar;               // grams
    private String protein;             // grams
    private String carbs;               // grams
    private String fat;                 // grams


    private String healthScore;         // 1–10
    private String healthSuggestion;    // food-specific tip
    private String cheaperHealthierAlternative;
    private String nextMealSuggestion;


    private String warningFlags;


    private String rawResponse;
}