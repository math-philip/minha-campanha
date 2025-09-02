const canvasContainer = document.getElementById('canvas-container');
const chooseFileBtn = document.getElementById('choose-file');
const fileInput = document.getElementById('file-input');
const downloadButton = document.getElementById('download');
const frameSwitch = document.querySelectorAll('input[name="frameOption"]');

let stage, sampleLayer, photoLayer, frameLayer, overlayLayer;
let photo, frame, overlayImg, sampleImg, transformer;
let lastDistance = 0;
let currentFrameSrc = 'moldura.png';

const initCanvas = () => {
  const containerSize = canvasContainer.offsetWidth;

  stage = new Konva.Stage({
    container: 'canvas-container',
    width: containerSize,
    height: containerSize
  });

  // Layer do sample (fundo)
  sampleLayer = new Konva.Layer();
  stage.add(sampleLayer);

  const sample = new Image();
  sample.src = 'sample.png';
  sample.onload = () => {
    sampleImg = new Konva.Image({
      x: 0,
      y: 0,
      image: sample,
      width: stage.width(),
      height: stage.height(),
      listening: false
    });
    sampleLayer.add(sampleImg);
    sampleLayer.draw();
  };

  // Layer da foto do usuário
  photoLayer = new Konva.Layer();
  stage.add(photoLayer);

  transformer = new Konva.Transformer({
    nodes: [],
    rotateEnabled: false,
    enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right']
  });
  photoLayer.add(transformer);

  // Layer da moldura
  frameLayer = new Konva.Layer();
  stage.add(frameLayer);

  const loadFrame = (src) => {
    const frameImage = new Image();
    frameImage.src = src;
    frameImage.onload = () => {
      if (frame) frame.destroy();
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

  loadFrame(currentFrameSrc);

  // Layer do overlay
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

  // Zoom com scroll
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

// Switch de moldura
frameSwitch.forEach(input => {
  input.addEventListener('change', () => {
    currentFrameSrc = input.value === 'votante' ? 'moldura.png' : 'moldura2.png';
    if (frameLayer && frameLayer.children.length > 0) {
      frame.destroy();
      const frameImage = new Image();
      frameImage.src = currentFrameSrc;
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
    }
  });
});

// Escolher arquivo
chooseFileBtn.addEventListener('click', () => {
  fileInput.value = '';
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
      const scaleX = containerSize / img.width;
      const scaleY = containerSize / img.height;
      const finalScale = Math.max(scaleX, scaleY);

      const finalWidth = img.width * finalScale;
      const finalHeight = img.height * finalScale;
      const finalX = (containerSize - finalWidth) / 2;
      const finalY = (containerSize - finalHeight) / 2;

      // Remove sample
      if (sampleImg) {
        sampleImg.destroy();
        sampleImg = null;
        sampleLayer.draw();
      }

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

      chooseFileBtn.textContent = 'Escolher outra foto';
      downloadButton.style.display = 'inline-block';
    };
  };
  reader.readAsDataURL(file);
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
  overlayLayer.moveToTop();
  photoLayer.draw();
});

canvasContainer.addEventListener('touchend', (e) => {
  if (e.touches.length < 2) lastDistance = 0;
});

// Download
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

  if (overlayImg) {
    overlayImg.width(newSize);
    overlayImg.height(newSize);
    overlayLayer.draw();
  }

  if (photo) {
    const scale = Math.max(newSize / photo.getImage().width, newSize / photo.getImage().height);
    photo.setAttrs({
      x: (newSize - photo.getImage().width * scale) / 2,
      y: (newSize - photo.getImage().height * scale) / 2,
      scaleX: 1,
      scaleY: 1,
      width: photo.getImage().width * scale,
      height: photo.getImage().height * scale
    });
  }

  if (sampleImg) {
    sampleImg.width(newSize);
    sampleImg.height(newSize);
    sampleLayer.draw();
  }

  overlayLayer.moveToTop();
  frameLayer.draw();
  photoLayer.draw();
});

initCanvas();
