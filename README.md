# VisionTranslate2.0
### AI-Powered Visual Translation Web Application

VisionTranslate2.0 is a browser-based application that combines multilingual translation, Optical Character Recognition (OCR), and real-time object recognition to make visual and multilingual information more accessible.

🌐 **Live Demo:** https://judedontoh.github.io/VisionTranslate2.0/

💻 **GitHub Repository:** https://github.com/judedontoh/VisionTranslate2.0

---

## 🚀 Features

- **Multilingual Text Translation** – Translate text between supported languages.
- **Real-Time Object Recognition** – Identify objects using your device's camera.
- **Optical Character Recognition (OCR)** – Extract text from uploaded images using Tesseract.js.
- **Image Text Translation** – Recognise text in images and translate the extracted content.
- **Live Camera Integration** – Access your camera for visual recognition.
- **Text-to-Speech** – Listen to translated text using browser speech synthesis.
- **Translation History** – Keep track of recent translations.
- **Translation Memory** – Store and reuse previous translations.
- **Image Upload and Capture** – Process uploaded images and captured image content.
- **Download Functionality** – Save supported image and text outputs.

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | Application structure |
| CSS3 | Styling and responsive design |
| JavaScript | Application functionality |
| Vite | Development and production builds |
| TensorFlow.js | Browser-based machine learning |
| COCO-SSD | Real-time object detection |
| Tesseract.js | Optical character recognition |
| Google Translate unofficial endpoint | Text translation |
| Web Speech API | Text-to-speech |
| Local Storage | Translation history and memory |
| Git & GitHub | Version control |
| GitHub Actions | Automated deployment |
| GitHub Pages | Application hosting |

## 📸 How It Works

1. Enter text, upload an image, or activate the camera.
2. Use OCR to extract text from images or object recognition to identify visual content.
3. Translate recognised or manually entered text.
4. Listen to translated content using text-to-speech.
5. Review previous translations through translation history and memory.

## 💻 Getting Started

### Prerequisites

- Node.js
- npm
- Git

### Installation

Clone the repository:

```bash
git clone https://github.com/judedontoh/VisionTranslate2.0.git
```

Navigate to the project directory:

```bash
cd VisionTranslate2.0
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local development URL displayed in your terminal.

### Production Build

To create a production build:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## 🌍 Deployment

VisionTranslate2.0 is deployed through GitHub Pages using GitHub Actions.

The deployment workflow automatically:

1. Checks out the repository.
2. Installs project dependencies.
3. Builds the application using Vite.
4. Uploads the production build.
5. Publishes the application to GitHub Pages.

Every push to the `main` branch triggers the deployment workflow.

## 🔒 Browser Permissions and Compatibility

- Camera access requires user permission.
- Camera access requires HTTPS or localhost.
- OCR and object recognition run in the browser.
- Speech synthesis depends on browser and operating-system support.
- Translation requires an active internet connection.

## ⚠️ Known Limitations

- Translation currently uses an unofficial Google Translate endpoint, which has no guaranteed availability or service-level support.
- Translation quality may vary depending on language and text complexity.
- Camera and speech features depend on browser compatibility and permissions.
- Object recognition is limited by the categories supported by the COCO-SSD model.

## 🔮 Future Improvements

- Integrate an officially supported translation API.
- Expand automated testing and error handling.
- Improve OCR accuracy and image preprocessing.
- Enhance accessibility and multilingual interface support.
- Introduce additional translation management features.

## 🎯 Project Objective

VisionTranslate2.0 demonstrates the practical integration of modern web technologies and browser-based AI capabilities.

The project brings together computer vision, OCR, multilingual translation, speech synthesis, local data persistence, and automated deployment in one accessible web application.

It was developed as a practical exploration of how JavaScript and machine learning technologies can help people understand visual and multilingual information.

---

## 👨‍💻 Developer

**Developed by:** [judedontoh](https://github.com/judedontoh)

**Live Application:** [VisionTranslate2.0](https://judedontoh.github.io/VisionTranslate2.0/)

**Source Code:** [View on GitHub](https://github.com/judedontoh/VisionTranslate2.0)

⭐ If you find this project interesting, feel free to explore the source code!
