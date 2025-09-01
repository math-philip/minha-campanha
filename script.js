const canvasContainer = document.getElementById('canvas-container');
const fileInput = document.getElementById('file-input');
const zoomInButton = document.getElementById('zoom-in');
const zoomOutButton = document.getElementById('zoom-out');
const resetButton = document.getElementById('reset');
const downloadButton = document.getElementById('download');

let stage, photoLayer, frameLayer, photo, frame;

const initCanvas = () => {
  const containerSize = canvasContainer.offsetWidth;

  stage = new Konva.Stage({
    container: 'canvas-container',
    width: containerSize,
    height: containerSize
  });

  // Layer da foto
  photoLayer = new Konva.Layer();
  stage.add(photoLayer);

  // Layer da moldura (sempre acima)
  frameLayer = new Konva.Layer();
  stage.add(frameLayer);

  // Adicionar moldura
  const frameImage = new Image();
  frameImage.src = 'moldura.png';
  frameImage.onload = () => {
    frame = new Konva.Image({
      x: 0,
      y: 0,
      image: frameImage,
      width: stage.width(),
      height: stage.height(),
      draggable: false,
      listening: false
    });
    frameLayer.add(frame);
    frameLayer.draw();
  };
};

const enableControls = () => {
  zoomInButton.disabled = false;
  zoomOutButton.disabled = false;
  resetButton.disabled = false;
  downloadButton.disabled = false;
};

const disableControls = () => {
  zoomInButton.disabled = true;
  zoomOutButton.disabled = true;
  resetButton.disabled = true;
  downloadButton.disabled = true;
};

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  disableControls();

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.src = reader.result;
    img.onload = () => {
      if (photo) photoLayer.remove(photo);

      const containerSize = stage.width();
      const scale = Math.min(containerSize / img.width, containerSize / img.height);

      photo = new Konva.Image({
        x: (containerSize - img.width * scale) / 2,
        y: (containerSize - img.height * scale) / 2,
        image: img,
        width: img.width * scale,
        height: img.height * scale,
        draggable: true
      });

      photoLayer.add(photo);
      photoLayer.draw();
      enableControls();
    };
  };
  reader.readAsDataURL(file);
});

zoomInButton.addEventListener('click', () => {
  if (!photo) return;
  photo.scaleX(photo.scaleX() * 1.1);
  photo.scaleY(photo.scaleY() * 1.1);
  photoLayer.draw();
});

zoomOutButton.addEventListener('click', () => {
  if (!photo) return;
  photo.scaleX(photo.scaleX() * 0.9);
  photo.scaleY(photo.scaleY() * 0.9);
  photoLayer.draw();
});

resetButton.addEventListener('click', () => {
  if (!photo) return;
  const containerSize = stage.width();
  const scale = Math.min(containerSize / photo.getImage().width, containerSize / photo.getImage().height);
  photo.setAttrs({
    x: (containerSize - photo.getImage().width * scale) / 2,
    y: (containerSize - photo.getImage().height * scale) / 2,
    scaleX: scale,
    scaleY: scale
  });
  photoLayer.draw();
});

// Download com merge das camadas
downloadButton.addEventListener('click', () => {
  const containerSize = stage.width();
  const mergedCanvas = document.createElement('canvas');
  mergedCanvas.width = containerSize;
  mergedCanvas.height = containerSize;
  const ctx = mergedCanvas.getContext('2d');

  // Desenhar foto
  ctx.drawImage(photo.getImage(), photo.x(), photo.y(), photo.width() * photo.scaleX(), photo.height() * photo.scaleY());
  // Desenhar moldura
  ctx.drawImage(frame.getImage(), frame.x(), frame.y(), frame.width() * frame.scaleX(), frame.height() * frame.scaleY());

  const dataURL = mergedCanvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = 'foto_com_moldura.png';
  a.click();
});

// Redimensionamento responsivo
window.addEventListener('resize', () => {
  const newSize = canvasContainer.offsetWidth;
  stage.width(newSize);
  stage.height(newSize);

  if (frame) {
    frame.width(newSize);
    frame.height(newSize);
  }

  if (photo) {
    const scale = Math.min(newSize / photo.getImage().width, newSize / photo.getImage().height);
    photo.setAttrs({
      x: (newSize - photo.getImage().width * scale) / 2,
      y: (newSize - photo.getImage().height * scale) / 2,
      scaleX: scale,
      scaleY: scale
    });
  }

  frameLayer.draw();
  photoLayer.draw();
});

initCanvas();
