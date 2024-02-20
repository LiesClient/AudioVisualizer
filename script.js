const canvas = document.getElementById("display");
const ctx = canvas.getContext("2d");

const audio = document.getElementById("song");
let actx, analyser, source, lastVolume = 0;

const button = document.getElementById("play");

const width = window.innerWidth;
const height = window.innerHeight;

const padding = width / 100;
const centerScreen = width / 6;
const screenDiagonal = Math.sqrt(width ** 2 + height ** 2);

const minZ = 0;
const maxZ = Math.sqrt((width / 2) ** 2 + (height / 2) ** 2);
const starCount = 1000;
const stars = [];

const leftPanel = new Panel(
  { x: -width / 2, y: -height / 2 + padding },
  { x: -width / 2, y: height / 2 - padding },
  1 + (padding / maxZ),
  (maxZ * 0.005)
);

const rightPanel = new Panel(
  { x: width / 2, y: -height / 2 + padding },
  { x: width / 2, y: height / 2 - padding },
  1 + (padding / maxZ),
  (maxZ * 0.005)
);

const bottomPanel = new Panel(
  { x: -width / 2 + padding, y: height / 2 },
  { x: width / 2 - padding, y: height / 2 },
  1 + (padding / maxZ),
  (maxZ * 0.005),
  false
);

const panels = [
  leftPanel,
  rightPanel,
  // bottomPanel
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

  ctx.fillStyle = "white";
  ctx.strokeStyle = "white";

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
      bottomPanel.fillRect(x / 10, y / 10, 0.1, 0.1);
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

  let spreadAngle = 0;
  let getPoint = (i, mag, add = 0) => {
    let ang = (i / dataArray.length) * (Math.PI * 2 - spreadAngle * 2) + spreadAngle + add;
    let r = (dataArray[i] / 255) * mag;
    // let r = (128 / 255) * mag * height;
    let x = Math.cos(ang) * r;
    let y = Math.sin(ang) * r;

    return { x, y, ang };
  }

  let lines = [
    { r: 0.15, c: "rgba(255, 255, 255, 1.00)" },
    { r: 0.30, c: "rgba(255, 255, 255, 0.85)" },
    { r: 0.45, c: "rgba(255, 255, 255, 0.70)" },
  ];

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

  ctx.fillStyle = "white";
  ctx.strokeStyle = "white";
  ctx.globalAlpha = 0.25;

  // back panel
  let unNorm = (x, y) => {
    let d = Math.sqrt(x * x + y * y);
    return { x: d / x, y: d / y };
  };
  
  for (let j = 0; j < dataArray.length; j++) {
    let p = getPoint(j, 0.5, (j / dataArray.length) * Math.PI * 12 + performance.now() / 500);
    let lastIndex = j - 1;
    // if (lastIndex < 0) lastIndex = dataArray.length - 1;
    // let lp = getPoint(lastIndex, mag);
    // p = unNorm(p.x, p.y);

    let x = p.x * centerScreen;
    let y = p.y * centerScreen;
    let mag = centerScreen / 16;
    let addVec = rotateVec(norm({ x: 1, y: 1 }), p.ang + Math.PI / 4 + performance.now() / 1000);
    let tl = { x: x + addVec.x * mag, y: y + addVec.y * mag };
    addVec = { x: -addVec.y, y: addVec.x };
    let tr = { x: x + addVec.x * mag, y: y + addVec.y * mag };
    addVec = { x: -addVec.y, y: addVec.x };
    let br = { x: x + addVec.x * mag, y: y + addVec.y * mag };
    addVec = { x: -addVec.y, y: addVec.x };
    let bl = { x: x + addVec.x * mag, y: y + addVec.y * mag };
    addVec = { x: -addVec.y, y: addVec.x };

    ctx.beginPath();
    ctx.moveTo(tl.x + width/2, tl.y + height/2);
    ctx.lineTo(tr.x + width/2, tr.y + height/2);
    ctx.lineTo(br.x + width/2, br.y + height/2);
    ctx.lineTo(bl.x + width/2, bl.y + height/2);
    ctx.lineTo(tl.x + width/2, tl.y + height/2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(tl.x * 0.5 + width/2, tl.y * 0.5 + height/2);
    ctx.lineTo(tr.x * 0.5 + width/2, tr.y * 0.5 + height/2);
    ctx.lineTo(br.x * 0.5 + width/2, br.y * 0.5 + height/2);
    ctx.lineTo(bl.x * 0.5 + width/2, bl.y * 0.5 + height/2);
    ctx.lineTo(tl.x * 0.5 + width/2, tl.y * 0.5 + height/2);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;

  lines.push(...[
             { r: 0.60, c: "rgba(255, 255, 255, 0.55)" },
             { r: 0.75, c: "rgba(255, 255, 255, 0.40)" },
             { r: 0.90, c: "rgba(255, 255, 255, 0.25)" }]);

  ctx.lineWidth = 1;
  
  // right panel
  for (let i = 0; i < dataArray.length; i++) {
    let x = i / (dataArray.length + 0.5);
    let y = dataArray[i] / 255;

    ctx.globalAlpha = 1;
    ctx.fillStyle = "white";
    rightPanel.fillRect(x, y * 0.9, (1.5 / dataArray.length), 0.1);

    ctx.fillStyle = "black";
    rightPanel.fillRect(x, y * 0.9 + 0.05 - 0.0125, (1.5 / dataArray.length), 0.025);

    // ctx.globalAlpha = 0.25;
    // rightPanel.fillRect(x - (0.5 / dataArray.length), y * 0.9 - 0.025, (2 / dataArray.length), 0.15);
  }

  ctx.fillStyle = "white";

  // back panel
  let actualSpread = Math.asin((width / 2) / (screenDiagonal / 2));

  for (let i = 0; i < lines.length; i++) {
    let mag = lines[i].r;
    ctx.strokeStyle = lines[i].c;
    ctx.lineWidth = 8;
    ctx.globalAlpha = 0.25;

    if (i == 1) spreadAngle = actualSpread;

    for (let j = 0; j < dataArray.length; j++) {
      let p = getPoint(j, mag * height);
      let lastIndex = j - 1;
      if (lastIndex < 0) lastIndex = dataArray.length - 1;
      let lp = getPoint(lastIndex, mag * height);

      ctx.beginPath();
      ctx.moveTo(-lp.y + width / 2, lp.x + height / 2);
      ctx.lineTo(-p.y + width / 2, p.x + height / 2);
      ctx.stroke();
    }

    ctx.lineWidth = 2;
    ctx.globalAlpha = 1;
    for (let j = 0; j < dataArray.length; j++) {
      let p = getPoint(j, mag * height);
      let lastIndex = j - 1;
      if (lastIndex < 0) lastIndex = dataArray.length - 1;
      let lp = getPoint(lastIndex, mag * height);

      ctx.beginPath();
      ctx.moveTo(-lp.y + width / 2, lp.x + height / 2);
      ctx.lineTo(-p.y + width / 2, p.x + height / 2);
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
  // let lastX = 0;
  // let lastY = 0;
  // let center = bottomPanel.translatePoint(0.5, 0.5);
  // for (let i = 0; i < dataArray.length; i++) {
  //   let ang = (i / dataArray.length) * 12 * Math.PI;
  //   let mag = (dataArray[i] / 255);
  //   let x = Math.sin(ang) * mag * 0.5 + 0.5;
  //   let y = -Math.cos(ang) * mag * 0.5 + 0.5;

  //   let point = bottomPanel.translatePoint(x, y);

  //   x = point.x;
  //   y = point.y;
    
  //   if (i == 0) {
  //     lastX = center.x;
  //     lastY = center.y;
  //   }

  //   let brightness = 255 * (1 - (i / dataArray.length));
  //   ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, ${brightness})`;

  //   ctx.beginPath();
  //   ctx.moveTo(lastX, lastY);
  //   ctx.lineTo(x, y);
  //   ctx.lineTo(center.x, center.y);
  //   ctx.fill();

  //   ctx.beginPath();
  //   ctx.moveTo(lastX, lastY);
  //   ctx.lineTo(x, y);
  //   ctx.stroke();

  //   lastX = x;
  //   lastY = y;
  // }

  // ctx.fillStyle = "white";

  // left panel
  for (let i = 0; i < dataArray.length; i++) {
    let x = i / (dataArray.length + 0.5);
    let y = Math.max(dataArray[i] / 255, 0.01);
    leftPanel.fillRect(x, 1, (1.5 / dataArray.length), -y);
  }

  ctx.restore();

  lastVolume = volume;

  requestAnimationFrame(() => {
    try { loop(); } catch (e) { document.write(e); }
  });
}

button.onclick = () => {
  if (!actx) {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = actx.createAnalyser();
    source = actx.createMediaElementSource(audio);

    source.connect(analyser);
    source.connect(actx.destination);
    analyser.fftSize = 1024;

    try { loop(); } catch (e) { document.write(e); }
  }

  if (audio.paused) {
    audio.play();
    button.textContent = "Stop";
  } else {
    audio.pause();
    button.textContent = "Play";
  }
};

audio.onended = function() {
  button.click();
};

init();
