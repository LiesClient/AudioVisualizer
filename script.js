const canvas = document.getElementById("display");
const ctx = canvas.getContext("2d");

const audio = document.getElementById("song");
let actx, analyser, source, lastVolume = 0;

const button = document.getElementById("play");

const width = window.innerWidth;
const height = window.innerHeight;

const padding = width / 100;
const centerScreen = width / 6;

const minZ = 0;
const maxZ = Math.sqrt((width / 2) ** 2 + (height / 2) ** 2);
const starCount = 1000;
const stars = [];

const leftPanel = new Panel(
  { x: -width / 2, y: -height / 2 },
  { x: -width / 2, y: height / 2 },
  1 + (padding / maxZ),
  (maxZ * 0.005)
);

const rightPanel = new Panel(
  { x: width / 2, y: -height / 2 },
  { x: width / 2, y: height / 2 },
  1 + (padding / maxZ),
  (maxZ * 0.005)
);

const panels = [
  leftPanel,
  rightPanel,
];

let currentVelocity = 4;

function init() {
  canvas.width = width;
  canvas.height = height;

  ctx.translate(width / 2, height / 2);
  ctx.scale(0.99, 0.99);
  ctx.translate(-width / 2, -height / 2);
  
  panels.forEach(panel => panel.setContext(ctx));
  panels.forEach(panel => panel.setScreenSize(width, height));
  
  for (let i = 0; i < starCount; i++) {
    let ang = Math.random() * Math.PI * 2;
    let mag = Math.random() * (height / 2) + height / 8;
    stars.push({
      x: Math.cos(ang) * mag,
      y: Math.sin(ang) * mag,
      lx: Math.cos(ang) * mag,
      ly: Math.sin(ang) * mag,
      z: (width + height) / (2 + Math.random()),
    });
  }

  ctx.fillStyle = "black";
  ctx.fillRect(-width, -height, width * 3, height * 3);

  ctx.fillStyle = "gray";
  ctx.strokeStyle = "white";

  for (let x = 0; x < 10; x++) {
    for (let y = 0; y < 10; y++) {
      if ((x + y) % 2 == 0) continue;
      leftPanel.fillRect(x / 10, y / 10, 0.1, 0.1);
      rightPanel.fillRect(x / 10, y / 10, 0.1, 0.1);
    }
  }


  for (let r = centerScreen / 2; r > 0; r -= padding) {
    if (r >= centerScreen / 2) continue;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, r, 0, 2 * Math.PI);
    ctx.stroke();
  }

  ctx.strokeStyle = "white";
  panels.forEach(panel => panel.strokeRect(0, 0, 1, 1));
}


function loop(replay) {
  if (audio.paused) {
    button.textContent = "Play";
  }

  ctx.clearRect(-width, -height, width * 3, height * 3);

  ctx.fillStyle = "black";
  ctx.fillRect(-width, -height, width * 3, height * 3);

  ctx.strokeStyle = "white";
  for (let i = 0; i < stars.length; i++) {
    let star = stars[i];

    star.z -= currentVelocity;
    var sx = (star.x / star.z) * width, sy = (star.y / star.z) * height;

    let px = sx + width / 2;
    let py = sy + height / 2;

    if (px > width * 2 || py > height * 2 || px < -width * 2 || py < -height * 2) star.z = (width + height) / 2;

    sx = (star.x / star.z) * width, sy = (star.y / star.z) * height;
    var r = (((width + height) / 2) - star.z) / ((width + height) / 2);

    ctx.lineWidth = r * 1.5;

    let dx = star.lx - sx;
    let dy = star.ly - sy;
    let d = Math.sqrt(dx * dx + dy * dy);

    let mag = Math.min(height / 32, d) / d;

    let lx = sx + dx * mag;
    let ly = sy + dy * mag;

    if (star.lx != 0 && star.ly != 0) {
      ctx.beginPath();
      ctx.moveTo(sx + width / 2, sy + height / 2);
      ctx.lineTo(lx + width / 2, ly + height / 2);
      ctx.stroke();
    }

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(sx + width / 2, sy + height / 2, r, 0, 2 * Math.PI);
    ctx.fill();
    star.lx = sx, star.ly = sy;
  }

  ctx.fillStyle = "black";
  ctx.lineWidth = 1;

  let dataArray = new Uint8Array(analyser.frequencyBinCount);
  let volume = 0;
  let x = 0;
  let y = 0;

  analyser.getByteTimeDomainData(dataArray);

  let totalMagnitude = 0;

  for (let i = 0; i < dataArray.length; i++) {
    let x = (dataArray[i] / 128) - 1;
    totalMagnitude += x * x;
  }

  volume = Math.sqrt(totalMagnitude / dataArray.length);
  let volumeChange = (volume - lastVolume) * 1000;

  if (volumeChange > 0) volume += volumeChange;

  currentVelocity -= currentVelocity * 0.25;
  currentVelocity += (volume * 100) / dataArray.length + 2;

  let direction = Math.random() * 2 * Math.PI;
  let scale = (currentVelocity ** 2) / 256;
  x = Math.cos(direction) * scale;
  y = Math.sin(direction) * scale;

  // screen shake
  ctx.save();
  ctx.translate(x, y);

  // right panel
  for (let i = 0; i < dataArray.length; i++) {
    let x = i / (dataArray.length + 0.5);
    let y = dataArray[i] / 255;
    
    ctx.fillStyle = "white";
    rightPanel.fillRect(x, y * 0.9, (1.5 / dataArray.length), 0.1);

    ctx.fillStyle = "black";
    rightPanel.fillRect(x, y * 0.9 + 0.05 - 0.0125, (1.5 / dataArray.length), 0.025);

  }
  
  ctx.fillStyle = "white";

  // back panel
  let spreadAngle = Math.PI / 4;
  let getPoint = (i, mag) => {
    let ang = (i / dataArray.length) * (Math.PI * 2 - spreadAngle * 2) + spreadAngle;
    let r = (dataArray[i] / 255) * mag * height;
    // let r = (128 / 255) * mag * height;
    let x = -Math.sin(ang) * r + width / 2;
    let y = Math.cos(ang) * r + height / 2;

    return { x, y };
  }

  let lines = [
    { r: 0.15, c: "rgba(255, 255, 255, 1)" },
    { r: 0.30, c: "rgba(255, 255, 255, 0.8)" },
    { r: 0.45, c: "rgba(255, 255, 255, 0.6)" },
    { r: 0.60, c: "rgba(255, 255, 255, 0.4)" },
    { r: 0.75, c: "rgba(255, 255, 255, 0.2)" },
  ];

  let offset = (height / 2 + padding) * Math.tan(spreadAngle);
  // ctx.lineWidth = 2;
  // ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
  // ctx.beginPath();
  // ctx.moveTo(width / 2 + offset, height + padding);
  // ctx.lineTo(width / 2, height / 2);
  // ctx.lineTo(width / 2 - offset, height + padding);
  // ctx.stroke();

  for (let i = 0; i < lines.length; i++) {
    let mag = lines[i].r;
    ctx.strokeStyle = lines[i].c;
    ctx.lineWidth = (lines.length - i) / 2 + 1;

    for (let j = 0; j < dataArray.length; j++) {
      let p = getPoint(j, mag);
      let lastIndex = j - 1;
      if (lastIndex < 0) lastIndex = dataArray.length - 1;
      let lp = getPoint(lastIndex, mag);

      ctx.beginPath();
      ctx.moveTo(lp.x, lp.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  }

  ctx.lineWidth = 1;

  analyser.getByteFrequencyData(dataArray);

  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  panels.forEach(panel => panel.fillRect(0, 0, 1, 1));

  ctx.strokeStyle = "white";
  panels.forEach(panel => panel.strokeRect(0, 0, 1, 1));

  ctx.fillStyle = "white";
  ctx.strokeStyle = "black";

  // center panel
  let lastX = 0;
  let lastY = 0;
  for (let i = 0; i < dataArray.length; i++) {
    let ang = (i / dataArray.length) * 12 * Math.PI;
    let mag = (dataArray[i] / 255) * (centerScreen / 2 - padding);
    let x = -Math.sin(ang) * mag + width / 2;
    let y = Math.cos(ang) * mag + height / 2;

    if (i == 0) {
      lastX = x;
      lastY = y;
    }

    let brightness = 255 * (1 - (i / dataArray.length));
    ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, ${brightness})`;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.lineTo(width / 2, height / 2);
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

  ctx.restore();

  lastVolume = volume;

  requestAnimationFrame(() => {
    try { loop(); } catch (e) 
    { document.write(e); }
  });
}

button.onclick = () => {
  if (!actx) {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = actx.createAnalyser();
    source = actx.createMediaElementSource(audio);

    source.connect(analyser);
    source.connect(actx.destination);
    analyser.fftSize = 2048;

    try { loop(); } catch (e) 
    { document.write(e); }
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
