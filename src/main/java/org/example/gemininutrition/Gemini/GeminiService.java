package org.example.gemininutrition.Gemini;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.gemininutrition.DTO.FoodAnalysisResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${GEMINI_API_KEY}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    public FoodAnalysisResponse analyzeFoodImage(byte[] imageBytes) throws Exception {
        String base64Image = Base64.getEncoder().encodeToString(imageBytes);

        String prompt = """
                Identify the food and reply in this exact format only:
                Food: [name]
                Calories: [range]
                Assumptions: [brief]
                Confidence: [Low/Medium/High]
                Suggestions: [one tip]
                """;

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of(
                                "parts", List.of(
                                        Map.of("text", prompt),
                                        Map.of("inline_data", Map.of(
                                                "mime_type", "image/jpeg",
                                                "data", base64Image
                                        ))
                                )
                        )
                ),

                "generationConfig", Map.of(
                        "maxOutputTokens", 200,
                        "temperature", 0.3
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        String finalUrl = apiUrl + "?key=" + apiKey;

        ResponseEntity<String> response = restTemplate.exchange(
                finalUrl,
                HttpMethod.POST,
                entity,
                String.class
        );

        String rawText = extractGeminiText(response.getBody());
        return parseResponse(rawText);
    }

    private String extractGeminiText(String geminiResponse) throws JsonProcessingException {
        JsonNode root = objectMapper.readTree(geminiResponse);
        JsonNode textNode = root
                .path("candidates")
                .path(0)
                .path("content")
                .path("parts")
                .path(0)
                .path("text");
        return textNode.asText();
    }

    private FoodAnalysisResponse parseResponse(String rawText) {
        return new FoodAnalysisResponse(
                extractField(rawText, "Food:"),
                extractField(rawText, "Calories:"),
                extractField(rawText, "Assumptions:"),
                extractField(rawText, "Confidence:"),
                rawText
        );
    }

    private String extractField(String rawText, String label) {
        for (String line : rawText.split("\\R")) {
            if (line.trim().startsWith(label)) {
                return line.replace(label, "").trim();
            }
        }
        return "Not provided";
    }
}