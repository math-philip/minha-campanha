const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const upload = document.getElementById("upload");
const zoom = document.getElementById("zoom");
const downloadBtn = document.getElementById("download");

const frame = new Image();
frame.src = "moldura.png";

let img = null;
let imgX = 0, imgY = 0;
let scale = 1;
let isDragging = false;
let startX, startY;
let offsetX = 0, offsetY = 0;

// ===== DESENHAR CANVAS =====
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (img) {
    const iw = img.width * scale;
    const ih = img.height * scale;
    ctx.drawImage(img, imgX, imgY, iw, ih);
  }

  ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
}

// ===== FIT AUTOMÁTICO COM ANIMAÇÃO =====
function fitImageToCanvas() {
  if (!img) return;

  const scaleX = canvas.width / img.width;
  const scaleY = canvas.height / img.height;
  const newScale = Math.max(scaleX, scaleY);

  const newX = (canvas.width - img.width * newScale) / 2;
  const newY = (canvas.height - img.height * newScale) / 2;

  const steps = 20;
  let step = 0;
  const startScale = scale;
  const startXPos = imgX;
  const startYPos = imgY;

  function animate() {
    step++;
    const t = step / steps;

    scale = startScale + (newScale - startScale) * t;
    imgX = startXPos + (newX - startXPos) * t;
    imgY = startYPos + (newY - startYPos) * t;

    draw();
    if (step < steps) requestAnimationFrame(animate);
  }
  animate();
}

// ===== UPLOAD =====
upload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    img = new Image();
    img.onload = () => {
      scale = 1;
      offsetX = offsetY = 0;
      fitImageToCanvas();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

// ===== MOVER COM MOUSE =====
canvas.addEventListener("mousedown", (e) => {
  isDragging = true;
  startX = e.offsetX - offsetX;
  startY = e.offsetY - offsetY;
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  offsetX = e.offsetX - startX;
  offsetY = e.offsetY - startY;
  imgX = offsetX;
  imgY = offsetY;
  draw();
});

canvas.addEventListener("mouseup", () => (isDragging = false));
canvas.addEventListener("mouseleave", () => (isDragging = false));

// ===== MOVER COM TOUCH =====
canvas.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1) {
    isDragging = true;
    const rect = canvas.getBoundingClientRect();
    startX = e.touches[0].clientX - rect.left - offsetX;
    startY = e.touches[0].clientY - rect.top - offsetY;
  }
});

canvas.addEventListener("touchmove", (e) => {
  if (!isDragging || e.touches.length !== 1) return;
  const rect = canvas.getBoundingClientRect();
  offsetX = e.touches[0].clientX - rect.left - startX;
  offsetY = e.touches[0].clientY - rect.top - startY;
  imgX = offsetX;
  imgY = offsetY;
  draw();
});

canvas.addEventListener("touchend", () => (isDragging = false));

// ===== ZOOM COM SLIDER =====
zoom.addEventListener("input", () => {
  if (!img) return;
  scale = parseFloat(zoom.value);
  draw();
});

// ===== ZOOM COM SCROLL =====
canvas.addEventListener("wheel", (e) => {
  if (!img) return;
  e.preventDefault();
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  scale = Math.min(Math.max(0.5, scale + delta), 3);
  zoom.value = scale;
  draw();
});

// ===== DOWNLOAD 800x800 =====
downloadBtn.addEventListener("click", () => {
  if (!img) return;

  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 800;
  exportCanvas.height = 800;
  const exportCtx = exportCanvas.getContext("2d");

  exportCtx.drawImage(img, imgX, imgY, img.width * scale, img.height * scale);
  exportCtx.drawImage(frame, 0, 0, 800, 800);

  const link = document.createElement("a");
  link.download = "moldura.png";
  link.href = exportCanvas.toDataURL("image/png");
  link.click();
});

// ===== PRIMEIRO DRAW =====
frame.onload = draw;
