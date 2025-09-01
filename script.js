// ------------------------------
// Fundo animado do site
// ------------------------------
const body = document.querySelector('body');
const bgDiv = document.createElement('div');
bgDiv.id = 'site-background';
body.prepend(bgDiv); // insere atrás de todo conteúdo

// ------------------------------
// Seletores do DOM
// ------------------------------
const canvasContainer = document.getElementById('canvas-container');
const chooseFileBtn = document.getElementById('choose-file');
const fileInput = document.getElementById('file-input');
const downloadButton = document.getElementById('download');
const sizeSlider = document.getElementById('size-slider');

let stage, photoLayer, frameLayer, overlayLayer;
let photo, frame, overlayImg, transformer;
let lastDistance = 0;

// ------------------------------
// Inicializa o canvas
// ------------------------------
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

  // Transformer
  transformer = new Konva.Transformer({
    nodes: [],
    rotateEnabled: false,
    enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right']
  });
  photoLayer.add(transformer);

  // Layer da moldura
  frameLayer = new Konva.Layer();
  stage.add(frameLayer);

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

  // Layer do overlay estático de referência
  overlayLayer = new Konva.Layer();
  stage.add(overlayLayer);

  const overlayStatic = new Image();
  overlayStatic.src = 'overlay.png';
  overlayStatic.onload = () => {
    overlayImg = new Konva.Image({
      x: 0,
      y: 0,
      image: overlayStatic,
      width: stage.width(),
      height: stage.height(),
      listening: false
    });
    overlayLayer.add(overlayImg);
    overlayLayer.draw();
  };

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
  });
};

// ------------------------------
// Botão "Escolher arquivo"
// ------------------------------
chooseFileBtn.addEventListener('click', () => {
  fileInput.value = '';
  fileInput.click();
});

// ------------------------------
// Upload da foto com fit cover + animação
// ------------------------------
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.src = reader.result;
    img.onload = () => {
      const containerSize = stage.width();
      const scaleX = containerSize / img.width;
      const scaleY = containerSize / img.height;
      const finalScale = Math.max(scaleX, scaleY); // fit-cover

      const finalWidth = img.width * finalScale;
      const finalHeight = img.height * finalScale;
      const finalX = (containerSize - finalWidth) / 2;
      const finalY = (containerSize - finalHeight) / 2;

      if (!photo) {
        photo = new Konva.Image({
          x: finalX,
          y: finalY,
          image: img,
          width: finalWidth,
          height: finalHeight,
          draggable: true,
          scaleX: 0,
          scaleY: 0
        });
        photoLayer.add(photo);
        transformer.nodes([photo]);
      } else {
        photo.image(img);
        photo.setAttrs({
          x: finalX,
          y: finalY,
          width: finalWidth,
          height: finalHeight,
          scaleX: 0,
          scaleY: 0
        });
      }

      // animação suave do fit
      const tween = new Konva.Tween({
        node: photo,
        duration: 0.5,
        scaleX: 1,
        scaleY: 1,
        easing: Konva.Easings.EaseInOut
      });
      tween.play();

      overlayLayer.moveToTop();
      frameLayer.draw();
      photoLayer.draw();

      if (sizeSlider) {
        sizeSlider.value = 100;
        sizeSlider.min = 10;
        sizeSlider.max = 300;
      }
    };
  };
  reader.readAsDataURL(file);
});

// ------------------------------
// Slider de zoom
// ------------------------------
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

// ------------------------------
// Pinch-to-zoom celular
// ------------------------------
canvasContainer.addEventListener('touchmove', (e) => {
  if (!photo || e.touches.length !== 2) return;
  e.preventDefault();

  const touch1 = e.touches[0];
  const touch2 = e.touches[1];
  const dx = touch2.clientX - touch1.clientX;
  const dy = touch2.clientY - touch1.clientY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if
