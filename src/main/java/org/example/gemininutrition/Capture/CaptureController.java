package org.example.gemininutrition.Capture;

import lombok.RequiredArgsConstructor;
import org.example.gemininutrition.DTO.FoodAnalysisResponse;
import org.example.gemininutrition.Gemini.FoodAnalysisService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;
import java.util.Map;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api")
public class CaptureController {

    private final FoodAnalysisService foodAnalysisService;
    private final CaptureService captureService;

    /**
     * POST /api/analyze
     * Body: { "imageBase64": "..." }
     * Called by the React frontend (camera capture or file upload).
     * Returns a FLAT FoodAnalysisResponse JSON directly.
     */
    @PostMapping("/analyze")
    public ResponseEntity<?> analyzeBase64(@RequestBody Map<String, String> body) {
        String imageBase64 = body.get("imageBase64");

        if (imageBase64 == null || imageBase64.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "imageBase64 field is required"));
        }

        try {
            // Strip data URI prefix if present (e.g. "data:image/jpeg;base64,...")
            if (imageBase64.contains(",")) {
                imageBase64 = imageBase64.split(",")[1];
            }

            byte[] imageBytes = Base64.getDecoder().decode(imageBase64);
            FoodAnalysisResponse analysis = foodAnalysisService.analyzeFoodImage(imageBytes);

            // Return the flat response directly — no nesting
            return ResponseEntity.ok(analysis);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Analysis failed: " + e.getMessage()));
        }
    }

    /**
     * GET /api/analyze
     * Uses the physical webcam via CaptureService.
     * Kept for backwards compatibility / direct webcam testing.
     * Also returns flat FoodAnalysisResponse (not nested).
     */
    @GetMapping("/analyze")
    public ResponseEntity<?> analyzeWebcam() {
        try {
            byte[] img = captureService.capture();
            FoodAnalysisResponse analysis = foodAnalysisService.analyzeFoodImage(img);

            // Return flat — same shape as POST so frontend works with both
            return ResponseEntity.ok(analysis);

        } catch (org.springframework.web.client.HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .body(Map.of("error", e.getResponseBodyAsString()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/health
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "ok", "service", "Nutrico Gemini API"));
    }
}