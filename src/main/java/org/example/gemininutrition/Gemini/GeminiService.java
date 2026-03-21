package org.example.gemininutrition.Gemini;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.gemininutrition.DTO.FoodAnalysisResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${GEMINI_API_KEY}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    // ── Prompt: concrete example with no special chars that confuse Gemini ──
    private static final String PROMPT =
            "Analyze the food or drink in this image. " +
                    "Respond with ONLY a JSON object, nothing else. No markdown. No explanation. Start your response with { and end with }.\n\n" +
                    "Example response format:\n" +
                    "{\"foodName\":\"Coca-Cola Original 355mL can\"," +
                    "\"confidence\":92," +
                    "\"confidenceReason\":\"Red can with Coca-Cola logo clearly visible\"," +
                    "\"calories\":140," +
                    "\"calorieAssumption\":\"Standard 355mL can\"," +
                    "\"sugar\":39," +
                    "\"protein\":0," +
                    "\"carbs\":45," +
                    "\"fat\":0," +
                    "\"healthScore\":2," +
                    "\"healthSuggestion\":\"This Coca-Cola has 39g of sugar per can which exceeds recommended daily sugar in one serving. Try sparkling water instead.\"," +
                    "\"cheaperHealthierAlternative\":\"Tap water costs nothing and has zero sugar or calories\"," +
                    "\"warningFlags\":[\"High Sugar\",\"High Calories\"]," +
                    "\"nextMealSuggestion\":\"Eat a protein-rich meal next such as grilled chicken with vegetables to balance the sugar spike.\"}\n\n" +
                    "Now analyze the actual food in the image and return a JSON object in exactly that format. " +
                    "Use real numbers for all numeric fields. Never use null. Never leave a field empty.";

    // ── public entry points ──────────────────────────────────────────
    public FoodAnalysisResponse analyzeFoodImage(byte[] imageBytes) throws Exception {
        return callGemini(Base64.getEncoder().encodeToString(imageBytes));
    }

    public FoodAnalysisResponse analyzeFoodImageBase64(String base64Image, String ignored) throws Exception {
        return callGemini(base64Image);
    }

    // ── core call ────────────────────────────────────────────────────
    private FoodAnalysisResponse callGemini(String base64Image) throws Exception {

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(
                                Map.of("text", PROMPT),
                                Map.of("inline_data", Map.of(
                                        "mime_type", "image/jpeg",
                                        "data", base64Image
                                ))
                        )
                )),
                "generationConfig", Map.of(
                        "maxOutputTokens", 2048,
                        "temperature", 0.1,
                        "responseMimeType", "application/json"   // tell Gemini to return JSON
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String finalUrl = apiUrl + "?key=" + apiKey;

        ResponseEntity<String> response = restTemplate.exchange(
                finalUrl, HttpMethod.POST,
                new HttpEntity<>(requestBody, headers),
                String.class
        );

        String httpBody = response.getBody();
        log.info("=== GEMINI FULL HTTP RESPONSE ===\n{}", httpBody);

        String geminiText = extractText(httpBody);
        log.info("=== GEMINI TEXT CONTENT ===\n{}", geminiText);

        return parse(geminiText);
    }

    // ── extract text from Gemini envelope ───────────────────────────
    private String extractText(String body) {
        try {
            JsonNode root = objectMapper.readTree(body);

            // Check for API-level error first
            if (root.has("error")) {
                String msg = root.path("error").path("message").asText("Unknown API error");
                log.error("Gemini API error: {}", msg);
                return "";
            }

            // Check for content filter / safety block
            JsonNode candidate = root.path("candidates").path(0);
            String finishReason = candidate.path("finishReason").asText("");
            if ("SAFETY".equals(finishReason) || "RECITATION".equals(finishReason)) {
                log.warn("Gemini blocked response. Reason: {}", finishReason);
                return "";
            }

            String text = candidate.path("content").path("parts").path(0).path("text").asText("");
            if (text.isEmpty()) {
                log.warn("Empty text from Gemini. Full body: {}", body);
            }
            return text;
        } catch (Exception e) {
            log.error("Failed to parse Gemini envelope: {}", e.getMessage());
            return "";
        }
    }

    // ── parse the JSON text Gemini returns ──────────────────────────
    private FoodAnalysisResponse parse(String raw) {
        // Always log the raw text so you can see it in IntelliJ console
        log.info("=== PARSING TEXT ===\n[{}]", raw);

        if (raw == null || raw.isBlank()) {
            return err("Gemini returned empty response - check API key and server logs", raw);
        }

        try {
            // 1. strip markdown fences
            String s = raw.replaceAll("(?s)```json\\s*", "").replaceAll("(?s)```\\s*", "").trim();

            // 2. extract first { ... } block
            int open = s.indexOf('{');
            int close = findMatchingClose(s, open);

            if (open == -1 || close == -1) {
                log.error("No JSON braces found. Text was: [{}]", raw);
                return err("AI did not return JSON. Raw: " + raw.substring(0, Math.min(200, raw.length())), raw);
            }

            String json = s.substring(open, close + 1);
            log.info("=== EXTRACTED JSON ===\n{}", json);

            JsonNode n = objectMapper.readTree(json);

            FoodAnalysisResponse r = new FoodAnalysisResponse();
            r.setDetectedFood(               str(n, "foodName",                   "Unknown food"));
            r.setCalories(                   str(n, "calories",                   "0"));
            r.setAssumptions(                str(n, "calorieAssumption",          "Estimated portion"));
            r.setConfidence(                 str(n, "confidence",                 "50"));
            r.setConfidenceReason(           str(n, "confidenceReason",           ""));
            r.setSugar(                      str(n, "sugar",                      "0"));
            r.setProtein(                    str(n, "protein",                    "0"));
            r.setCarbs(                      str(n, "carbs",                      "0"));
            r.setFat(                        str(n, "fat",                        "0"));
            r.setHealthScore(                str(n, "healthScore",                "5"));
            r.setHealthSuggestion(           str(n, "healthSuggestion",           ""));
            r.setCheaperHealthierAlternative(str(n, "cheaperHealthierAlternative",""));
            r.setNextMealSuggestion(         str(n, "nextMealSuggestion",         ""));
            r.setWarningFlags(               warnings(n));
            r.setRawResponse(raw);

            log.info("=== PARSED OK: {} ===", r.getDetectedFood());
            return r;

        } catch (Exception e) {
            log.error("JSON parse exception on text: [{}]", raw, e);
            return err("Parse failed: " + e.getMessage(), raw);
        }
    }

    // ── find matching closing brace (handles nested objects) ────────
    private int findMatchingClose(String s, int openIdx) {
        if (openIdx == -1) return -1;
        int depth = 0;
        for (int i = openIdx; i < s.length(); i++) {
            if (s.charAt(i) == '{') depth++;
            else if (s.charAt(i) == '}') {
                depth--;
                if (depth == 0) return i;
            }
        }
        return -1;
    }

    // ── helpers ──────────────────────────────────────────────────────
    private String str(JsonNode n, String field, String fallback) {
        JsonNode f = n.get(field);
        if (f == null || f.isNull() || f.isMissingNode()) return fallback;
        if (f.isNumber()) return String.valueOf(f.numberValue().intValue());
        return f.asText(fallback);
    }

    private String warnings(JsonNode n) {
        try {
            JsonNode a = n.get("warningFlags");
            if (a == null || a.isNull()) return "[]";
            if (a.isArray()) return a.toString();
            String s = a.asText("").trim();
            return s.startsWith("[") ? s : "[]";
        } catch (Exception e) { return "[]"; }
    }

    private FoodAnalysisResponse err(String msg, String raw) {
        FoodAnalysisResponse r = new FoodAnalysisResponse();
        r.setDetectedFood(msg);
        r.setCalories("0"); r.setConfidence("0"); r.setHealthScore("0");
        r.setSugar("0"); r.setProtein("0"); r.setCarbs("0"); r.setFat("0");
        r.setWarningFlags("[]");
        r.setRawResponse(raw == null ? "" : raw);
        return r;
    }
}