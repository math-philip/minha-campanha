const canvasContainer = document.getElementById('canvas-container');
const fileInput = document.getElementById('file-input');
const zoomInButton = document.getElementById('zoom-in');
const zoomOutButton = document.getElementById('zoom-out');
const resetButton = document.getElementById('reset');
const downloadButton = document.getElementById('download');

let stage, photoLayer, frameLayer, photo, frame;
const canvasSize = 800; // tamanho quadrado fixo

const initCanvas = () => {
  // Garantir que o container seja quadrado
  canvasContainer.style.width = canvasSize + 'px';
  canvasContainer.style.height = canvasSize + 'px';

  stage = new Konva.Stage({
    container: 'canvas-container',
    width: canvasContainer.offsetWidth,
    height: canvasContainer.offsetWidth // manter quadrado
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
      width: canvasSize,
      height: canvasSize,
      draggable: false,
      listening: false // não captura eventos
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

      // Calcular escala para caber dentro do quadrado mantendo proporção
      const scale = Math.min(stage.width() / img.width, stage.height() / img.height);

      photo = new Konva.Image({
        x: (stage.width() - img.width * scale) / 2,
        y: (stage.height() - img.height * scale) / 2,
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
  const scale = Math.min(stage.width() / photo.getImage().width, stage.height() / photo.getImage().height);
  photo.setAttrs({
    x: (stage.width() - photo.getImage().width * scale) / 2,
    y: (stage.height() - photo.getImage().height * scale) / 2,
    scaleX: scale,
    scaleY: scale
  });
  photoLayer.draw();
});

downloadButton.addEventListener('click', () => {
  const mergedCanvas = document.createElement('canvas');
  mergedCanvas.width = canvasSize;
  mergedCanvas.height = canvasSize;
  const ctx = mergedCanvas.getContext('2d');

  // Desenhar foto primeiro
  ctx.drawImage(photo.getImage(), photo.x(), photo.y(), photo.width() * photo.scaleX(), photo.height() * photo.scaleY());
  // Desenhar moldura por cima
  ctx.drawImage(frame.getImage(), frame.x(), frame.y(), frame.width() * frame.scaleX(), frame.height() * frame.scaleY());

  const dataURL = mergedCanvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = 'foto_com_moldura.png';
  a.click();
});

initCanvas();
