const canvasContainer = document.getElementById('canvas-container');
const fileInput = document.getElementById('file-input');
const zoomInButton = document.getElementById('zoom-in');
const zoomOutButton = document.getElementById('zoom-out');
const resetButton = document.getElementById('reset');
const downloadButton = document.getElementById('download');

let stage, layer, photo, frame;

const initCanvas = () => {
  stage = new Konva.Stage({
    container: 'canvas-container',
    width: canvasContainer.offsetWidth,
    height: canvasContainer.offsetHeight
  });

  layer = new Konva.Layer();
  stage.add(layer);

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
      draggable: false
    });
    layer.add(frame);
    layer.draw();
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
      if (photo) layer.remove(photo);

      photo = new Konva.Image({
        x: (stage.width() - img.width / 2) / 2,
        y: (stage.height() - img.height / 2) / 2,
        image: img,
        width: img.width / 2,
        height: img.height / 2,
        draggable: true
      });

      layer.add(photo);
      // Garantir que a moldura fique sempre no topo
      if (frame) layer.moveToTop(frame);
      layer.draw();
      enableControls();
    };
  };
  reader.readAsDataURL(file);
});

zoomInButton.addEventListener('click', () => {
  if (!photo) return;
  photo.scaleX(photo.scaleX() * 1.1);
  photo.scaleY(photo.scaleY() * 1.1);
  layer.draw();
});

zoomOutButton.addEventListener('click', () => {
  if (!photo) return;
  photo.scaleX(photo.scaleX() * 0.9);
  photo.scaleY(photo.scaleY() * 0.9);
  layer.draw();
});

resetButton.addEventListener('click', () => {
  if (!photo) return;
  photo.setAttrs({
    x: (stage.width() - photo.width()) / 2,
    y: (stage.height() - photo.height()) / 2,
    scaleX: 1,
    scaleY: 1
  });
  layer.draw();
});

downloadButton.addEventListener('click', () => {
  // Garantir que a moldura esteja no topo antes do download
  if (frame) layer.moveToTop(frame);
  const dataURL = stage.toDataURL();
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = 'foto_com_moldura.png';
  a.click();
});

initCanvas();
