const canvasContainer = document.getElementById('canvas-container');
const chooseFileBtn = document.getElementById('choose-file');
const fileInput = document.getElementById('file-input');
const downloadButton = document.getElementById('download');
const sizeSlider = document.getElementById('size-slider');

let stage, photoLayer, frameLayer, photo, frame, transformer;
let lastDistance = 0;

const initCanvas = () => {
  const containerSize = canvasContainer.offsetWidth;

  stage = new Konva.Stage({
    container: 'canvas-container',
    width: containerSize,
    height: containerSize
  });

  photoLayer = new Konva.Layer();
  stage.add(photoLayer);

  frameLayer = new Konva.Layer();
  stage.add(frameLayer);

  // Moldura
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

  transformer = new Konva.Transformer({
    nodes: [],
    rotateEnabled: false,
    enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right']
  });
  photoLayer.add(transformer);

  // Scroll para zoom desktop
  stage.on('wheel', (e) => {
    if (!photo) return;
    e.evt.preventDefault();
    const oldScale = photo.scaleX();
    const pointer = stage.getPointerPosition();
    const scaleBy = 1.05;
    const direction = e.evt.deltaY > 0 ? 1 / scaleBy : scaleBy;
    photo.scaleX(photo.scaleX() * direction);
    photo.scaleY(photo.scaleY() * direction);

    const mousePointTo = {
      x: (pointer.x - photo.x()) / oldScale,
      y: (pointer.y - photo.y()) / oldScale
    };
    photo.x(pointer.x - mousePointTo.x * photo.scaleX());
    photo.y(pointer.y - mousePointTo.y * photo.scaleY());

    photoLayer.draw();
    if (sizeSlider) sizeSlider.value = photo.scaleX() * 100;
  });
};

// Botão "Escolher arquivo"
chooseFileBtn.addEventListener('click', () => {
  fileInput.value = ''; // reset input
  fileInput.click();
});

// Upload da foto
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.src = reader.result;
    img.onload = () => {
      const containerSize = stage.width();
      const scale = Math.min(containerSize / img.width, containerSize / img.height);

      if (!photo) {
        // criar novo node se não existir
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
      } else {
        // substituir imagem mantendo node e transformer
        photo.image(img);
        photo.setAttrs({
          x: (containerSize - img.width * scale) / 2,
          y: (containerSize - img.height * scale) / 2,
          width: img.width * scale,
          height: img.height * scale,
          scaleX: scale,
          scaleY: scale
        });
      }

      photoLayer.draw();

      if (sizeSlider) {
        sizeSlider.value = scale * 100;
        sizeSlider.min = 10;
        sizeSlider.max = 300;
      }
    };
  };
  reader.readAsDataURL(file);
});

// Slider de zoom
sizeSlider.addEventListener('input', () => {
  if (!photo) return;
  const scale = sizeSlider.value / 100;
  const centerX = stage.width() / 2;
  const centerY = stage.height() / 2;
  const oldScale = photo.scaleX();
  photo.scaleX(scale);
  photo.scaleY(scale);

  photo.x(centerX - (centerX - photo.x()) * (scale / oldScale));
  photo.y(centerY - (centerY - photo.y()) * (scale / oldScale));

  photoLayer.draw();
});

// Pinch-to-zoom celular
canvasContainer.addEventListener('touchmove', (e) => {
  if (!photo || e.touches.length !== 2) return;
  e.preventDefault();

  const touch1 = e.touches[0];
  const touch2 = e.touches[1];
  const dx = touch2.clientX - touch1.clientX;
  const dy = touch2.clientY - touch1.clientY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (lastDistance) {
    const scaleChange = distance / lastDistance;
    photo.scaleX(photo.scaleX() * scaleChange);
    photo.scaleY(photo.scaleY() * scaleChange);

    const centerX = (touch1.clientX + touch2.clientX) / 2 - canvasContainer.getBoundingClientRect().left;
    const centerY = (touch1.clientY + touch2.clientY) / 2 - canvasContainer.getBoundingClientRect().top;
    const oldScale = photo.scaleX() / scaleChange;
    photo.x(centerX - (centerX - photo.x()) * (photo.scaleX() / oldScale));
    photo.y(centerY - (centerY - photo.y()) * (photo.scaleY() / oldScale));
  }

  lastDistance = distance;
  photoLayer.draw();
  if (sizeSlider) sizeSlider.value = photo.scaleX() * 100;
});

canvasContainer.addEventListener('touchend', (e) => {
  if (e.touches.length < 2) lastDistance = 0;
});

// Download fixo 800x800px
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
