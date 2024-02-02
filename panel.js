class Panel {
  top;
  bot;
  zFr;
  zBa;
  ctx;
  width;
  height;
  maxZ;

  constructor (
    top,
    bottom,
    zFront,
    zBack
  ) {
    this.top = top;
    this.bot = bottom;
    this.zFr = zFront;
    this.zBa = zBack;
  }

  setContext(ctx) {
    this.ctx = ctx;
  }

  setScreenSize(width, height) {
    this.width = width;
    this.height = height;
    this.maxZ = Math.sqrt((width / 2) ** 2 + (height / 2) ** 2);
  }

  #calculateZ(x, y) {
    return lerp(this.zBa, this.zFr, x);
  }
  // (x, y) on panel to (ox, oy) to put on screen
  // (x, y) is the point on the panel
  // (ox, oy) is that point translated to screen space
  
  translatePoint(x, y) {
    let z = this.#calculateZ(x, y);
    let ox = this.top.x;
    let oy = lerp(this.bot.y, this.top.y, y);
    return this.from3d(ox, oy, z);
  }

  from3d(x, y, z) {
    return {
      x: x / z + width / 2,
      y: y / z + height / 2,
    }
  }

  #rect(x, y, width, height) {
    let tl = this.translatePoint(x, y);
    let tr = this.translatePoint(x + width, y);
    let bl = this.translatePoint(x, y + height);
    let br = this.translatePoint(x + width, y + height);

    ctx.beginPath();
    ctx.moveTo(tl.x, tl.y);
    ctx.lineTo(tr.x, tr.y);
    ctx.lineTo(br.x, br.y);
    ctx.lineTo(bl.x, bl.y);
    ctx.lineTo(tl.x, tl.y);
  }

  strokeRect(x, y, width, height) {
    this.#rect(x, y, width, height);
    ctx.stroke();
  }

  fillRect(x, y, width, height) {
    this.#rect(x, y, width, height);
    ctx.fill();
  }
}

function lerp(a, b, t) {
  return a * t + (1 - t) * b;
}

function norm(vec) {
  let mag = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
  return { x: vec.x / mag, y: vec.y / mag };
}
