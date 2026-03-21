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
    private String rawResponse;
}
