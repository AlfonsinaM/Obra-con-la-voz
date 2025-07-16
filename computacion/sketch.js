//Morales Alfonsina 19093/5
//Jara Pilar 119058/2
//Kaldi Alma 120328/0
//Laikow Maia 119062/7
//Cordomi Agostina 95561/9
//Cla Agustina 93551/8
let AMP_MIN = 0.02;
let HIGH_VOLUME_THRESHOLD = 0.1;
let TREBLE_THRESHOLD = 160;
let INVERT_FRAMES = 30;

let MIN_DIST = 50;
let MAX_DIST = 300;
let SPEED_MULT_BASE = 1;
let SPEED_MULT_MAX = 10;

let mic, fft;
let vertices = [];
let invertCountdown = 0;

let rotationAngle = 0;
let particles = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  mic = new p5.AudioIn();
  mic.start();
  fft = new p5.FFT();
  fft.setInput(mic);
  regenerarFigura();
}

function regenerarFigura() {
  vertices = [];
  for (let i = 0; i < 20; i++) {
    let v = createVector(random(width), random(height));
    v.dx = random(-1.5, 1.5);
    v.dy = random(-1.5, 1.5);
    vertices.push(v);
  }
}

function draw() {
  let level = mic.getLevel();
  fft.analyze();
  let trebleEnergy = fft.getEnergy(3000, 8000);
  let highVolume = level > HIGH_VOLUME_THRESHOLD;
  let centro = createVector(width / 2, height / 2);

  // Detectar aplauso → invertir colores, regenerar figura, crear explosión
  if (trebleEnergy > TREBLE_THRESHOLD && highVolume) {
    invertCountdown = INVERT_FRAMES;
    regenerarFigura();
    generarExplosion(centro);
  }

  let invertColors = invertCountdown > 0;
  if (invertCountdown > 0) invertCountdown--;

  let estadoRojo = level > AMP_MIN;

  // Estilos visuales según sonido
  if (estadoRojo) {
    background(invertColors ? 0 : color(255, 0, 0));
    noStroke();
    fill(invertColors ? 255 : 255);
  } else {
    background(invertColors ? color(255, 0, 0) : 255);
    stroke(invertColors ? color(255, 0, 0) : 0);
    strokeWeight(invertColors ? 1 : 15);
    noFill();
  }

  // Cálculo de velocidad según sonido
  let speedMult = map(trebleEnergy + level * 100, 0, 265, SPEED_MULT_BASE, SPEED_MULT_MAX);
  speedMult = constrain(speedMult, SPEED_MULT_BASE, SPEED_MULT_MAX);

  // ROTACIÓN: si hay sonido sostenido, aumentar rotación
  if (level > AMP_MIN) {
    rotationAngle += 0.01 * speedMult; // más sonido → más rotación
  }

  // Actualizar vértices
  for (let v of vertices) {
    let distToCenter = p5.Vector.dist(v, centro);
    if (level > AMP_MIN) {
      if (distToCenter > MIN_DIST) {
        let dir = p5.Vector.sub(centro, v).setMag(0.5 * speedMult);
        v.add(dir);
      }
    } else {
      if (distToCenter < MAX_DIST) {
        let dir = p5.Vector.sub(v, centro).setMag(0.3);
        v.add(dir);
      }
    }

    v.x += v.dx * speedMult * 0.7;
    v.y += v.dy * speedMult * 0.7;

    // Bordes
    if (v.x < 0) v.x = width;
    if (v.x > width) v.x = 0;
    if (v.y < 0) v.y = height;
    if (v.y > height) v.y = 0;
  }

  // DIBUJAR FIGURA CON ROTACIÓN
  push();
  translate(centro.x, centro.y);
  rotate(rotationAngle);
  beginShape();
  for (let v of vertices) {
    let offset = p5.Vector.sub(v, centro);
    vertex(offset.x, offset.y);
  }
  endShape(CLOSE);
  pop();

  // DIBUJAR EXPLOSIÓN DE PARTÍCULAS
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].display();
    if (particles[i].alpha <= 0) {
      particles.splice(i, 1);
    }
  }
}

// CREAR PARTÍCULAS PARA LA EXPLOSIÓN
function generarExplosion(centro) {
  for (let i = 0; i < 50; i++) {
    let angle = random(TWO_PI);
    let speed = random(2, 6);
    let vx = cos(angle) * speed;
    let vy = sin(angle) * speed;
    particles.push(new Particula(centro.x, centro.y, vx, vy));
  }
}

// CLASE DE PARTÍCULA
class Particula {
  constructor(x, y, vx, vy) {
    this.pos = createVector(x, y);
    this.vel = createVector(vx, vy);
    this.alpha = 255;
    this.size = random(3, 7);
    this.color = color(random(255), random(255), random(255));
  }

  update() {
    this.pos.add(this.vel);
    this.alpha -= 4; // desvanecerse
  }

  display() {
    noStroke();
    fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], this.alpha);
    ellipse(this.pos.x, this.pos.y, this.size);
  }
}
