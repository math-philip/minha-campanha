const canvasContainer = document.getElementById('canvas-container');
const chooseFileBtn = document.getElementById('choose-file');
const fileInput = document.getElementById('file-input');
const downloadButton = document.getElementById('download');
const sizeSlider = document.getElementById('size-slider');

let stage, photoLayer, frameLayer, photo, frame, transformer, overlay;
let lastDistance = 0;

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

  // Overlay circular estilo Twibbon com borda tracejada
  overlay = new Konva.Shape({
    sceneFunc: function(ctx, shape) {
      const radius = stage.width() / 2;
      const centerX = stage.width() / 2;
      const centerY = stage.height() / 2;

      // escurece a área externa
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(0, 0, stage.width(), stage.height());

      // círculo central transparente
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, false);
      ctx.fill();

      // volta ao padrão
      ctx.globalCompositeOperation = 'source-over';

      // borda circular tracejada
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 5]); // 10px de traço, 5px de espaço
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, false);
      ctx.stroke();
      ctx.setLineDash([]); // reseta para não afetar outros desenhos
    },
    listening: false
  });
  photoLayer.add(overlay);
  overlay.moveToTop();

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

// Upload da foto com fit cover e animação
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.src = reader.result;
    img.onload = () => {
      const containerSize = stage.width();
      const finalScale = Math.max(containerSize / img.width, containerSize / img.height);
      const finalX = (containerSize - img.width * finalScale) / 2;
      const finalY = (containerSize - img.height * finalScale) / 2;

      if (!photo) {
        photo = new Konva.Image({
          x: finalX,
          y: finalY,
          image: img,
          width: img.width * finalScale,
          height: img.height * finalScale,
          draggable: true,
          scaleX: 0.5,
          scaleY: 0.5
        });
        photoLayer.add(photo);
        transformer.nodes([photo]);
      } else {
        photo.image(img);
        photo.setAttrs({
          x: finalX,
          y: finalY,
          width: img.width * finalScale,
          height: img.height * finalScale,
          scaleX: 0.5,
          scaleY: 0.5
        });
      }

      overlay.moveToTop();
      frameLayer.draw();
      photoLayer.draw();

      // animação de zoom de entrada
      const tween = new Konva.Tween({
        node: photo,
        duration: 0.5,
        scaleX: 1,
        scaleY: 1,
        easing: Konva.Easings.EaseInOut
      });
      tween.play();

      if (sizeSlider) {
        sizeSlider.value = 100;
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

  overlay.moveToTop();
  frameLayer.draw();
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
  overlay.moveToTop();
  frameLayer.draw();
  photoLayer.draw();

  if (sizeSlider) sizeSlider.value = photo.scaleX() * 100;
});

canvasContainer.addEventListener('touchend', (e) => {
  if (e.touches.length < 2) lastDistance = 0;
});

// Download fixo 800x800px (sem overlay)
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
    const scale = Math.max(newSize / photo.getImage().width, newSize / photo.getImage().height);
    photo.setAttrs({
      x: (newSize - photo.getImage().width * scale) / 2,
      y: (newSize - photo.getImage().height * scale) / 2,
      scaleX: 1,
      scaleY: 1,
      width: photo.getImage().width * scale,
      height: photo.getImage().height * scale
    });
    if (sizeSlider) sizeSlider.value = 100;
  }

  overlay.width(newSize);
  overlay.height(newSize);
  overlay.moveToTop();
  frameLayer.draw();
  photoLayer.draw();
});

initCanvas();
