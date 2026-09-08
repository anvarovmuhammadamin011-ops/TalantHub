// Yuz borligini aniqlash + pasport/selfie o'xshashligi heuristic.
// Bu yakuniy biometrik hukm emas — dastlabki avtomatik filtr, yakuniy qarorni admin beradi.

export const FACE_PASS_THRESHOLD = 0.55;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const url = typeof src === "string" ? src : URL.createObjectURL(src);
    const img = new Image();
    img.onload = () => {
      if (typeof src !== "string") URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      if (typeof src !== "string") URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

async function detectFaceBox(img) {
  try {
    if (typeof FaceDetector === "undefined") return null;
    const detector = new FaceDetector({ fastMode: true, maxDetectedFaces: 3 });
    const faces = await detector.detect(img);
    if (!faces || faces.length === 0) return null;
    // Eng katta yuzni tanlaymiz
    let best = faces[0].boundingBox;
    let bestArea = best.width * best.height;
    for (const f of faces) {
      const b = f.boundingBox;
      const area = b.width * b.height;
      if (area > bestArea) { best = b; bestArea = area; }
    }
    return best;
  } catch {
    return null;
  }
}

function isFaceDetectorAvailable() {
  return typeof FaceDetector !== "undefined";
}

// Rasmni (yuz sohasi bo'lsa o'shani) 64x64 grayscale massivga tushiradi
function toGrayscale(img, box) {
  const SIZE = 64;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (box) {
    const pad = 0.35; // yuz atrofidan biroz fon ham olinsin
    const pw = box.width * pad, ph = box.height * pad;
    sx = Math.max(0, box.x - pw);
    sy = Math.max(0, box.y - ph);
    sw = Math.min(img.naturalWidth - sx, box.width + pw * 2);
    sh = Math.min(img.naturalHeight - sy, box.height + ph * 2);
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, SIZE, SIZE);
  const data = ctx.getImageData(0, 0, SIZE, SIZE).data;
  const gray = new Float32Array(SIZE * SIZE);
  for (let i = 0; i < SIZE * SIZE; i++) {
    gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  }
  return gray;
}

// Average hash (8x8) — markaziy 8x8 qismdan
function averageHash(gray) {
  const SIZE = 64, N = 8, OFF = (SIZE - N) / 2;
  let sum = 0;
  const vals = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const v = gray[(OFF + y) * SIZE + (OFF + x)];
      vals.push(v);
      sum += v;
    }
  }
  const avg = sum / vals.length;
  let hash = 0n;
  for (const v of vals) hash = (hash << 1n) | (v >= avg ? 1n : 0n);
  return hash;
}

function hammingDistance(a, b) {
  let x = a ^ b;
  let d = 0;
  while (x > 0n) { d += Number(x & 1n); x >>= 1n; }
  return d;
}

// 16-binli gistogramma korrelyatsiyasi (Pearson), -1..1
function histCorrelation(g1, g2) {
  const BINS = 16;
  const h1 = new Float64Array(BINS), h2 = new Float64Array(BINS);
  for (let i = 0; i < g1.length; i++) {
    h1[Math.min(BINS - 1, Math.floor(g1[i] / 16))]++;
    h2[Math.min(BINS - 1, Math.floor(g2[i] / 16))]++;
  }
  for (let i = 0; i < BINS; i++) { h1[i] /= g1.length; h2[i] /= g2.length; }
  const m1 = h1.reduce((a, b) => a + b, 0) / BINS;
  const m2 = h2.reduce((a, b) => a + b, 0) / BINS;
  let num = 0, d1 = 0, d2 = 0;
  for (let i = 0; i < BINS; i++) {
    num += (h1[i] - m1) * (h2[i] - m2);
    d1 += (h1[i] - m1) ** 2;
    d2 += (h2[i] - m2) ** 2;
  }
  if (d1 === 0 || d2 === 0) return 0;
  return num / Math.sqrt(d1 * d2);
}

/**
 * Pasport rasmi va jonli selfie'ni solishtiradi.
 * @returns {Promise<{score:number, faceFoundPassport:boolean, faceFoundSelfie:boolean, auto:boolean, passed:boolean}>}
 */
export async function compareFaces(passportSrc, selfieSrc) {
  const auto = isFaceDetectorAvailable();
  const [passportImg, selfieImg] = await Promise.all([loadImage(passportSrc), loadImage(selfieSrc)]);

  let passportBox = null, selfieBox = null;
  if (auto) {
    [passportBox, selfieBox] = await Promise.all([detectFaceBox(passportImg), detectFaceBox(selfieImg)]);
  }

  const g1 = toGrayscale(passportImg, passportBox);
  const g2 = toGrayscale(selfieImg, selfieBox);

  const hashSim = 1 - hammingDistance(averageHash(g1), averageHash(g2)) / 64;
  const histSim = (histCorrelation(g1, g2) + 1) / 2;
  const score = Math.round((0.6 * hashSim + 0.4 * histSim) * 100) / 100;

  const faceFoundPassport = !auto || !!passportBox;
  const faceFoundSelfie = !auto || !!selfieBox;
  const passed = faceFoundSelfie && score >= FACE_PASS_THRESHOLD;

  return { score, faceFoundPassport, faceFoundSelfie, auto, passed };
}
