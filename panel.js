class Panel {
  tl; 
  tr; 
  br; 
  bl;
  ctx;
  
  constructor (
    topLeft,
    topRight,
    botLeft,
    botRight
  ) {
    this.tl = topLeft;
    this.tr = topRight;
    this.br = botRight;
    this.bl = botLeft;
  }

  setContext(ctx) {
    this.ctx = ctx;
  }

  // (x, y) on panel to (ox, oy) to put on screen
  // (x, y) is the point on the panel
  // (ox, oy) is that point translated to screen space
  translatePoint(x, y) {
    let left = { x: lerp(this.bl.x, this.tl.x, y), y: lerp(this.bl.y, this.tl.y, y) };
    let right = { x: lerp(this.br.x, this.tr.x, y), y: lerp(this.br.y, this.tr.y, y) };
    
    return {
      x: lerp(right.x, left.x, x), y: lerp(right.y, left.y, x)
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
