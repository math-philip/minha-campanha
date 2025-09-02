const stage = new Konva.Stage({
  container: 'canvas-container',
  width: document.getElementById('canvas-container').offsetWidth,
  height: document.getElementById('canvas-container').offsetWidth,
});

let photoLayer, frameLayer, overlayLayer;
let photo, frame, overlay;

let currentFrameSrc = 'moldura.png'; // moldura padrão

// Função para carregar a moldura
const loadFrame = (src) => {
  const frameImage = new Image();
  frameImage.src = src;
  frameImage.onload = () => {
    if (frame) {
      frame.image(frameImage);
    } else {
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
    }
    frameLayer.draw();
    overlayLayer.moveToTop();
  };
};

// Inicializa o canvas
function initCanvas() {
  // Layer da foto
  photoLayer = new Konva.Layer();
  stage.add(photoLayer);

  // Layer da moldura
  frameLayer = new Konva.Layer();
  stage.add(frameLayer);
  loadFrame(currentFrameSrc);

  // Layer do overlay
  overlayLayer = new Konva.Layer();
  stage.add(overlayLayer);

  const overlayImage = new Image();
  overlayImage.src = 'overlay.png';
  overlayImage.onload = () => {
    overlay = new Konva.Image({
      x: 0,
      y: 0,
      image: overlayImage,
      width: stage.width(),
      height: stage.height(),
      draggable: false,
      listening: false
    });
    overlayLayer.add(overlay);
    overlayLayer.draw();
  };
}

// Inicializar
initCanvas();

// Input e botões
const fileInput = document.getElementById('file-input');
const chooseFileButton = document.getElementById('choose-file');
const downloadButton = document.getElementById('download');

// Escolher arquivo
chooseFileButton.addEventListener('click', () => {
  fileInput.click();
});

// Upload de imagem
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (evt) {
    const img = new Image();
    img.src = evt.target.result;
    img.onload = function () {
      if (photo) {
        photo.destroy();
      }

      photo = new Konva.Image({
        image: img,
        x: stage.width() / 2,
        y: stage.height() / 2,
        draggable: true,
      });

      const scale = Math.max(stage.width() / img.width, stage.height() / img.height);
      photo.scale({ x: scale, y: scale });
      photo.offsetX(img.width / 2);
      photo.offsetY(img.height / 2);

      photoLayer.add(photo);
      photoLayer.draw();

      frameLayer.moveToTop();
      overlayLayer.moveToTop();

      downloadButton.style.display = 'inline-block';
    };
  };
  reader.readAsDataURL(file);
});

// Troca de moldura pelo switch
document.querySelectorAll('input[name="frame"]').forEach((radio) => {
  radio.addEventListener('change', (e) => {
    currentFrameSrc = e.target.value;
    loadFrame(currentFrameSrc);
  });
});

// Download da imagem final
downloadButton.addEventListener('click', () => {
  if (!photo || !frame) return;

  const downloadSize = 800;
  const mergedCanvas = document.createElement('canvas');
  mergedCanvas.width = downloadSize;
  mergedCanvas.height = downloadSize;
  const ctx = mergedCanvas.getContext('2d');

  const scaleX = photo.width() * photo.scaleX() / stage.width();
  const scaleY = photo.height() * photo.scaleY() / stage.height();
  const posX = photo.x() / stage.width() * downloadSize;
  const posY = photo.y() / stage.height() * downloadSize;

  ctx.drawImage(
    photo.getImage(),
    posX,
    posY,
    scaleX * downloadSize,
    scaleY * downloadSize
  );

  ctx.drawImage(frame.getImage(), 0, 0, downloadSize, downloadSize);

  const dataURL = mergedCanvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = 'foto_com_moldura.png';
  a.click();
});
