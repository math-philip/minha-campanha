const canvasContainer = document.getElementById('canvas-container');
const fileInput = document.getElementById('file-input');
const zoomInButton = document.getElementById('zoom-in');
const zoomOutButton = document.getElementById('zoom-out');
const resetButton = document.getElementById('reset');
const downloadButton = document.getElementById('download');

let stage, photoLayer, frameLayer, photo, frame;

const initCanvas = () => {
  stage = new Konva.Stage({
    container: 'canvas-container',
    width: canvasContainer.offsetWidth,
    height: canvasContainer.offsetHeight
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
      listening: false // importante: não captura eventos, permite interagir com a foto
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

      photo = new Konva.Image({
        x: (stage.width() - img.width / 2) / 2,
        y: (stage.height() - img.height / 2) / 2,
        image: img,
        width: img.width / 2,
        height: img.height / 2,
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
  photo.setAttrs({
    x: (stage.width() - photo.width()) / 2,
    y: (stage.height() - photo.height()) / 2,
    scaleX: 1,
    scaleY: 1
  });
  photoLayer.draw();
});

downloadButton.addEventListener('click', () => {
  // Merge layers em um canvas temporário para exportar
  const mergedCanvas = document.createElement('canvas');
  mergedCanvas.width = stage.width();
  mergedCanvas.height = stage.height();
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
