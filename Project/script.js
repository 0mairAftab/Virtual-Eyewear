const video = document.getElementById('video');
const shapeDiv = document.getElementById('shape');

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startVideo);

function startVideo() {
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then(stream => {
      video.srcObject = stream;
    })
    .catch(err => {
      console.error("Error accessing the webcam:", err);
    });
}

video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

    if (detections.length > 0) {
      const landmarks = detections[0].landmarks;
      const faceShape = getFaceShape(landmarks);
      shapeDiv.textContent = `Face Shape: ${faceShape}`;
    } else {
      shapeDiv.textContent = "No face detected.";
    }
  }, 100);
});

// Function to determine face shape
function getFaceShape(landmarks) {
  const jawline = landmarks.getJawOutline();
  const leftJaw = jawline[0];
  const rightJaw = jawline[jawline.length - 1];
  const chin = jawline[Math.floor(jawline.length / 2)];

  const faceWidth = Math.abs(leftJaw.x - rightJaw.x);
  const faceHeight = Math.abs(leftJaw.y - chin.y);

  const aspectRatio = faceHeight / faceWidth;

  if (aspectRatio > 1.5) {
    return "Oblong";
  } else if (aspectRatio > 1.3 && faceWidth / faceHeight < 1.3) {
    return "Oval";
  } else if (faceWidth / faceHeight > 1.4) {
    return "Square";
  } else if (jawline[0].x - jawline[jawline.length - 1].x > 50) {
    return "Triangle";
  } else {
    return "Rectangle";
  }
}
