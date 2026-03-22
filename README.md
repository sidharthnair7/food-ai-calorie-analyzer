# 🍽️ AI Food Calorie Analyzer

An AI-powered web application that analyzes food images and provides calorie estimates and nutritional insights using computer vision and large language models.

---

## 🎥 Demo Video

Watch the full demo here:

👉 [DEMO VIDEO](https://www.youtube.com/watch?v=Us4_M71KpZs)

---

## 📸 Screenshots

### 🖥️ Main Interface

![Main UI](./assets/screenshot-main.png)

> Clean and responsive UI with real-time camera capture and AI-powered nutrition insights.

---

## 🚀 Features

- 📸 Capture food images using webcam
- 🧠 AI-based food recognition using Gemini API
- 🔥 Calorie estimation and nutritional breakdown
- ⚡ Real-time image processing using JavaCV (OpenCV)
- 📊 Health score and nutritional insights
- ⚠️ Warning flags (e.g., high sugar, low protein)
- 💰 Budget-friendly food suggestions
- 📋 Daily nutrition tracking log
- 🧮 BMI Calculator

---

## 🧱 Tech Stack

### Backend
- Java
- Spring Boot
- JavaCV (OpenCV)

### Frontend
- React (Vite)
- JavaScript
- HTML, CSS

### AI Integration
- Google Gemini API

---

## ⚙️ How It Works

1. User captures or uploads a food image  
2. Image is processed using JavaCV  
3. Image is converted into `byte[]` format  
4. Backend sends the image to Gemini API  
5. AI analyzes and returns:
   - Detected food name  
   - Estimated calories  
   - Nutritional breakdown  
   - Health score  
   - Suggestions & warnings  
6. Results are displayed dynamically in the UI  

---

## 🛠️ Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/Sidsid01/food-ai-calorie-analyzer.git
cd food-ai-calorie-analyzer
