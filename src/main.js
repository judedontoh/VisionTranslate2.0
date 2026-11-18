
import './styles/main.css';

// ==========================================
// VISIONTRANSLATE — APPLICATION INITIALISATION
// ==========================================

const video = document.getElementById('video');
const capturedImage = document.getElementById('capturedImage');
const canvas = document.getElementById('overlay');
const ctx = canvas.getContext('2d');

const sourceLanguage = document.getElementById('sourceLanguage');
const targetLanguage = document.getElementById('targetLanguage');

const statusBox = document.getElementById('status');
const cameraStatus = document.getElementById('cameraStatus');
const objectResults = document.getElementById('objectResults');
const ocrResult = document.getElementById('ocrResult');
const recognizedText = document.getElementById('recognizedText');
const translationHistory = document.getElementById('translationHistory');
const clearHistoryButton = document.getElementById('clearHistory');

const imageUpload = document.getElementById('imageUpload');
const uploadedImage = document.getElementById('uploadedImage');
const scanUploadedImageButton = document.getElementById('scanUploadedImage');
const clearUploadedImageButton = document.getElementById('clearUploadedImage');

const startButton = document.getElementById('startCamera');
const stopButton = document.getElementById('stopCamera');
const captureButton = document.getElementById('captureImage');
const retakeButton = document.getElementById('retakeImage');
const downloadButton = document.getElementById('downloadImage');
const scanButton = document.getElementById('scanText');
const speakOCRButton = document.getElementById('speakOCR');
const readAllButton = document.getElementById('readAll');

const cameraPlaceholder = document.querySelector('.camera-placeholder');

// ==========================================
// APPLICATION STATE
// ==========================================

let stream = null;
let capturedImageData = null;
let uploadedImageData = null;
let model = null;
let scanTimer = null;
let scanning = false;
let detecting = false;
let predictions = [];
let ocrTranslation = '';

const objectTranslationCache = new Map();

// ==========================================
// CONFIGURATION
// ==========================================

const CONFIG = {
  confidenceThreshold: 0.5,
  maxObjects: 8,
  detectionInterval: 1500,
  translationEndpoint: 'https://api.mymemory.translated.net/get'
};

const SPEECH_LANGUAGES = {
  es: 'es-ES',
  en: 'en-US',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  pt: 'pt-PT',
  eu: 'eu-ES',
  ja: 'ja-JP'
};

const OCR_LANGUAGES = {
  eng: 'eng',
  spa: 'spa',
  fra: 'fra',
  deu: 'deu',
  ita: 'ita',
  por: 'por'
};

const TRANSLATION_LANGUAGES = {
  eng: 'en',
  spa: 'es',
  fra: 'fr',
  deu: 'de',
  ita: 'it',
  por: 'pt'
};

// ==========================================
// STATUS MANAGEMENT
// ==========================================

function setStatus(message) {
  statusBox.textContent = message;
}

function setCameraStatus(message) {
  cameraStatus.textContent = message;
}

function setCameraPlaceholder(visible) {
  cameraPlaceholder.hidden = !visible;
}

// ==========================================
// CAMERA MANAGEMENT
// ==========================================

function resizeCanvas() {
  if (!video.videoWidth || !video.videoHeight) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
}

async function requestCameraAccess() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera access is not supported by this browser.');
  }

  return navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: { ideal: 'environment' }
    },
    audio: false
  });
}

function stopCamera() {
  scanning = false;
  detecting = false;

  if (scanTimer) {
    clearInterval(scanTimer);
    scanTimer = null;
  }

  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }

  video.srcObject = null;

  capturedImageData = null;
  capturedImage.src = '';

  capturedImage.style.display = 'none';
  video.style.display = '';
  canvas.style.display = '';

  captureButton.disabled = true;
  retakeButton.hidden = true;
  downloadButton.hidden = true;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  predictions = [];

  setCameraPlaceholder(true);
  renderObjects([]);

  setCameraStatus('STANDBY');
  setStatus('Camera stopped.');

  startButton.disabled = false;
}


function captureCameraImage() {
  if (!stream || video.readyState < 2) {
    setStatus('Start the camera before capturing an image.');
    return;
  }

  const snapshot = document.createElement('canvas');

  snapshot.width = video.videoWidth;
  snapshot.height = video.videoHeight;

  const snapshotContext = snapshot.getContext('2d');

  snapshotContext.drawImage(
    video,
    0,
    0,
    snapshot.width,
    snapshot.height
  );

  capturedImageData = snapshot.toDataURL('image/png');
  capturedImage.src = capturedImageData;
  capturedImage.hidden = false;

  video.style.display = 'none';
  canvas.style.display = 'none';
  capturedImage.style.display = 'block';

  if (scanTimer) {
    clearInterval(scanTimer);
    scanTimer = null;
  }

  captureButton.disabled = true;
  retakeButton.hidden = false;
  downloadButton.hidden = false;

  setStatus('Image captured. You can now scan the text or retake the image.');
}

function retakeCameraImage() {
  capturedImageData = null;
  capturedImage.src = '';
  capturedImage.hidden = true;

  capturedImage.style.display = 'none';
  video.style.display = '';
  canvas.style.display = '';

  captureButton.disabled = false;
  retakeButton.hidden = true;
  downloadButton.hidden = true;

  if (scanning && !scanTimer) {
    scanTimer = setInterval(
      detectObjects,
      CONFIG.detectionInterval
    );

    detectObjects();
  }

  setStatus('Live camera resumed.');
}


function downloadCapturedImage() {
  if (!capturedImageData) {
    setStatus('Capture an image before downloading.');
    return;
  }

  const link = document.createElement('a');

  link.href = capturedImageData;
  link.download = `visiontranslate-capture-${Date.now()}.png`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setStatus('Captured image downloaded successfully.');
}

function handleImageUpload(event) {
  const file = event.target.files[0];

  if (!file) return;

  if (!file.type.startsWith('image/')) {
    setStatus('Please select a valid image file.');
    imageUpload.value = '';
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    uploadedImageData = reader.result;
    uploadedImage.src = uploadedImageData;

    uploadedImage.onload = () => {
      uploadedImage.hidden = false;
      scanUploadedImageButton.disabled = false;
      clearUploadedImageButton.hidden = false;

      setStatus('Image uploaded successfully. Ready to scan.');
    };

    uploadedImage.onerror = () => {
      setStatus('Unable to display this image. Try another file.');
      uploadedImageData = null;
      scanUploadedImageButton.disabled = true;
    };
  };

  reader.onerror = () => {
    setStatus('Unable to read the selected image.');
  };

  reader.readAsDataURL(file);
}

async function scanUploadedImageText() {
  if (!uploadedImageData) {
    setStatus('Please upload an image first.');
    return;
  }

  if (typeof window.Tesseract === 'undefined') {
    setStatus('OCR library could not be loaded. Check your internet connection.');
    return;
  }

  try {
    scanUploadedImageButton.disabled = true;

    setStatus('Reading text from uploaded image...');

    const result = await window.Tesseract.recognize(
      uploadedImage,
      OCR_LANGUAGES[sourceLanguage.value]
    );

    const text = result.data.text.trim();

    recognizedText.textContent = text;

    if (!text) {
      recognizedText.textContent = 'No text recognized.';
      ocrResult.textContent = 'No readable text found. Try another image.';
      setStatus('No text detected in the uploaded image.');
      return;
    }

    const sourceCode = TRANSLATION_LANGUAGES[sourceLanguage.value];

    setStatus('Translating recognized text...');

    ocrTranslation = await translateText(
      text,
      sourceCode,
      targetLanguage.value
    );

    ocrResult.textContent = ocrTranslation;

    saveTranslationToHistory(text, ocrTranslation);

    setStatus('Image text translated successfully.');

  } catch (error) {
    console.error('Uploaded image scanning error:', error);

    setStatus(`Image scan error: ${error.message}`);

    ocrResult.textContent = 'Unable to scan or translate this image.';

  } finally {
    scanUploadedImageButton.disabled = false;
  }
}

function clearUploadedImage() {
  uploadedImageData = null;

  uploadedImage.src = '';
  uploadedImage.hidden = true;

  imageUpload.value = '';

  scanUploadedImageButton.disabled = true;
  clearUploadedImageButton.hidden = true;

  setStatus('Uploaded image removed.');
}

// ==========================================
// AI MODEL INITIALISATION
// ==========================================

async function loadDetectionModel() {
  if (model) return model;

  if (typeof window.cocoSsd === 'undefined') {
    throw new Error('Object detection library could not be loaded. Check your internet connection.');
  }

  setStatus('Loading AI vision model...');

  model = await window.cocoSsd.load();

  return model;
}

// ==========================================
// TRANSLATION SERVICE
// ==========================================

async function translateText(text, from, to) {
  const cleanText = text.trim();

  if (!cleanText) return '';

  if (!from || !to) {
    throw new Error('Please select valid languages.');
  }

  if (from === to) return cleanText;

  const maxLength = 450;
  const chunks = [];

  // Split long text into smaller pieces.
  for (let i = 0; i < cleanText.length; i += maxLength) {
    chunks.push(cleanText.slice(i, i + maxLength));
  }

  const translations = [];

  for (const chunk of chunks) {
    const params = new URLSearchParams({
      q: chunk,
      langpair: `${from}|${to}`
    });

    const response = await fetch(
      `${CONFIG.translationEndpoint}?${params}`
    );

    if (!response.ok) {
      throw new Error('Translation service unavailable.');
    }

    const data = await response.json();

    if (data.responseStatus !== 200) {
      throw new Error(
        data.responseDetails || 'Translation request failed.'
      );
    }

    const translated = data.responseData?.translatedText;

    if (!translated) {
      throw new Error('No translation was returned.');
    }

    translations.push(translated);
  }

  return translations.join(' ');
}

// ==========================================
// OBJECT TRANSLATION
// ==========================================

async function translateObject(item) {
  const target = targetLanguage.value;
  const key = `${item.class}|${target}`;

  if (objectTranslationCache.has(key)) {
    item.translated = objectTranslationCache.get(key);
    return;
  }

  try {
    const translated = await translateText(
      item.class,
      'en',
      target
    );

    item.translated = translated;

    objectTranslationCache.set(key, translated);

  } catch (error) {
    console.error('Object translation error:', error);

    item.translated = item.class;
  }
}

// ==========================================
// OBJECT DETECTION
// ==========================================

async function detectObjects() {
  if (!scanning || !model || detecting) return;

  if (!stream || video.readyState < 2) return;

  detecting = true;

  try {
    const results = await model.detect(video);

    if (!scanning) return;

    predictions = results
      .filter(item => item.score >= CONFIG.confidenceThreshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, CONFIG.maxObjects);

    await Promise.all(
      predictions.map(translateObject)
    );

    if (!scanning) return;

    drawPredictions();
    renderObjects(predictions);

  } catch (error) {
    console.error('Object detection error:', error);

    setStatus('Object recognition encountered an error. Retrying...');

  } finally {
    detecting = false;
  }
}

// ==========================================
// CAMERA OVERLAY
// ==========================================

function drawPredictions() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const item of predictions) {
    const [x, y, width, height] = item.bbox;
    const label = item.translated || item.class;

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#9588ff';
    ctx.shadowColor = '#9588ff';
    ctx.shadowBlur = 8;

    ctx.strokeRect(x, y, width, height);

    ctx.shadowBlur = 0;
    ctx.font = 'bold 16px Arial';

    const labelWidth = ctx.measureText(label).width + 18;
    const labelY = Math.max(25, y - 9);

    ctx.fillStyle = 'rgba(25, 25, 45, 0.88)';

    ctx.fillRect(
      x,
      labelY - 23,
      labelWidth,
      27
    );

    ctx.fillStyle = '#ffffff';

    ctx.fillText(
      label,
      x + 9,
      labelY - 5
    );
  }
}

// ==========================================
// RESULTS PANEL
// ==========================================

function renderObjects(items) {
  if (!items.length) {
    objectResults.innerHTML = `
      <div class="empty">
        <span class="empty-icon">◇</span>
        <strong>Nothing detected yet</strong>
        <span>Point your camera at something to identify it.</span>
      </div>
    `;

    return;
  }

  objectResults.replaceChildren();

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'result-card';

    const info = document.createElement('div');

    const original = document.createElement('div');
    original.className = 'result-original';
    original.textContent = item.class;

    const translated = document.createElement('div');
    translated.className = 'result-translated';

    translated.textContent =
      item.translated || 'Translating...';

    info.append(original, translated);

    const button = document.createElement('button');

    button.className = 'speak-button';
    button.type = 'button';
    button.textContent = '♫';
    button.setAttribute('aria-label', 'Speak translation');

    button.addEventListener('click', () => {
      speech(item.translated || item.class);
    });

    card.append(info, button);

    objectResults.appendChild(card);
  });
}

// ==========================================
// SPEECH SYNTHESIS
// ==========================================

function speech(text) {
  if (!text) {
    setStatus('There is no translated text to read yet.');
    return;
  }

  if (!('speechSynthesis' in window)) {
    setStatus('Speech is not supported in this browser.');
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.lang =
    SPEECH_LANGUAGES[targetLanguage.value] || 'en-US';

  window.speechSynthesis.speak(utterance);
}

// ==========================================
// START SCANNER
// ==========================================

async function startCamera() {
  if (scanning) return;

  try {
    startButton.disabled = true;

    setCameraStatus('LOADING');
    setStatus('Preparing AI vision system...');

    await loadDetectionModel();

    setStatus('Requesting camera access...');

    const newStream = await requestCameraAccess();

    stream = newStream;
    video.srcObject = stream;

    await new Promise((resolve, reject) => {
      video.onloadedmetadata = resolve;

      video.onerror = () => {
        reject(new Error('Unable to load camera video.'));
      };
    });

    await video.play();

    resizeCanvas();

    scanning = true;

    captureButton.disabled = false;
    retakeButton.hidden = true;

    setCameraPlaceholder(false);

    setCameraStatus('SCANNING');
    setStatus('Camera active. Detecting objects...');

    scanTimer = setInterval(
      detectObjects,
      CONFIG.detectionInterval
    );

    detectObjects();

  } catch (error) {
    console.error('Camera startup error:', error);

    stopCamera();

    setCameraStatus('ERROR');

    setStatus(
      `Camera error: ${error.message}. Check browser permissions and use HTTPS or localhost.`
    );

  } finally {
    startButton.disabled = false;
  }
}

// ==========================================
// OCR — TEXT RECOGNITION
// ==========================================


async function scanWrittenText() {
  if (!stream || (!capturedImageData && video.readyState < 2)) {
    setStatus('Start the camera first.');
    return;
  }

  if (typeof window.Tesseract === 'undefined') {
    setStatus('OCR library could not be loaded. Check your internet connection.');
    return;
  }

  try {
    scanButton.disabled = true;

    setStatus('Reading text with OCR...');

    let imageToScan;

    if (capturedImageData) {
      imageToScan = capturedImageData;
    } else {
      const snapshot = document.createElement('canvas');

      snapshot.width = video.videoWidth;
      snapshot.height = video.videoHeight;

      const snapshotContext = snapshot.getContext('2d');

      snapshotContext.drawImage(
        video,
        0,
        0,
        snapshot.width,
        snapshot.height
      );

      imageToScan = snapshot;
    }

    const result = await window.Tesseract.recognize(
      imageToScan,
      OCR_LANGUAGES[sourceLanguage.value]
    );

    const text = result.data.text.trim();

    recognizedText.textContent = text;

    if (!text) {
      recognizedText.textContent = 'No text recognized.';
      ocrResult.textContent = 'No readable text found. Try moving closer.';

      setStatus('No text detected.');

      return;
    }

    const sourceCode = TRANSLATION_LANGUAGES[sourceLanguage.value];

    setStatus('Translating recognized text...');

    ocrTranslation = await translateText(
      text,
      sourceCode,
      targetLanguage.value
    );

    ocrResult.textContent = ocrTranslation;
    saveTranslationToHistory(text, ocrTranslation);

    setStatus('Text translated successfully.');

  } catch (error) {
    console.error('OCR error:', error);

    setStatus(`Text scan error: ${error.message}`);

    ocrResult.textContent =
      'Unable to scan or translate text.';

  } finally {
    scanButton.disabled = false;
  }
}



const HISTORY_STORAGE_KEY = 'visionTranslateHistory';

let translationHistoryItems = [];

function loadTranslationHistory() {
  try {
    const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Could not load translation history:', error);
    return [];
  }
}

function renderTranslationHistory() {
  translationHistory.innerHTML = '';

  if (translationHistoryItems.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'history-empty';
    emptyMessage.textContent = 'Your translations will appear here.';
    translationHistory.appendChild(emptyMessage);
    return;
  }

  translationHistoryItems.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'history-item';

    const original = document.createElement('p');
    original.textContent = item.original;

    const translated = document.createElement('p');
    translated.textContent = item.translated;

    const date = document.createElement('small');
    date.textContent = new Date(item.date).toLocaleString();

    const viewButton = document.createElement('button');
    viewButton.type = 'button';
    viewButton.className = 'button button-secondary';
    viewButton.textContent = 'View translation';

    viewButton.addEventListener('click', () => {
      recognizedText.textContent = item.original;
      ocrResult.textContent = item.translated;
      ocrTranslation = item.translated;
    });

    card.append(original, translated, date, viewButton);
    translationHistory.appendChild(card);
  });
}

function saveTranslationToHistory(original, translated) {
  const entry = {
    original,
    translated,
    date: new Date().toISOString()
  };

  translationHistoryItems.unshift(entry);
  translationHistoryItems = translationHistoryItems.slice(0, 20);

  try {
    localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify(translationHistoryItems)
    );
  } catch (error) {
    console.error('Could not save translation history:', error);
  }

  renderTranslationHistory();
}

function clearTranslationHistory() {
  translationHistoryItems = [];

  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (error) {
    console.error('Could not clear translation history:', error);
  }

  renderTranslationHistory();
}

translationHistoryItems = loadTranslationHistory();
renderTranslationHistory();

clearHistoryButton.addEventListener(
  'click',
  clearTranslationHistory
);

// ==========================================
// LANGUAGE SETTINGS
// ==========================================

function handleLanguageChange() {
  objectTranslationCache.clear();

  predictions.forEach(item => {
    item.translated = null;
  });

  ocrTranslation = '';

  ocrResult.textContent =
    'Target language changed. Scan text again.';

  renderObjects(predictions);

  if (scanning) {
    detectObjects();
  }
}

// ==========================================
// EVENT LISTENERS
// ==========================================

startButton.addEventListener('click', startCamera);

stopButton.addEventListener('click', stopCamera);

captureButton.addEventListener('click', captureCameraImage);

retakeButton.addEventListener('click', retakeCameraImage);

downloadButton.addEventListener('click', downloadCapturedImage);

imageUpload.addEventListener('change', handleImageUpload);

scanUploadedImageButton.addEventListener('click', scanUploadedImageText);

clearUploadedImageButton.addEventListener('click', clearUploadedImage);

scanButton.addEventListener('click', scanWrittenText);

speakOCRButton.addEventListener('click', () => {
  speech(ocrTranslation);
});

readAllButton.addEventListener('click', () => {
  const text = [
    ...predictions.map(item => item.translated || item.class),
    ocrTranslation
  ]
    .filter(Boolean)
    .join('. ');

  speech(text);
});

targetLanguage.addEventListener(
  'change',
  handleLanguageChange
);

window.addEventListener('resize', () => {
  if (video.videoWidth) {
    resizeCanvas();
    drawPredictions();
  }
});

// ==========================================
// APPLICATION CLEANUP
// ==========================================

window.addEventListener('beforeunload', () => {
  if (scanTimer) {
    clearInterval(scanTimer);
  }

  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
});

// ==========================================
// APPLICATION READY
// ==========================================

setCameraPlaceholder(true);
setStatus('System ready. Start the camera to begin.');
setCameraStatus('STANDBY');

console.log('VisionTranslate application initialised successfully.');
