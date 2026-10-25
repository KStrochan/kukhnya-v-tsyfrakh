// «Кухня в цифрах»: a pizza assembles on a board as the visitor scrolls.
// Every ingredient lands at the moment its cost line appears in the ledger.
import { cameraPath, seg, textTexture } from './story.js';

export function buildPizza({ THREE, scene, camera, reduced }) {
  // ---------- light & atmosphere ----------
  scene.add(new THREE.HemisphereLight(0xfff3e0, 0x1a2420, 0.55));
  const key = new THREE.DirectionalLight(0xffe2b8, 2.0);
  key.position.set(4, 9, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -6; key.shadow.camera.right = 6; key.shadow.camera.top = 6; key.shadow.camera.bottom = -6;
  key.shadow.radius = 6;
  key.shadow.bias = -0.0008;
  key.shadow.normalBias = 0.03;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xff6a4d, 1.1);
  rim.position.set(-6, 3, -5);
  scene.add(rim);
  const fill = new THREE.PointLight(0xffc98a, 18, 14, 2);
  fill.position.set(-2, 3, 4);
  scene.add(fill);

  // ---------- table & board ----------
  const table = new THREE.Mesh(new THREE.CircleGeometry(30, 64), new THREE.MeshStandardMaterial({ color: 0x141b17, roughness: 0.95 }));
  table.rotation.x = -Math.PI / 2; table.position.y = -0.23; table.receiveShadow = true;
  scene.add(table);

  const woodTex = textTexture((g, w, h) => {
    g.fillStyle = '#5b3a22'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 140; i++) {
      g.strokeStyle = `rgba(${30 + Math.random() * 30},${18 + Math.random() * 14},8,${0.08 + Math.random() * 0.12})`;
      g.lineWidth = 1 + Math.random() * 3;
      g.beginPath();
      const y = Math.random() * h;
      g.moveTo(0, y);
      g.bezierCurveTo(w * 0.3, y + Math.random() * 20 - 10, w * 0.7, y + Math.random() * 20 - 10, w, y + Math.random() * 10 - 5);
      g.stroke();
    }
  }, 512, 512);
  const board = new THREE.Mesh(new THREE.CylinderGeometry(3.25, 3.3, 0.2, 96), new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.8 }));
  board.position.y = -0.125; board.receiveShadow = true; board.castShadow = true;
  scene.add(board);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 0.9), board.material);
  handle.position.set(3.9, -0.125, 0); handle.castShadow = true;
  scene.add(handle);

  const pizza = new THREE.Group();
  scene.add(pizza);

  // ---------- dough with a raised crust (lathe profile) ----------
  const prof = [[0, 0.02], [2.2, 0.03], [2.42, 0.1], [2.56, 0.2], [2.62, 0.17], [2.6, 0.06], [2.5, 0]].map(([x, y]) => new THREE.Vector2(x, y));
  const doughTex = textTexture((g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      const x = Math.random() * w, y = Math.random() * h, r = 2 + Math.random() * 10;
      g.fillStyle = `rgba(150,95,40,${0.03 + Math.random() * 0.07})`;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
  }, 512, 512);
  doughTex.wrapS = doughTex.wrapT = THREE.RepeatWrapping;
  const doughMat = new THREE.MeshStandardMaterial({ color: 0xf3d9a4, roughness: 0.9, map: doughTex });
  const dough = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), doughMat);
  dough.castShadow = true; dough.receiveShadow = true;
  pizza.add(dough);
  const base = new THREE.Mesh(new THREE.CircleGeometry(2.5, 96), doughMat);
  base.rotation.x = -Math.PI / 2; base.position.y = 0.025; base.receiveShadow = true;
  pizza.add(base);

  // ---------- sauce ----------
  const sauce = new THREE.Mesh(new THREE.CircleGeometry(2.3, 96), new THREE.MeshStandardMaterial({ color: 0xb3301c, roughness: 0.45 }));
  sauce.rotation.x = -Math.PI / 2; sauce.position.y = 0.045;
  pizza.add(sauce);

  // ---------- deterministic random so the pizza looks the same for everyone ----------
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const inDisc = (r) => { const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r; return [Math.cos(a) * d, Math.sin(a) * d]; };

  // ---------- mozzarella ----------
  const cheeseMat = new THREE.MeshStandardMaterial({ color: 0xf6e3a8, roughness: 0.42 });
  const cheese = [];
  for (let i = 0; i < 30; i++) {
    const geo = new THREE.SphereGeometry(0.52 + rnd() * 0.26, 28, 14);
    const pa = geo.attributes.position, ph1 = rnd() * 6, ph2 = rnd() * 6;
    for (let v = 0; v < pa.count; v++) {
      const x = pa.getX(v), z = pa.getZ(v), a = Math.atan2(z, x);
      const f = 1 + 0.16 * Math.sin(a * 3 + ph1) + 0.09 * Math.sin(a * 5 + ph2);
      pa.setX(v, x * f); pa.setZ(v, z * f);
    }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, cheeseMat);
    const [x, z] = inDisc(1.85);
    m.userData = { x, z, sy: 0.09 + rnd() * 0.04, delay: rnd() * 0.6, spin: rnd() * 6 };
    m.scale.set(1, 0.1, 1); m.receiveShadow = true;
    pizza.add(m); cheese.push(m);
  }

  // ---------- pepperoni ----------
  const pepMat = new THREE.MeshStandardMaterial({ color: 0x9c2617, roughness: 0.5 });
  const pepTop = new THREE.MeshStandardMaterial({ color: 0xa82e1d, roughness: 0.35 });
  const pep = [];
  const ring = [[0, 0], ...Array.from({ length: 6 }, (_, i) => [Math.cos(i / 6 * Math.PI * 2) * 1.05, Math.sin(i / 6 * Math.PI * 2) * 1.05]),
    ...Array.from({ length: 9 }, (_, i) => [Math.cos((i + 0.5) / 9 * Math.PI * 2) * 1.85, Math.sin((i + 0.5) / 9 * Math.PI * 2) * 1.85])];
  ring.forEach(([x, z], i) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.05, 40), [pepMat, pepTop, pepTop]);
    m.userData = { x, z, delay: i / ring.length * 0.7, tilt: (rnd() - 0.5) * 0.2 };
    m.castShadow = true;
    pizza.add(m); pep.push(m);
  });

  // ---------- basil ----------
  const basilMat = new THREE.MeshStandardMaterial({ color: 0x2f7a35, roughness: 0.4, side: THREE.DoubleSide });
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0); leafShape.quadraticCurveTo(0.22, 0.18, 0, 0.5); leafShape.quadraticCurveTo(-0.22, 0.18, 0, 0);
  const leafGeo = new THREE.ShapeGeometry(leafShape, 12);
  const basil = [];
  [[0.5, 0.5], [-0.8, 0.9], [1.3, -0.6], [-1.4, -0.7], [0.2, -1.4], [-0.3, 1.6], [1.6, 0.9]].forEach(([x, z], i) => {
    const m = new THREE.Mesh(leafGeo, basilMat);
    m.userData = { x, z, rot: rnd() * Math.PI * 2, delay: i / 7 * 0.6 };
    m.castShadow = true;
    pizza.add(m); basil.push(m);
  });

  // ---------- warm steam particles ----------
  const N = 160, pos = new Float32Array(N * 3), seeds = [];
  for (let i = 0; i < N; i++) { const [x, z] = inDisc(2.2); pos.set([x, 0.3, z], i * 3); seeds.push(rnd()); }
  const steamGeo = new THREE.BufferGeometry(); steamGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const steamMat = new THREE.PointsMaterial({ color: 0xfff1d6, size: 0.06, transparent: true, opacity: 0, depthWrite: false });
  const steam = new THREE.Points(steamGeo, steamMat);
  pizza.add(steam);

  const cam = cameraPath([
    { p: 0.00, pos: [0, 7.8, 9.5], look: [0, 0, 0] },
    { p: 0.16, pos: [4.2, 3.2, 5.2], look: [0, 0, 0] },
    { p: 0.34, pos: [-4.4, 2.6, 4.2], look: [0, 0.1, 0] },
    { p: 0.52, pos: [1.2, 3.1, 5.6], look: [0, 0.1, 0.3] },
    { p: 0.68, pos: [4.6, 4.6, 3.4], look: [0, 0, 0] },
    { p: 0.84, pos: [0.01, 10.5, 0.4], look: [0, 0, 0] },
    { p: 1.00, pos: [0, 7.5, 7.5], look: [0, 0, 0] },
  ]);

  return (p, t) => {
    cam(p, camera);
    // dough is there from the start; slow turn adds life
    pizza.rotation.y = reduced ? 0 : t * 0.04 + p * 1.2;

    const s = seg(p, 0.1, 0.24);
    sauce.scale.setScalar(Math.max(0.001, s));
    sauce.material.opacity = s;

    const c = seg(p, 0.26, 0.42);
    cheese.forEach((m) => {
      const k = seg(c, m.userData.delay * 0.6, m.userData.delay * 0.6 + 0.4);
      m.visible = k > 0.001;
      m.position.set(m.userData.x, 0.05 + (1 - k) * 0.6, m.userData.z);
      m.scale.set(0.3 + k * 0.7, m.userData.sy * k + 0.001, 0.3 + k * 0.7);
    });

    const pp = seg(p, 0.44, 0.6);
    pep.forEach((m) => {
      const k = seg(pp, m.userData.delay, m.userData.delay + 0.3);
      m.visible = k > 0.001;
      m.position.set(m.userData.x, 0.14 + (1 - k) * 4, m.userData.z);
      m.rotation.set(m.userData.tilt * k + (1 - k) * 2.5, 0, (1 - k) * 1.5);
    });

    const b = seg(p, 0.6, 0.72);
    basil.forEach((m) => {
      const k = seg(b, m.userData.delay, m.userData.delay + 0.4);
      m.visible = k > 0.001;
      m.position.set(m.userData.x, 0.2 + (1 - k) * 2.5, m.userData.z);
      m.rotation.set(-Math.PI / 2, 0, m.userData.rot + (1 - k) * 3);
      m.scale.setScalar(Math.max(0.001, k));
    });

    // baked: cheese browns slightly, steam rises
    const bake = seg(p, 0.72, 0.84);
    cheeseMat.color.setRGB(0.96 - bake * 0.03, 0.89 - bake * 0.1, 0.66 - bake * 0.2);
    doughMat.color.setRGB(0.95 - bake * 0.12, 0.85 - bake * 0.2, 0.64 - bake * 0.22);
    steamMat.opacity = bake * 0.5;
    const arr = steamGeo.attributes.position.array;
    for (let i = 0; i < N; i++) arr[i * 3 + 1] = 0.3 + ((t * 0.25 + seeds[i]) % 1) * 2.4;
    steamGeo.attributes.position.needsUpdate = true;
  };
}
