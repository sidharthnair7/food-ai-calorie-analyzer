package org.example.gemininutrition.Capture;

import lombok.RequiredArgsConstructor;
import org.example.gemininutrition.DTO.FoodAnalysisResponse;
import org.example.gemininutrition.Gemini.FoodAnalysisService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Base64;
import java.util.Map;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api")
public class CaptureController {

    private final FoodAnalysisService foodAnalysisService;
    private final CaptureService captureService;

    @GetMapping("/analyze")
    public ResponseEntity<?> analyzeFoodImage() {
        try {
            byte[] img = captureService.capture();

            FoodAnalysisResponse analysis = foodAnalysisService.analyzeFoodImage(img);

            String base64Image = Base64.getEncoder().encodeToString(img);

            return ResponseEntity.ok(Map.of(
                    "analysis", analysis,
                    "image", "data:image/jpeg;base64," + base64Image
            ));

        } catch (org.springframework.web.client.HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .body(Map.of("error", e.getResponseBodyAsString()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}