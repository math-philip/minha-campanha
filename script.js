const canvas = document.getElementById("editorCanvas");
const ctx = canvas.getContext("2d");
const fileInput = document.getElementById("fileInput");
const downloadBtn = document.getElementById("downloadBtn");
const zoomSlider = document.getElementById("zoomSlider");

let img = new Image();
let frame = new Image();
frame.src = "moldura.png";

let imgX = 0, imgY = 0, imgScale = 1;
let isDragging = false, startX, startY;

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    img = new Image();
    img.onload = () => fitImageToCanvas();
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

function fitImageToCanvas() {
  const scaleX = canvas.width / img.width;
  const scaleY = canvas.height / img.height;
  imgScale = Math.max(scaleX, scaleY);

  imgX = (canvas.width - img.width * imgScale) / 2;
  imgY = (canvas.height - img.height * imgScale) / 2;

  zoomSlider.value = imgScale.toFixed(2);
  draw();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (img.src) ctx.drawImage(img, imgX, imgY, img.width * imgScale, img.height * imgScale);
  if (frame.complete) ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
}

// Drag
canvas.addEventListener("mousedown", (e) => {
  isDragging = true;
  startX = e.offsetX - imgX;
  startY = e.offsetY - imgY;
});
canvas.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  imgX = e.offsetX - startX;
  imgY = e.offsetY - startY;
  draw();
});
canvas.addEventListener("mouseup", () => isDragging = false);
canvas.addEventListener("mouseleave", () => isDragging = false);

// Touch
canvas.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1) {
    isDragging = true;
    const rect = canvas.getBoundingClientRect();
    startX = e.touches[0].clientX - rect.left - imgX;
    startY = e.touches[0].clientY - rect.top - imgY;
  }
}, { passive: false });

canvas.addEventListener("touchmove", (e) => {
  if (!isDragging || e.touches.length !== 1) return;
  const rect = canvas.getBoundingClientRect();
  imgX = e.touches[0].clientX - rect.left - startX;
  imgY = e.touches[0].clientY - rect.top - startY;
  draw();
}, { passive: false });

canvas.addEventListener("touchend", () => isDragging = false);

// Zoom com slider
zoomSlider.addEventListener("input", () => {
  imgScale = parseFloat(zoomSlider.value);
  draw();
});

// Zoom com scroll
canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  imgScale += e.deltaY * -0.001;
  imgScale = Math.min(Math.max(0.5, imgScale), 3);
  zoomSlider.value = imgScale.toFixed(2);
  draw();
});

// Download
downloadBtn.addEventListener("click", () => {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = 800;
  tempCanvas.height = 800;
  const tempCtx = tempCanvas.getContext("2d");

  if (img.src) tempCtx.drawImage(img, imgX, imgY, img.width * imgScale, img.height * imgScale);
  if (frame.complete) tempCtx.drawImage(frame, 0, 0, tempCanvas.width, tempCanvas.height);

  const link = document.createElement("a");
  link.download = "moldura.png";
  link.href = tempCanvas.toDataURL("image/png");
  link.click();
});

function animate() {
  requestAnimationFrame(animate);
  draw();
}
animate();
