const canvas = document.getElementById("display");
const ctx = canvas.getContext("2d");

const audio = document.getElementById("song");
let actx, analyser, source, dataArray;

const button = document.getElementById("play");

const width = window.innerWidth;
const height = window.innerHeight;

const padding = width / 100;
const centerScreen = width / 3;

const leftPanel = new Panel(
  { x: padding, y: padding },
  { x: width/2 - centerScreen/2 - padding, y: (height - centerScreen)/2 },
  { x: padding, y: height - padding },
  { x: width/2 - centerScreen/2 - padding, y: height - (height - centerScreen)/2 }
);

const rightPanel = new Panel(
  { x: width - padding, y: padding },
  { x: width/2 + centerScreen/2 + padding, y: (height - centerScreen)/2 },
  { x: width - padding, y: height - padding },
  { x: width/2 + centerScreen/2 + padding, y: height - (height - centerScreen)/2 }
);

const centerPanel = new Panel(
  { x: width/2 - centerScreen/2, y: (height - centerScreen)/2 },
  { x: width/2 + centerScreen/2, y: (height - centerScreen)/2 },
  { x: width/2 - centerScreen/2, y: height - (height - centerScreen)/2 },
  { x: width/2 + centerScreen/2, y: height - (height - centerScreen)/2 }
);

const panels = [
  leftPanel, rightPanel, centerPanel
];

function init() {
  canvas.width = width;
  canvas.height = height;

  panels.forEach(panel => panel.setContext(ctx));

  ctx.fillStyle = "gray";

  for (let x = 0; x < 10; x++) {
    for (let y = 0; y < 10; y++) {
      if ((x + y) % 2 == 0) continue;
      leftPanel.fillRect(x / 10, y / 10, 0.1, 0.1);
      rightPanel.fillRect(x / 10, y / 10, 0.1, 0.1);
    }
  }

  ctx.strokeStyle = "white";

  for (let r = centerScreen / 2; r > 0; r -= padding) {
    if (r >= centerScreen / 2) continue;
    ctx.beginPath();
    ctx.arc(width/2, height/2, r, 0, 2 * Math.PI);
    ctx.stroke();
  }

  ctx.strokeStyle = "white";
  panels.forEach(panel => panel.strokeRect(0, 0, 1, 1));
  
  loop();
}


function loop() {
  if (audio.paused) return requestAnimationFrame(loop);
  
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, width, height);
  
  ctx.strokeStyle = "white";
  panels.forEach(panel => panel.strokeRect(0, 0, 1, 1));

  ctx.fillStyle = "white";
  ctx.strokeStyle = "black";

  analyser.getByteFrequencyData(dataArray);
  
  // center panel
  let lastX = 0;
  let lastY = 0;
  for (let i = 0; i < dataArray.length; i++) {
    let ang = (i / dataArray.length) * 8 * Math.PI;
    let mag = (dataArray[i] / 255) * (centerScreen/2 - padding);
    let x = Math.cos(ang) * mag + width / 2;
    let y = Math.sin(ang) * mag + height / 2;
    
    if (i == 0) {
      lastX = x;
      lastY = y;
    }

    let brightness = 255 * (i / dataArray.length);
    ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, ${dataArray[i] / 255 + 0.2})`;
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.lineTo(width/2, height/2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    lastX = x;
    lastY = y;
  }

  ctx.fillStyle = "white";
  
  // left panel
  for (let i = 0; i < dataArray.length; i++) {
    let x = i / (dataArray.length + 0.5);
    let y = Math.max(dataArray[i] / 255, 0.01);
    leftPanel.fillRect(x, 1, (1.5 / dataArray.length), -y);
  }

  // right panel
  analyser.getByteTimeDomainData(dataArray);

  for (let i = 0; i < dataArray.length; i++) {
    let x = i / (dataArray.length + 0.5);
    let y = Math.max(dataArray[i] / 255, 0.01);
    rightPanel.fillRect(x, y - 0.05, (1.5 / dataArray.length), 0.1);
  }

  requestAnimationFrame(loop);
}

button.onclick = () => {
  if (!actx) {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = actx.createAnalyser();
    source = actx.createMediaElementSource(audio);

    source.connect(analyser);
    source.connect(actx.destination);
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
  }
  
  if (audio.paused) {
    audio.play();
    button.textContent = "Stop";
  } else {
    audio.pause();
    button.textContent = "Play";
  }
};

init();
