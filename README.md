# 🍽️ AI Food Calorie Analyzer

> Built at a hackathon in under 24 hours — helping users make informed nutritional choices using AI-powered food recognition.


![Java](https://img.shields.io/badge/Java-17-orange?style=flat-square)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0-brightgreen?style=flat-square)
![React](https://img.shields.io/badge/React-Vite-61DAFB?style=flat-square)
![Gemini AI](https://img.shields.io/badge/Gemini-AI-purple?style=flat-square)

An AI-powered web application that captures food images via webcam and provides instant calorie estimates and nutritional insights using computer vision and large language models.

---

## 🎥 Demo Video

[![Demo Video](https://img.youtube.com/vi/Us4_M71KpZs/maxresdefault.jpg)](https://www.youtube.com/watch?v=Us4_M71KpZs)
> 👆 Click the image above to watch the full demo video

---

## 🚀 Features

- 📸 Capture food images using webcam
- 🧠 AI-based food recognition using Gemini API
- 🔥 Calorie estimation with range
- ⚡ Real-time image processing using JavaCV (OpenCV)
- 📊 Confidence scoring and dietary assumptions
- 💡 Personalized health suggestions
- 🧮 BMI Calculator

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 17, Spring Boot 4 |
| Frontend | React (Vite), JavaScript |
| Computer Vision | JavaCV (OpenCV) |
| AI | Google Gemini API |

---

## ⚙️ How It Works

1. User clicks **Capture & Analyze** in the browser
2. Spring Boot triggers the webcam via JavaCV (OpenCV)
3. Frame is captured, resized, and compressed to JPEG `byte[]`
4. Image is base64-encoded and sent to the Gemini API
5. Gemini returns food name, calorie range, confidence, and suggestions
6. Results and the captured image are displayed dynamically in the React UI

---

## 🛠️ Setup Instructions

### Prerequisites
- Java 17+
- Node.js 18+
- Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Backend
```bash
git clone https://github.com/sidharthnair7/food-ai-calorie-analyzer.git
cd food-ai-calorie-analyzer
```

Create `src/main/resources/application.properties`:
```properties
spring.application.name=GeminiNutrition
GEMINI_API_KEY=your_key_here
frontend.url=http://localhost:5173
gemini.api.url=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
```
```bash
./mvnw spring-boot:run
```

### Frontend
```bash
cd Frontend
npm install
npm run dev
```

Open **http://localhost:5173**

---

## 🏆 Hackathon Project

Built during a hackathon in a team of 3 developers.

**My contributions:**
- Backend architecture with Spring Boot
- JavaCV integration for real-time webcam capture
- Image pipeline: capture → resize → compress → base64 encode
- Gemini API integration and prompt engineering
- REST API design connecting frontend and backend

---

## 💡 What I Learned

- Integrating multimodal AI APIs with image data
- Handling native image processing in Java with JavaCV/OpenCV
- Building and debugging a full-stack app under time pressure
- Efficient base64 image encoding to minimize API token usage
- Git collaboration workflows in a fast-paced team environment
