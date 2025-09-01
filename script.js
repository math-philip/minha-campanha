const canvasContainer = document.getElementById('canvas-container');
const fileInput = document.getElementById('file-input');
const downloadButton = document.getElementById('download');
const sizeSlider = document.getElementById('size-slider'); // Slider do zoom

let stage, photoLayer, frameLayer, photo, frame, transformer;

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

  // Transformer para redimensionar a foto com touch/pinch
  transformer = new Konva.Transformer({
    nodes: [],
    rotateEnabled: false,
    enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right']
  });
  photoLayer.add(transformer);

  // Scroll para zoom
  stage.on('wheel', (e) => {
    if (!photo) return;
    e.evt.preventDefault();
    const oldScale = photo.scaleX();
    const pointer = stage.getPointerPosition();
    const scaleBy = 1.05;
    const direction = e.evt.deltaY > 0 ? 1 / scaleBy : scaleBy;
    photo.scaleX(photo.scaleX() * direction);
    photo.scaleY(photo.scaleY() * direction);

    // Ajustar posição para zoom centrado no cursor
    const mousePointTo = {
      x: (pointer.x - photo.x()) / oldScale,
      y: (pointer.y - photo.y()) / oldScale
    };
    photo.x(pointer.x - mousePointTo.x * photo.scaleX());
    photo.y(pointer.y - mousePointTo.y * photo.scaleY());

    photoLayer.draw();

    // Atualizar slider
    if (sizeSlider) sizeSlider.value = photo.scaleX() * 100;
  });
};

const enableControls = () => {
  downloadButton.disabled = false;
  sizeSlider.disabled = false;
};

const disableControls = () => {
  downloadButton.disabled = true;
  sizeSlider.disabled = true;
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
      transformer.nodes([photo]);
      photoLayer.draw();

      // Configurar slider
      if (sizeSlider) {
        sizeSlider.value = scale * 100;
        sizeSlider.min = 10;
        sizeSlider.max = 300;
      }

      enableControls();
    };
  };
  reader.readAsDataURL(file);
});

// Slider para zoom
if (sizeSlider) {
  sizeSlider.addEventListener('input', () => {
    if (!photo) return;
    const scale = sizeSlider.value / 100;
    const centerX = stage.width() / 2;
    const centerY = stage.height() / 2;
    const oldScale = photo.scaleX();
    photo.scaleX(scale);
    photo.scaleY(scale);

    // manter foto centralizada
    photo.x(centerX - (centerX - photo.x()) * (scale / oldScale));
    photo.y(centerY - (centerY - photo.y()) * (scale / oldScale));

    photoLayer.draw();
  });
}

// Download com merge das camadas
downloadButton.addEventListener('click', () => {
  const containerSize = stage.width();
  const mergedCanvas = document.createElement('canvas');
  mergedCanvas.width = containerSize;
  mergedCanvas.height = containerSize;
  const ctx = mergedCanvas.getContext('2d');

  ctx.drawImage(photo.getImage(), photo.x(), photo.y(), photo.width() * photo.scaleX(), photo.height() * photo.scaleY());
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
    if (sizeSlider) sizeSlider.value = scale * 100;
  }

  frameLayer.draw();
  photoLayer.draw();
});

initCanvas();
