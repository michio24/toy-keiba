// 海底パール記念
'use strict';

/* ---- 海底パール記念：バーレーンの真珠採り（世界遺産「真珠採り、島の経済の証し」）を下敷きにした海の底 ---- */
// 見立て：ペルシャ湾の浅い海の底を走る。海面には真珠採りの船が浮かび、潜り手が綱を伝って真珠貝の海床へ潜る。
// 区間の役割：1 ブー・マーヒル砦（真珠採りの船出の浜）と発走／2 ハイル・ブー・アマーマの真珠貝の海床（最深部）と真珠採りの船・潜り手／
// 3 入り江のくびれの浅瀬とハドラ（杭と網の定置漁具）／4 パール海流（回遊魚の群れとウミガメ）とダイブ・バーレーンの沈められたジャンボ機／
// 5 海草の藻場とジュゴン、沈められた真珠商人の家／6 ファシュト・アル＝アズムの珊瑚礁とイソギンチャク／0 ムハッラクの真珠商人の家並みのホーム直線。
// 内馬場は砂の海底と、ゴールで口を開く大真珠貝（ファンタジーの演出）
const SEA_U = { time: { value: 0 } };
// 海面の揺らぎが海底に落とす光の網（コースティクス）。材質の発光に、世界座標で揺れる光を足す
function seaCaustics(mat, k = 1) {
  mat.onBeforeCompile = sh => {
    sh.uniforms.uSeaTime = SEA_U.time; sh.uniforms.uSeaCaus = { value: k };
    sh.vertexShader = 'varying vec3 vSeaPos;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvSeaPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = 'uniform float uSeaTime, uSeaCaus;\nvarying vec3 vSeaPos;\n' +
      // 水面の光の網（よく知られた反復式）。約11mで繰り返す
      'float seaCaus(vec2 q, float t) {\n  vec2 p = mod(q * 0.55, 6.28318) - 250.0, i = p; float c = 1.0;\n' +
      '  for (int n = 0; n < 4; n++) { float tt = t * 0.45 * (1.0 - 3.5 / float(n + 1)); i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));\n' +
      '    c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / 0.005), p.y / (cos(i.y + tt) / 0.005))); }\n' +
      '  c = 1.17 - pow(c / 4.0, 1.4); return clamp(pow(abs(c), 8.0), 0.0, 1.0);\n}\n' +
      sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(0.42, 0.62, 0.6) * uSeaCaus * seaCaus(vSeaPos.xz, uSeaTime);');
  };
  mat.customProgramCacheKey = () => 'seaCaustics';
  mat.needsUpdate = true;
  return mat;
}
// 水の揺れ：根元（局所 y = base）を固定し、先端ほど大きく揺らす（海草・イソギンチャクの触手・ウミウチワ）。amp は先端の振れ幅（m）
function seaSway(mat, amp, base = -0.5, height = 1, speed = 1.3) {
  mat.onBeforeCompile = sh => {
    sh.uniforms.uSeaTime = SEA_U.time; sh.uniforms.uSwayAmp = { value: amp };
    sh.vertexShader = 'uniform float uSeaTime, uSwayAmp;\n' + sh.vertexShader.replace('#include <project_vertex>', `vec4 mvPosition = vec4(transformed, 1.0);
vec3 swayAt = vec3(0.0);
#ifdef USE_INSTANCING
  mvPosition = instanceMatrix * mvPosition; swayAt = instanceMatrix[3].xyz;
#endif
float swayK = clamp((position.y - (${base.toFixed(2)})) / ${height.toFixed(2)}, 0.0, 1.0); swayK *= swayK;
float swayPh = uSeaTime * ${speed.toFixed(2)} + swayAt.x * 0.13 + swayAt.z * 0.09;
mvPosition.x += sin(swayPh) * uSwayAmp * swayK; mvPosition.z += cos(swayPh * 0.8 + 1.3) * uSwayAmp * 0.6 * swayK;
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`);
  };
  mat.customProgramCacheKey = () => 'seaSway' + base + '/' + height + '/' + speed;
  return mat;
}
function decorPearlOcean() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const { shuffle, occupied, taken, clearAt, groundAt, onGround, local, at, scatter, label, site, PRISM, CYL, addInst, herd } = sceneryKit();
  // 案内板は深い海の青に真珠色の文字
  const signAt = (g, text, y, w = 14) => { const sp = label(text, w, w / 4, '#123f5c', '#f6eef6'); sp.position.set(0, y, 0); sp.scale.set(w, w / 4, 1); g.add(sp); return sp; };
  const SURF = 95, radius = track.extent + 170, updates = [];
  const coralStone = toon('#e3d5b5'), coralStone2 = toon('#cdbb95'), teak = toon('#7a5536'), darkTeak = toon('#4f3826');
  const skin = toon('#8a5a3c'), cloth = toon('#f2efe6'), rope = toon('#c9b48a'), win = toon('#2d3b40');
  const pearlMat = toon('#fff4fa', { emissive: C('#d9c6e0'), emissiveIntensity: 0.35 });
  const updatesBubbles = [];
  // 泡：海の底から海面へ、揺れながら昇る（dustP は重力の向きを逆にして使う）
  const bubbleCol = C('#e6fcff');
  const bubble = (x, y, z, size = 0.35) => dustP.emit(x, y, z, rand(-0.25, 0.25), rand(1.6, 2.6), rand(-0.25, 0.25), rand(2.5, 4), size, bubbleCol, -0.6, 0.3);
  // 魚の形：胴（局所 +x が頭）と尾びれ。同じ行列で2つのインスタンスを動かす
  const fishBody = new THREE.SphereGeometry(1, 8, 6); fishBody.scale(1, 0.42, 0.24);
  const fishTail = new THREE.BufferGeometry(); fishTail.setAttribute('position', new THREE.Float32BufferAttribute([-0.85, 0, 0, -1.6, 0.45, 0, -1.6, -0.45, 0], 3)); fishTail.computeVertexNormals();
  // 帯模様の魚は、球の極を頭と尾に向けて、テクスチャの横縞を胴の輪にする
  const bandBody = new THREE.SphereGeometry(1, 12, 10); bandBody.rotateZ(Math.PI / 2); bandBody.scale(1, 0.42, 0.24);
  const school = (n, cols, size, bands) => {
    const mats = [toon('#ffffff', bands ? { map: bands } : {}), toon(bands ? '#f0782c' : '#ffffff', { side: THREE.DoubleSide })];
    const list = Array.from({ length: n }, (_, i) => ({ p: new V3(), s: new V3(size, size, size), c: C(cols[i % cols.length]) }));
    const meshes = [bands ? bandBody : fishBody, fishTail].map((geo, k) => { const m = fantasyInst(geo, mats[k], list, false); m.userData.droneIgnore = true; m.frustumCulled = false; return m; });
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new V3(size, size, size);
    // set(i, 位置, 向き yaw, 傾き pitch)
    return { meshes, set(i, p, yaw, pitch = 0) { m4.compose(p, q.setFromEuler(e.set(0, yaw, pitch, 'YZX')), sc); meshes.forEach(m => m.setMatrixAt(i, m4)); }, done() { meshes.forEach(m => { m.instanceMatrix.needsUpdate = true; }); }, count: () => meshes[0].count };
  };
  // 小さな群れ：中心 c のまわりを輪になって泳ぐ
  const swirl = (c, n, r, cols, size = 0.5, speed = 0.5) => {
    const sc = school(n, cols, size), ph = Array.from({ length: n }, () => [rand(0, Math.PI * 2), rand(0.7, 1.15), rand(-1, 1)]);
    updates.push(t => {
      const m = reduced.matches ? 0 : t, k = sc.count();
      for (let i = 0; i < k; i++) { const [a0, rr, h] = ph[i], a = a0 + m * speed / rr; sc.set(i, new V3(c.x + Math.cos(a) * r * rr, c.y + h * r * 0.35 + Math.sin(m + a0) * 0.4, c.z + Math.sin(a) * r * rr), -a - Math.PI / 2); }
      sc.done();
    });
    return sc;
  };

  /* ---- 海面と光の柱：見上げると揺れる海面と、斜めに差し込む光 ---- */
  {
    // 海面のさざ波：ボロノイの境目を明るくした網目（端でつながる繰り返し模様）
    const waveTex = ctex(128, 128, c => {
      const pts = Array.from({ length: 22 }, () => [rand(0, 128), rand(0, 128)]), img = c.createImageData(128, 128);
      for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
        let f1 = 1e9, f2 = 1e9;
        for (const [px, py] of pts) { const dx = Math.min(Math.abs(x - px), 128 - Math.abs(x - px)), dy = Math.min(Math.abs(y - py), 128 - Math.abs(y - py)), d = Math.hypot(dx, dy); if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d; }
        const k = Math.max(0, 1 - (f2 - f1) / 9) ** 2 * 0.75 + Math.max(0, 1 - f1 / 40) * 0.12, i = (y * 128 + x) * 4;
        img.data[i] = 112 + k * 120; img.data[i + 1] = 200 + k * 50; img.data[i + 2] = 214 + k * 41; img.data[i + 3] = 255;
      }
      c.putImageData(img, 0, 0);
    }, true);
    waveTex.repeat.set(160, 160);
    const surface = new THREE.Mesh(new THREE.PlaneGeometry(3200, 3200), new THREE.MeshBasicMaterial({ map: waveTex, transparent: true, opacity: 0.72, side: THREE.DoubleSide, depthWrite: false }));
    surface.rotation.x = Math.PI / 2; surface.position.y = SURF; surface.renderOrder = 1; surface.userData.droneIgnore = true; world.add(surface);
    // 光の柱：上が明るく下へ消える帯を十字に組み、太陽の向きへ少し傾ける
    const rayTex = ctex(64, 256, c => {
      const v = c.createLinearGradient(0, 0, 0, 256); v.addColorStop(0, 'rgba(255,255,255,1)'); v.addColorStop(0.55, 'rgba(255,255,255,.3)'); v.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = v; c.fillRect(0, 0, 64, 256); c.globalCompositeOperation = 'destination-in';
      const h = c.createLinearGradient(0, 0, 64, 0); h.addColorStop(0, 'rgba(0,0,0,0)'); h.addColorStop(0.5, 'rgba(0,0,0,1)'); h.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = h; c.fillRect(0, 0, 64, 256);
    }, false);
    const rayGeo = new THREE.PlaneGeometry(1, 1); rayGeo.translate(0, -0.5, 0);
    const rayMat = new THREE.MeshBasicMaterial({ map: rayTex, color: C('#c9fbff'), transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
    const rays = [];
    for (let i = 0; i < 22; i++) {
      const a = rand(0, Math.PI * 2), r = Math.sqrt(Math.random()) * (track.extent + 40), g = fantasyGroup(new V3(Math.cos(a) * r, SURF, Math.sin(a) * r));
      const w = rand(6, 16);
      for (const y of [0, Math.PI / 2]) { const m = new THREE.Mesh(rayGeo, rayMat); m.scale.set(w, SURF + 12, 1); m.rotation.y = y; g.add(m); }
      g.rotation.set(0.12, rand(0, Math.PI), 0.22); g.userData.droneIgnore = true; rays.push({ g, ph: rand(0, 6) });
      if (i % 2) themeDetails.push(g);
    }
    updates.push(t => {
      const m = reduced.matches ? 0 : t;
      waveTex.offset.set(m * 0.004, m * 0.0025);
      rays.forEach(({ g, ph }) => { g.rotation.z = 0.22 + Math.sin(m * 0.25 + ph) * 0.06; });
      rayMat.opacity = 0.12 + Math.sin(m * 0.8) * 0.025;
    });
  }

  /* ---- 第1区間：ブー・マーヒル砦（ムハッラク島の南端、真珠採りの船が出ていった浜の砦） ---- */
  {
    const g = site('ブー・マーヒル砦', at(1, 0.28), W / 2 + 30, 26, 24, '#d8cfae');
    // 珊瑚石を積み、しっくいで仕上げた低い城壁と、四隅の塔（海側の角は円い塔）
    for (const [x, z, w, d] of [[0, -10, 22, 2], [0, 10, 22, 2], [-10, 0, 2, 22], [10, 0, 2, 22]]) addBox(g, [w, 6, d], [x, 3, z], coralStone, null, 0.02);
    const merlons = [];
    for (let k = -10; k <= 10; k += 2) for (const [x, z] of [[k, -10], [k, 10], [-10, k], [10, k]]) merlons.push({ p: g.localToWorld(new V3(x, 6.5, z)), s: new V3(0.9, 1, 0.9), r: [0, g.rotation.y, 0] });
    addInst(BOX, coralStone, merlons, false);
    part(g, CYL, coralStone, [-10, 4.5, -10], [3.4, 9, 3.4], null, 0.02); part(g, CYL, coralStone2, [-10, 9.4, -10], [3.7, 0.8, 3.7], null, 0);
    for (const [x, z] of [[10, -10], [-10, 10], [10, 10]]) addBox(g, [4.6, 8, 4.6], [x, 4, z], coralStone, null, 0.02);
    addBox(g, [3, 4, 0.3], [0, 2, -11.1], darkTeak);
    for (const x of [-6, 6]) addBox(g, [0.6, 1.4, 0.2], [x, 4.4, -11.05], win);
    // 浜に引き上げた小舟と、砂に半ば埋もれた錨
    const boat = new THREE.Group(); boat.position.set(-4, 0.8, -15); boat.rotation.set(0, 0.4, 0.25); g.add(boat);
    part(boat, SPH_LO, teak, [0, 0, 0], [5, 1.1, 1.5], null, 0.04); addBox(boat, [9, 0.2, 2.4], [0, 0.6, 0], darkTeak);
    part(g, new THREE.TorusGeometry(1.2, 0.18, 6, 16, Math.PI), toon('#5b4a42'), [6, 0.4, -14], null, [0, 0, Math.PI], 0);
    addBox(g, [0.25, 3, 0.25], [6, 1.5, -14], toon('#5b4a42'));
    signAt(g, 'ブー・マーヒル砦（真珠採りの船出の地）', 15, 19);
  }

  /* ---- 第2区間（最深部）：ハイル・ブー・アマーマの真珠貝の海床と、海面に浮かぶ真珠採りの船 ---- */
  let opened = [];
  {
    // 真珠貝の海床：灰色がかった貝が岩に寄り集まる。ところどころ口を開いた貝の中に真珠
    const shells = [], rocks = [];
    const bed = scatter(70, at(1, 0.85), at(3, 0.15), -(W / 2 + 70), W / 2 + 70, W / 2 + 4, 0).concat(scatter(25, at(2, 0.1), at(2, 0.9), W / 2 + 70, W / 2 + 130, W / 2 + 4, 0));
    for (const c of bed) {
      rocks.push({ p: c.clone().add(new V3(0, 0.2, 0)), s: new V3(rand(1.2, 2.6), rand(0.5, 1), rand(1.2, 2.4)), r: [0, rand(0, 3), 0], c: C(['#8c8576', '#9a9282', '#7d786c'][(Math.random() * 3) | 0]) });
      for (let k = 0; k < 7; k++) {
        const a = rand(0, Math.PI * 2), r = rand(0.4, 3.2), p = c.clone().add(new V3(Math.cos(a) * r, 0, Math.sin(a) * r)); onGround(p, 0.25);
        shells.push({ p, s: new V3(0.5, 0.17, 0.42).multiplyScalar(rand(0.8, 1.3)), r: [rand(-0.5, 0.5), rand(0, 3), rand(-0.5, 0.5)], c: C(['#8f8a90', '#a59a8a', '#7d7480', '#b0a594', '#8a8f86'][(Math.random() * 5) | 0]) });
      }
    }
    addInst(SPH_LO, toon('#ffffff'), shuffle(rocks)); addInst(SPH_LO, toon('#ffffff'), shuffle(shells), false);
    // 口を開いた真珠貝：殻の内側の真珠層と、ひと粒の真珠。ときどき口を閉じる
    const nacre = toon('#f2e8f4', { emissive: C('#c7d9f0'), emissiveIntensity: 0.25 });
    for (const c of shuffle(bed.slice()).slice(0, 14)) {
      const g = fantasyGroup(onGround(c.clone().add(new V3(rand(-1, 1), 0, rand(-1, 1))), 0.2)); g.rotation.y = rand(0, Math.PI * 2); g.scale.setScalar(rand(1.1, 1.6));
      part(g, new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), toon('#958c94'), [0, 0.3, 0], [0.9, 0.3, 0.8], null, 0.04);
      part(g, new THREE.CircleGeometry(0.85, 14), nacre, [0, 0.31, 0], [1, 0.9, 1], [-Math.PI / 2, 0, 0], 0);
      part(g, SPH_LO, pearlMat, [0, 0.45, 0.1], [0.17, 0.17, 0.17], null, 0);
      const lid = new THREE.Group(); lid.position.set(0, 0.3, 0.75); g.add(lid);
      part(lid, new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), toon('#857c86'), [0, 0, -0.75], [0.9, 0.28, 0.8], null, 0.04);
      opened.push({ lid, ph: rand(0, 20) }); themeDetails.push(g); lid.userData.droneIgnore = true;
    }
    const sign = site('ハイル・ブー・アマーマ', at(2, 0.5), -(W / 2 + 26), 10, 8, '#d8cfae', W / 2 + 6);
    part(sign, SPH_LO, toon('#958c94'), [0, 1, 0], [3, 1, 2.6], null, 0.04); part(sign, SPH_LO, pearlMat, [0, 2.2, 0], [1, 1, 1], null, 0);
    signAt(sign, 'ハイル・ブー・アマーマ（真珠貝の海床）', 8, 19);
  }
  // 真珠採りの船（ジャールブート）：海面に浮かぶ船底を下から見上げる。長い櫂と、潜り手の綱
  const divers = [];
  {
    const hullMat = toon('#7a5536'), sail = toon('#efe6d2', { side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    const sailGeo = new THREE.BufferGeometry(); sailGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 9, 3, 0, -6, 13, 0], 3)); sailGeo.computeVertexNormals();
    const ropeGeo = new THREE.CylinderGeometry(0.05, 0.05, 1, 4); ropeGeo.translate(0, 0.5, 0);
    const stoneMat = toon('#6f6a62'), basketMat = toon('#b79a62');
    [[0.22, 34], [0.55, 52], [0.85, 30]].forEach(([t, v], k) => {
      const f = tp(at(2, t), W / 2 + v), boat = fantasyGroup(new V3(f.v.x, SURF - 1.2, f.v.z)); boat.rotation.y = -f.h + rand(-0.4, 0.4);
      registerLandmark(boat, '真珠採りの船'); boat.updateMatrixWorld(true);
      part(boat, SPH_LO, hullMat, [0, 0, 0], [12, 2.4, 3.4], null, 0.04); addBox(boat, [1.5, 1.2, 0.3], [12.5, 0.2, 0], darkTeak, [0, 0, 0.5]);
      part(boat, CYL, darkTeak, [0, -1.7, 0], [0.25, 1.6, 0.25], null, 0);
      addBox(boat, [17, 0.25, 0.4], [0, -2.3, 0], darkTeak);
      // 帆柱と三角帆（ラティーンセイル）は海面の上に透けて見える
      part(boat, CYL, darkTeak, [1, 8, 0], [0.3, 16, 0.3], null, 0); const s = new THREE.Mesh(sailGeo, sail); s.position.set(-2, 3, 0.4); boat.add(s);
      // 長い櫂：両舷の船べりから、斜め下の海へ差し込む
      for (let j = 0; j < 4; j++) for (const sd of [-1, 1]) part(boat, CYL, teak, [-6 + j * 4, -1.5, sd * 6.5], [0.16, 9, 0.16], [-sd * 0.95, 0, 0], 0);
      // 潜り手：舷側から綱を下ろし、石の錘（ハジャル）で一気に沈む。貝を籠（ディーン）に集め、綱を引いて合図すると引き上げられる
      for (const sd of [-1, 1]) {
        const top = boat.localToWorld(new V3(sd * 2.5 - 1, -1, sd * 2.2)), floor = groundAt(top) + 0.4;
        const d = new THREE.Group(); d.position.set(top.x, floor, top.z); d.rotation.y = rand(0, Math.PI * 2); world.add(d);
        const body = new THREE.Group(); d.add(body);
        part(body, new THREE.CapsuleGeometry(0.32, 0.8, 4, 8), skin, [0, 1.55, 0], null, null, 0.04); part(body, SPH_LO, skin, [0, 2.5, 0], [0.3, 0.32, 0.3], null, 0.04);
        addBox(body, [0.7, 0.35, 0.42], [0, 1.05, 0], cloth); addBox(body, [0.12, 0.08, 0.1], [0, 2.47, 0.3], toon('#2a2522'));
        part(body, new THREE.CylinderGeometry(0.35, 0.28, 0.5, 8, 1, true), basketMat, [0, 1.6, 0.42], null, null, 0);
        const legs = [-1, 1].map(x => { const l = new THREE.Group(); l.position.set(x * 0.17, 0.95, 0); body.add(l); part(l, new THREE.CapsuleGeometry(0.13, 0.75, 3, 6), skin, [0, -0.5, 0], null, null, 0); return l; });
        const arms = [-1, 1].map(x => { const a = new THREE.Group(); a.position.set(x * 0.42, 2.05, 0); body.add(a); part(a, new THREE.CapsuleGeometry(0.11, 0.7, 3, 6), skin, [0, -0.45, 0], null, null, 0); return a; });
        const line = new THREE.Mesh(ropeGeo, rope); world.add(line);
        const stone = new THREE.Group(); world.add(stone); part(stone, SPH_LO, stoneMat, [0, 0, 0], [0.45, 0.35, 0.4], null, 0);
        const sLine = new THREE.Mesh(ropeGeo, rope); world.add(sLine);
        [d, line, stone, sLine].forEach(o => { o.userData.droneIgnore = true; });
        divers.push({ d, body, legs, arms, line, stone, sLine, top, floor, ph: rand(0, 1) + k * 0.33 + (sd > 0 ? 0.5 : 0) });
      }
    });
    updates.push((t, dt) => {
      const m = reduced.matches ? 3 : t;
      for (const v of divers) {
        // 一周 26 秒：沈む（0〜0.12）・貝を集める（〜0.55）・引き上げられる（〜0.7）・海面で息を整える（〜1）
        const u = mod(m / 26 + v.ph, 1), high = SURF - 2.6;
        let y, pose;
        if (u < 0.12) { y = lerp(high, v.floor, THREE.MathUtils.smoothstep(u / 0.12, 0, 1)); pose = 0; }
        else if (u < 0.55) { y = v.floor; pose = 1; }
        else if (u < 0.7) { y = lerp(v.floor, high, THREE.MathUtils.smoothstep((u - 0.55) / 0.15, 0, 1)); pose = 2; }
        else { y = high + Math.sin(m * 1.3 + v.ph * 9) * 0.2; pose = 3; }
        v.d.position.y = y;
        // 海の底では前かがみで両手を動かし、昇るときは綱を握って足をそろえる
        v.body.rotation.x = pose === 1 ? 0.9 + Math.sin(m * 0.7 + v.ph) * 0.1 : 0;
        v.body.position.y = pose === 1 ? -0.5 : 0;
        v.arms.forEach((a, i) => { a.rotation.x = pose === 1 ? -1.2 + Math.sin(m * 3 + i * 2) * 0.5 : pose === 3 ? -0.3 : -2.9; a.rotation.z = (i ? -1 : 1) * (pose === 3 ? 0.3 : 0.05); });
        v.legs.forEach((l, i) => { l.rotation.x = pose === 1 ? 1 : pose === 3 ? Math.sin(m * 2 + i * Math.PI) * 0.35 : 0; });
        // 命綱：舷側から潜り手の手まで
        const hand = y + (pose === 1 ? 1.4 : 2.8);
        v.line.position.set(v.top.x, hand, v.top.z); v.line.scale.y = Math.max(0.1, v.top.y - hand);
        // 錘の石：沈むときは足元、海の底に着くと舟の上へ引き上げられる
        const sy = u < 0.12 ? y + 0.3 : u < 0.3 ? lerp(v.floor + 0.3, v.top.y, (u - 0.12) / 0.18) : v.top.y;
        const sx = v.top.x + 1.2, sz = v.top.z;
        v.stone.position.set(sx, sy, sz); v.stone.visible = sy < v.top.y - 0.2;
        v.sLine.position.set(sx, sy, sz); v.sLine.scale.y = Math.max(0.05, v.top.y - sy); v.sLine.visible = v.stone.visible;
        // 息の泡：海の底と昇る途中で
        if (!reduced.matches && (pose === 1 || pose === 2) && Math.random() < dt * (lightQuality() ? 1.5 : 4)) bubble(v.d.position.x, y + 2.4, v.d.position.z, 0.3);
      }
      opened.forEach(({ lid, ph }) => { const u = mod((reduced.matches ? 0 : t) / 9 + ph, 1); lid.rotation.x = (u < 0.8 ? 0.85 : 0.85 * (1 - Math.sin((u - 0.8) / 0.2 * Math.PI))); });
    });
  }

  /* ---- 第3区間：入り江のくびれの浅瀬と、ハドラ（杭と網で魚を囲い込む、バーレーンの伝統の定置漁具） ---- */
  {
    const g = site('ハドラ', at(3, 0.5), W / 2 + 30, 30, 36, '#d8cfae');
    // 岸から沖へ延びる長い垣（導き垣）と、その先の矢じり形の囲い。いちばん奥の小部屋に魚がたまる
    const pts = [[0, 17], [0, 2]], heart = [];
    for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2, x = 16 * Math.pow(Math.sin(a), 3) * 0.6, z = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a)) * 0.55 - 6; heart.push([x, z]); }
    const posts = [], nets = [], netMat = toon('#9a8f6e', { transparent: true, opacity: 0.55, side: THREE.DoubleSide, map: ctex(64, 64, c => { c.clearRect(0, 0, 64, 64); c.strokeStyle = '#ffffff'; c.lineWidth = 2; for (let k = 0; k <= 64; k += 8) { c.beginPath(); c.moveTo(k, 0); c.lineTo(k, 64); c.moveTo(0, k); c.lineTo(64, k); c.stroke(); } }, true) });
    netMat.map.repeat.set(4, 1); netMat.alphaTest = 0.1;
    for (const line of [pts, heart]) for (let i = 0; i < line.length - 1; i++) {
      const [x0, z0] = line[i], [x1, z1] = line[i + 1], n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / 1.8));
      for (let j = 0; j < n; j++) { const p = g.localToWorld(new V3(lerp(x0, x1, j / n), 0, lerp(z0, z1, j / n))); posts.push({ p: onGround(p, 2.2), s: new V3(0.18, 4.4, 0.18) }); }
      const a = g.localToWorld(new V3(x0, 0, z0)), b = g.localToWorld(new V3(x1, 0, z1)), mid = a.clone().lerp(b, 0.5);
      nets.push({ p: onGround(mid, 1.8), s: new V3(a.distanceTo(b), 3.4, 0.05), r: [0, -Math.atan2(b.z - a.z, b.x - a.x), 0] });
    }
    addInst(CYL, toon('#6d5238'), posts); addInst(BOX, netMat, nets, false);
    const fishC = g.localToWorld(new V3(0, 0, -12)); fishC.y = groundAt(fishC) + 1.6;
    swirl(fishC, 14, 2.6, ['#c9d3d8', '#e2c46a', '#b7c4cc'], 0.45, 0.7);
    signAt(g, 'ハドラ（杭と網の定置漁具）', 9, 15);
  }

  /* ---- 第4区間：パール海流。流れに乗る回遊魚の群れとアオウミガメ ---- */
  const current = track.zones[0];
  if (current) {
    const n = 90, sc = school(n, ['#c6d4dc', '#9fb6c4', '#e4eef2', '#7fa3b8'], 0.55), len = current.end - current.start + 60;
    const fish = Array.from({ length: n }, (_, i) => ({ u: rand(0, len), lane: (i % 2 ? 1 : -1) * rand(3, 9) + (i % 2 ? W : 0), y: rand(1.5, 8), w: rand(0, 6) }));
    const turtles = [0, 1, 2].map(i => {
      const g = fantasyGroup(); g.userData.droneIgnore = true;
      part(g, SPH_LO, toon('#6b7a4a'), [0, 0, 0], [1.9, 0.6, 1.5], null, 0.04); part(g, SPH_LO, toon('#d9c99a'), [0, -0.2, 0], [1.7, 0.4, 1.35], null, 0);
      part(g, SPH_LO, toon('#8d9a6a'), [2, 0.1, 0], [0.55, 0.45, 0.45], null, 0.04);
      const fl = [-1, 1].map(sd => { const f = new THREE.Group(); f.position.set(0.8, 0, sd * 1.2); g.add(f); part(f, SPH_LO, toon('#8d9a6a'), [0.2, 0, sd * 1], [0.7, 0.12, 1.2], [0, sd * 0.5, 0], 0); return f; });
      for (const sd of [-1, 1]) part(g, SPH_LO, toon('#8d9a6a'), [-1.6, -0.1, sd * 0.7], [0.5, 0.1, 0.35], null, 0);
      return { g, fl, u: i / 3 * len, lane: i === 1 ? -6 : W + 6, y: 4 + i };
    });
    updates.push(t => {
      const m = reduced.matches ? 0 : t, k = sc.count(), sp = current.motion * 1.2;
      for (let i = 0; i < k; i++) {
        const f = fish[i], s = current.start - 30 + mod(f.u + m * sp, len), p = track.pos(s, f.lane + Math.sin(m * 0.9 + f.w) * 0.6);
        sc.set(i, new V3(p.x, p.y + f.y + Math.sin(m * 1.7 + f.w) * 0.3, p.z), -p.h);
      }
      sc.done();
      turtles.forEach(o => {
        const s = current.start - 30 + mod(o.u + m * current.motion * 0.7, len), p = track.pos(s, o.lane);
        o.g.position.set(p.x, p.y + o.y + Math.sin(m * 0.6 + o.u) * 0.5, p.z); o.g.rotation.y = -p.h;
        o.fl.forEach((f, i) => { f.rotation.x = Math.sin(m * 2.2) * 0.45 * (i ? 1 : -1); });
      });
    });
  }

  /* ---- 第4区間：ダイブ・バーレーン（2019年開園の海中テーマパーク）に沈められたジャンボ機 ---- */
  {
    const g = site('沈められたジャンボ機', at(4, 0.6), W / 2 + 46, 56, 48, '#d8cfae');
    const jet = new THREE.Group(); jet.position.set(0, 3.6, 4); jet.rotation.set(0, 0.25, 0.06); g.add(jet);
    const hull = toon('#e9ece6'), stripe = toon('#5a7fa0'), grow = toon('#ffffff');
    // 胴体（-x が機首）と、機首の上の2階席のこぶ
    part(jet, CYL, hull, [0, 0, 0], [3.3, 50, 3.3], [0, 0, Math.PI / 2], 0.02);
    part(jet, SPH_LO, hull, [-25, 0, 0], [4.2, 3.3, 3.3], null, 0.02); part(jet, SPH_LO, hull, [-17, 2.6, 0], [10, 2.1, 2.4], null, 0.02);
    part(jet, new THREE.ConeGeometry(1, 1, 10), hull, [27.5, 0.6, 0], [3, 7, 3], [0, 0, -Math.PI / 2], 0.02);
    addBox(jet, [50, 0.6, 0.1], [0, 0.4, 3.32], stripe); addBox(jet, [50, 0.6, 0.1], [0, 0.4, -3.32], stripe);
    for (let x = -21; x <= 22; x += 1.5) for (const z of [3.34, -3.34]) addBox(jet, [0.5, 0.6, 0.06], [x, 1.4, z], win);
    // 後退翼と4基のエンジン、尾翼
    for (const sd of [-1, 1]) {
      addBox(jet, [9, 0.6, 22], [2 + 5, -1.2, sd * 13], hull, [0, sd * 0.45, 0], 0.02);
      for (const r of [8, 15]) { part(jet, CYL, toon('#cfd3cf'), [2 + r * 0.45, -2.6, sd * r], [1.1, 4.2, 1.1], [0, 0, Math.PI / 2], 0.02); }
      addBox(jet, [5, 0.4, 7], [24, 1, sd * 5], hull, [0, sd * 0.4, 0], 0.02);
    }
    addBox(jet, [7, 9, 0.5], [24.5, 5.5, 0], hull, [0, 0, -0.35], 0.02); addBox(jet, [3, 5, 0.55], [26, 6.5, 0], stripe, [0, 0, -0.35]);
    // 胴体に付いた珊瑚と海綿、まわりに群れる魚
    g.updateMatrixWorld(true); const growth = [];
    for (let i = 0; i < 110; i++) { const x = rand(-24, 24), a = rand(-1.3, 1.3); growth.push({ p: jet.localToWorld(new V3(x, Math.cos(a) * 3.25, Math.sin(a) * 3.25)), s: new V3(1, 0.6, 1).multiplyScalar(rand(0.2, 0.45)), c: C(['#c97a8e', '#d9a066', '#9a86c2', '#6fae84', '#b08a6a'][i % 5]) }); }
    addInst(SPH_LO, grow, growth, false);
    swirl(g.localToWorld(new V3(-6, 9, 4)), 26, 7, ['#f2d24e', '#e9eef0', '#5fa8d8'], 0.55, 0.35);
    signAt(g, 'ダイブ・バーレーンの沈められたジャンボ機', 17, 20);
  }

  /* ---- 第5区間：海草の藻場とジュゴン（バーレーンの海は世界有数のジュゴンの生息地） ---- */
  const dugongs = [];
  {
    const blades = [], bladeMat = seaSway(toon('#ffffff'), 0.5);
    const meadow = scatter(46, at(4, 0.9), at(6, 0.2), -(W / 2 + 60), -(W / 2 + 5), W / 2 + 3, 0).concat(scatter(34, at(5, 0), at(5, 1), W / 2 + 6, W / 2 + 70, W / 2 + 3, 0))
      .concat(scatter(40, 0, track.L, -(W / 2 + 90), W / 2 + 110, W / 2 + 4, 0));
    for (const c of meadow) for (let k = 0; k < 30; k++) {
      const a = rand(0, Math.PI * 2), r = Math.sqrt(Math.random()) * 3.6, p = onGround(c.clone().add(new V3(Math.cos(a) * r, 0, Math.sin(a) * r))), h = rand(1, 2.4);
      if (!clearAt(p.x, p.z, W / 2 + 2)) continue;
      blades.push({ p: p.add(new V3(0, h / 2, 0)), s: new V3(0.22, h, 0.05), r: [0, rand(0, 3), 0], c: C(['#3f7a3e', '#557f3a', '#2f6a40', '#6b8a45'][(Math.random() * 4) | 0]) });
    }
    addInst(BOX, bladeMat, shuffle(blades), false);
    // ジュゴン：藻場の上をゆっくり進み、鼻先を下げて海草を食む
    const grey = toon('#9a8f86'), belly = toon('#c2b6a8');
    for (let i = 0; i < 3; i++) {
      const c = onGround(local(at(5, 0.25 + i * 0.25), 0, i === 1 ? W / 2 + 26 : -(W / 2 + 28))), g = fantasyGroup(); g.userData.droneIgnore = true;
      part(g, SPH_LO, grey, [0, 0, 0], [2.6, 0.95, 1.05], null, 0.04); part(g, SPH_LO, belly, [0, -0.35, 0], [2.3, 0.6, 0.9], null, 0);
      part(g, SPH_LO, grey, [2.5, -0.25, 0], [0.75, 0.6, 0.65], [0, 0, -0.5], 0.04);
      const fluke = new THREE.Group(); fluke.position.set(-2.4, 0, 0); g.add(fluke); addBox(fluke, [1, 0.15, 2.6], [-0.5, 0, 0], grey);
      for (const sd of [-1, 1]) part(g, SPH_LO, grey, [1.2, -0.5, sd * 0.9], [0.55, 0.12, 0.3], [0, sd * 0.6, 0], 0);
      dugongs.push({ g, fluke, c, r: 6 + i * 2, ph: i * 2.1 });
      if (i) themeDetails.push(g);
    }
    const sign = site('ジュゴンの藻場', at(5, 0.15), -(W / 2 + 16), 6, 6, '#d8cfae', W / 2 + 6);
    signAt(sign, 'ジュゴンの藻場（海草の草原）', 6, 14);
    updates.push(t => {
      const m = reduced.matches ? 0 : t;
      dugongs.forEach(({ g, fluke, c, r, ph }) => {
        const a = m * 0.06 + ph, x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
        g.position.set(x, track.groundH(x, z) + 1.6 + Math.sin(m * 0.5 + ph) * 0.15, z); g.rotation.set(0, -a - Math.PI / 2, -0.25);
        fluke.rotation.z = Math.sin(m * 1.4 + ph) * 0.3;
      });
    });
  }

  /* ---- 第5区間：沈められた真珠商人の家（ダイブ・バーレーンに沈めた、伝統の家のレプリカ） ---- */
  {
    const g = site('沈められた真珠商人の家', at(5, 0.6), W / 2 + 30, 18, 16, '#d8cfae');
    const house = new THREE.Group(); house.rotation.z = 0.04; g.add(house);
    addBox(house, [14, 9, 11], [0, 4.5, 0], coralStone2, null, 0.02);
    addBox(house, [14.4, 0.6, 11.4], [0, 9.2, 0], coralStone);
    for (let x = -6.5; x <= 6.5; x += 1.3) addBox(house, [0.5, 0.9, 0.5], [x, 9.9, -5.5], coralStone);
    // 風の塔（バードギール）：四方に縦長の開口がある塔で、夏の風を家の中へ落とす
    addBox(house, [3.6, 7, 3.6], [4, 12.5, 2], coralStone);
    for (const [x, z, ry] of [[4, 0.15, 0], [4, 3.85, 0], [2.15, 2, Math.PI / 2], [5.85, 2, Math.PI / 2]]) for (const dx of [-0.8, 0, 0.8]) { const o = new THREE.Vector3(dx, 0, 0).applyAxisAngle(new V3(0, 1, 0), ry); addBox(house, [0.35, 4.5, 0.1], [x + o.x, 13, z + o.z], win, [0, ry, 0]); }
    addBox(house, [2.6, 4, 0.2], [0, 2, -5.55], darkTeak); addBox(house, [12, 1.4, 0.3], [0, 6.2, -5.6], teak);
    for (const x of [-4.5, 4.5]) addBox(house, [1.4, 2.2, 0.1], [x, 6.4, -5.7], win);
    g.updateMatrixWorld(true); const growth = [];
    for (let i = 0; i < 80; i++) growth.push({ p: house.localToWorld(new V3(rand(-7, 7), rand(0.3, 9.4), (Math.random() < 0.5 ? -1 : 1) * 5.55)), s: new V3(1, 1, 0.5).multiplyScalar(rand(0.18, 0.4)), c: C(['#c97a8e', '#d9a066', '#9a86c2', '#6fae84'][i % 4]) });
    addInst(SPH_LO, toon('#ffffff'), growth, false);
    swirl(g.localToWorld(new V3(0, 6, -9)), 16, 4, ['#f4a259', '#fff1d0', '#e94f37'], 0.4, 0.6);
    signAt(g, 'ダイブ・バーレーンの沈められた真珠商人の家', 21, 20);
  }

  /* ---- 第6区間と沿道：ファシュト・アル＝アズムの珊瑚礁（脳珊瑚・テーブル珊瑚・枝珊瑚・ウミウチワ・イソギンチャク） ---- */
  const anemoneFish = [];
  {
    const brainTex = ctex(128, 128, c => {
      c.fillStyle = '#f4ecdc'; c.fillRect(0, 0, 128, 128); c.strokeStyle = 'rgba(110,80,40,.5)'; c.lineWidth = 3;
      for (let k = 0; k < 18; k++) { c.beginPath(); let x = rand(0, 128), y = rand(0, 128); c.moveTo(x, y); for (let j = 0; j < 8; j++) { x += rand(-14, 14); y += rand(-14, 14); c.lineTo(x, y); } c.stroke(); }
    }, true);
    const brains = [], tables = [], stalks = [], branches = [], fans = [], urchins = [];
    const reef = (p, k) => {
      const kind = k % 4, sc = rand(0.8, 1.4);
      if (kind === 0) brains.push({ p: onGround(p.clone(), 0.2), s: new V3(2, 1.3, 2).multiplyScalar(sc), r: [0, rand(0, 3), 0], c: C(['#e0b070', '#d39a5e', '#b48ac8'][k % 3]) });
      else if (kind === 1) { const y = groundAt(p); stalks.push({ p: new V3(p.x, y + 1, p.z), s: new V3(0.4, 2, 0.4) }); tables.push({ p: new V3(p.x, y + 2.1, p.z), s: new V3(3, 0.35, 3).multiplyScalar(sc), c: C(['#7fae8a', '#a990d8', '#e8a070'][k % 3]) }); }
      else if (kind === 2) { const y = groundAt(p), c = C(['#ff7aa8', '#b07aea', '#ff9a5a', '#ff5f7e'][k % 4]); for (let j = 0; j < 5; j++) { const h = rand(2, 4.5) * sc; branches.push({ p: new V3(p.x + rand(-0.8, 0.8), y + h / 2, p.z + rand(-0.8, 0.8)), s: new V3(0.35, h, 0.35), r: [rand(-0.5, 0.5), 0, rand(-0.5, 0.5)], c }); } }
      else fans.push({ p: onGround(p.clone(), 1.8 * sc), s: new V3(3.2, 3.6, 1).multiplyScalar(sc), r: [0, rand(0, 3), 0], c: C(['#c25a7c', '#e07a4f', '#9c5ab8'][k % 3]) });
    };
    // 珊瑚礁の本体は第6区間の外、ほかは沿道にまばらに
    const g = site('ファシュト・アル＝アズムの珊瑚礁', at(6, 0.45), W / 2 + 22, 12, 10, '#d8cfae');
    scatter(70, at(6, 0), at(6, 1), W / 2 + 6, W / 2 + 70, W / 2 + 4, 1.5).forEach((p, k) => reef(p, k));
    scatter(26, at(6, 0.1), at(6, 0.9), -(W / 2 + 40), -(W / 2 + 6), W / 2 + 4, 1.5).forEach((p, k) => reef(p, k + 1));
    scatter(90, 0, track.L, W / 2 + 8, W / 2 + 120, W / 2 + 5, 1.5).forEach((p, k) => reef(p, k + 2));
    addInst(SPH_LO, toon('#ffffff', { map: brainTex }), shuffle(brains)); addInst(CYL, toon('#a99c84'), shuffle(stalks)); addInst(new THREE.CylinderGeometry(1, 0.85, 1, 12), toon('#ffffff'), shuffle(tables));
    addInst(new THREE.CylinderGeometry(0.5, 1, 1, 7), toon('#ffffff'), shuffle(branches));
    // ウミウチワ：網目の扇。水に合わせて揺れる
    const fanTex = ctex(128, 128, c => {
      c.clearRect(0, 0, 128, 128); c.strokeStyle = '#ffffff'; c.lineWidth = 2.5;
      for (let k = 0; k < 14; k++) { const a = -Math.PI * 0.95 + k / 13 * Math.PI * 0.9; c.beginPath(); c.moveTo(64, 128); c.quadraticCurveTo(64 + Math.cos(a) * 30, 128 + Math.sin(a) * 60, 64 + Math.cos(a) * 62, 128 + Math.sin(a) * 124); c.stroke(); }
      for (let r = 20; r < 128; r += 11) { c.beginPath(); c.arc(64, 128, r, Math.PI, Math.PI * 2); c.stroke(); }
    });
    const fanMat = seaSway(toon('#ffffff', { map: fanTex, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide }), 0.35);
    addInst(new THREE.PlaneGeometry(1, 1), fanMat, shuffle(fans), false);
    // ウニとナマコ、ヒトデ（沿道と内馬場の砂の上）
    for (const p of scatter(80, 0, track.L, -(W / 2 + 90), W / 2 + 90, W / 2 + 3, 0)) urchins.push({ p: onGround(p, 0.3), s: new V3(0.45, 0.4, 0.45), r: [rand(0, 3), rand(0, 3), 0], c: C(['#3b2a4a', '#2b2b3a', '#5a2f3e'][(Math.random() * 3) | 0]) });
    addInst(new THREE.OctahedronGeometry(1, 0), toon('#ffffff'), urchins, false);
    const star = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, r = i % 2 ? 0.4 : 1; star[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); }
    const starGeo = new THREE.ExtrudeGeometry(star, { depth: 0.18, bevelEnabled: false }); starGeo.rotateX(-Math.PI / 2);
    addInst(starGeo, toon('#ffffff'), scatter(130, 0, track.L, -(W / 2 + 100), W / 2 + 100, W / 2 + 2.5, 0).map(p => ({ p: onGround(p, 0.05), s: new V3(1, 1, 1).multiplyScalar(rand(0.4, 0.75)), r: [0, rand(0, 3), 0], c: C(['#f07a3a', '#e8483e', '#f3b13c', '#4f7fd0', '#c45bb0'][(Math.random() * 5) | 0]) })), false);
    addInst(new THREE.CapsuleGeometry(0.3, 1, 3, 8), toon('#ffffff'), scatter(45, 0, track.L, -(W / 2 + 80), W / 2 + 80, W / 2 + 3, 0).map(p => ({ p: onGround(p, 0.28), s: new V3(1, 1, 1), r: [Math.PI / 2, 0, rand(0, 3)], c: C(['#6b4a35', '#3e3229', '#8a6a42'][(Math.random() * 3) | 0]) })), false);
    // イソギンチャクと、クマノミ（湾にすむクラウンアネモネフィッシュの仲間）
    const tentacles = [], discs = [], tentMat = seaSway(toon('#ffffff'), 0.35, -0.5, 1, 1.8);
    const anemones = [g.localToWorld(new V3(-3, 0, 0)), g.localToWorld(new V3(3, 0, 1))].concat(scatter(10, at(6, 0), at(0, 0.5), W / 2 + 6, W / 2 + 30, W / 2 + 4, 2));
    anemones.forEach((c, i) => {
      onGround(c); const col = C(['#f39ab8', '#b8e07a', '#ffd38a', '#c6a0f0'][i % 4]);
      discs.push({ p: c.clone().add(new V3(0, 0.3, 0)), s: new V3(1.3, 0.6, 1.3), c: C('#a0605a') });
      for (let k = 0; k < 26; k++) { const a = rand(0, Math.PI * 2), r = rand(0, 1.2), h = rand(0.9, 1.5); tentacles.push({ p: c.clone().add(new V3(Math.cos(a) * r, 0.5 + h / 2, Math.sin(a) * r)), s: new V3(0.12, h, 0.12), r: [Math.sin(a) * r * 0.4, 0, -Math.cos(a) * r * 0.4], c: col }); }
      if (i < 6) anemoneFish.push({ c: c.clone().add(new V3(0, 1.5, 0)), ph: rand(0, 6) });
    });
    addInst(CYL, toon('#ffffff'), discs, false); addInst(new THREE.CylinderGeometry(0.4, 1, 1, 5), tentMat, shuffle(tentacles), false);
    // クマノミ：橙の胴に白い帯が2本。2匹ずつ、イソギンチャクのすぐ上を出たり入ったり
    const bands = ctex(16, 64, c => { c.fillStyle = '#f0782c'; c.fillRect(0, 0, 16, 64); c.fillStyle = '#2a1a14'; for (const y of [19, 27, 37, 45]) c.fillRect(0, y, 16, 2); c.fillStyle = '#fff7ee'; for (const y of [21, 39]) c.fillRect(0, y, 16, 6); c.fillStyle = '#2a1a14'; c.fillRect(0, 0, 16, 4); }, false);
    const clown = school(anemoneFish.length * 2, ['#ffffff'], 0.36, bands);
    updates.push(t => {
      const m = reduced.matches ? 0 : t;
      anemoneFish.forEach(({ c, ph }, i) => {
        for (let j = 0; j < 2; j++) {
          const a = m * 0.9 + ph + j * Math.PI, r = 0.7 + Math.sin(m * 0.7 + ph + j) * 0.4;
          clown.set(i * 2 + j, new V3(c.x + Math.cos(a) * r, c.y + Math.sin(m * 1.3 + j) * 0.3, c.z + Math.sin(a) * r), -a - Math.PI / 2);
        }
      });
      clown.done();
    });
    signAt(g, 'ファシュト・アル＝アズムの珊瑚礁', 10, 16);
  }

  /* ---- 内馬場：パール記念の大真珠貝（ゴールで口を開く、ファンタジーの演出） ---- */
  let lidG, bigPearl, pearlGlow;
  {
    let c = local(at(0, 0.4), 0, -(W / 2 + 64));
    for (let k = 0; k < 10 && (!clearAt(c.x, c.z, W / 2 + 18, 16) || c.distanceTo(boardPos) < 34); k++) c = local(at(0, 0.4 + k * 0.04), 0, -(W / 2 + 64 + k * 3));
    occupied.push({ x: c.x, z: c.z, r: 18 });
    const g = registerLandmark(fantasyGroup(onGround(c.clone())), 'パール記念の大真珠貝');
    // 殻：成長線の同心円と放射状の筋
    const shellTex = ctex(256, 256, cx => {
      cx.fillStyle = '#8b7e8c'; cx.fillRect(0, 0, 256, 256);
      for (let r = 12; r < 190; r += 10) { cx.strokeStyle = r % 20 ? 'rgba(60,45,70,.35)' : 'rgba(220,205,225,.35)'; cx.lineWidth = 4; cx.beginPath(); cx.arc(128, 256, r * 1.4, Math.PI, Math.PI * 2); cx.stroke(); }
      for (let k = 0; k < 22; k++) { const a = Math.PI + k / 21 * Math.PI; cx.strokeStyle = 'rgba(255,255,255,.12)'; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(128, 256); cx.lineTo(128 + Math.cos(a) * 260, 256 + Math.sin(a) * 260); cx.stroke(); }
    });
    const shell = toon('#ffffff', { map: shellTex }), nacre = toon('#f3eaf6', { emissive: C('#bcd6ef'), emissiveIntensity: 0.35, side: THREE.DoubleSide });
    part(g, new THREE.CylinderGeometry(15, 17, 1.6, 28), toon('#d8cfae'), [0, 0.3, 0], null, null, 0);
    part(g, new THREE.SphereGeometry(1, 28, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), shell, [0, 3.6, 0], [12, 3.4, 10.5], null, 0.03);
    part(g, new THREE.CircleGeometry(1, 28), nacre, [0, 3.62, 0], [11.4, 10, 1], [-Math.PI / 2, 0, 0], 0);
    bigPearl = part(g, new THREE.SphereGeometry(1, 28, 18), new THREE.MeshStandardMaterial({ color: C('#fff7fb'), roughness: 0.18, metalness: 0.25, emissive: C('#f6e7ff'), emissiveIntensity: 0.25 }), [0, 5.4, -1], [2.6, 2.6, 2.6], null, 0);
    // 上の殻は奥の蝶番で開く
    lidG = new THREE.Group(); lidG.position.set(0, 3.6, 10.2); g.add(lidG);
    part(lidG, new THREE.SphereGeometry(1, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2), shell, [0, 0, -10.2], [12, 3.2, 10.5], null, 0.03);
    part(lidG, new THREE.CircleGeometry(1, 28), nacre, [0, -0.02, -10.2], [11.4, 10, 1], [Math.PI / 2, 0, 0], 0);
    pearlGlow = bigPearl.material;
    // 足元の砂紋とヒトデ、まわりを回る小魚
    swirl(new V3(c.x, groundAt(c) + 9, c.z), 34, 17, ['#ffe08a', '#ff9fb2', '#a8e6ff', '#ffffff'], 0.5, 0.3);
    signAt(g, 'パール記念の大真珠貝', 20, 13);
    [lidG, bigPearl].forEach(o => { o.userData.droneIgnore = true; });
  }

  /* ---- 外洋：ゆっくり回るトビエイとクジラ、漂うクラゲ ---- */
  const rays = [];
  {
    const top = toon('#33405a'), spot = toon('#e9eef5');
    for (let i = 0; i < 4; i++) {
      const g = fantasyGroup(); g.userData.droneIgnore = true;
      part(g, SPH_LO, top, [0, 0, 0], [1.4, 0.45, 0.9], null, 0.04); part(g, SPH_LO, top, [1.4, 0, 0], [0.6, 0.35, 0.5], null, 0);
      part(g, CYL, top, [-4, 0, 0], [0.06, 6, 0.06], [0, 0, Math.PI / 2], 0);
      const wings = [-1, 1].map(sd => { const w = new THREE.Group(); w.position.z = sd * 0.6; g.add(w); part(w, SPH_LO, top, [-0.2, 0, sd * 2.4], [1.3, 0.12, 2.6], [0, sd * 0.35, 0], 0.04); for (let j = 0; j < 4; j++) part(w, SPH_LO, spot, [-0.2 + rand(-0.6, 0.6), 0.1, sd * rand(1, 3.4)], [0.18, 0.05, 0.18], null, 0); return w; });
      rays.push({ g, wings, r: 60 + i * 26, y: 22 + i * 7, ph: i * 1.6, sp: 0.07 - i * 0.008 });
      if (i > 1) themeDetails.push(g);
    }
    const jellyfish = [];
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2, g = fantasyGroup(new V3(Math.cos(a) * (radius - 60), 32 + i % 3 * 16, Math.sin(a) * (radius - 60)));
      part(g, new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon(i % 2 ? '#b1dfee' : '#e4bdea', { transparent: true, opacity: 0.7, depthWrite: false, emissive: C(i % 2 ? '#4fa9c9' : '#a46fb5'), emissiveIntensity: 0.35 }), [0, 0, 0], [3.6, 2.6, 3.6], null, 0);
      for (let j = 0; j < 6; j++) part(g, new THREE.CylinderGeometry(0.08, 0.04, 6, 4), toon('#d2d0eb', { transparent: true, opacity: 0.7 }), [Math.cos(j) * 1.6, -3, Math.sin(j) * 1.6], null, null, 0);
      g.userData.droneIgnore = true; jellyfish.push({ g, y: g.position.y }); if (i % 2) themeDetails.push(g);
    }
    // クジラ（湾にもすむニタリクジラ）：海面近くをゆっくり横切る
    const whale = fantasyGroup(), blue = toon('#5b7f95'), pale = toon('#c9d8d6');
    part(whale, SPH_LO, blue, [0, 0, 0], [26, 7, 7]); part(whale, SPH_LO, pale, [2, -3, 0], [22, 4, 6]);
    for (let k = 0; k < 7; k++) addBox(whale, [16, 0.25, 0.5], [8, -5.3, -3 + k], toon('#a8b8b6'));
    const tail = new THREE.Group(); tail.position.set(-25, 0, 0); whale.add(tail); part(tail, SPH_LO, blue, [-5, 0, 0], [6, 0.8, 8], null, 0.04);
    for (const s of [-1, 1]) { part(whale, SPH_LO, blue, [8, -4, s * 7], [7, 1.2, 4], [s * 0.4, 0, 0], 0.04); part(whale, SPH_LO, toon('#1f2f3a'), [17, 0.5, s * 5.5], [0.7, 0.7, 0.7], null, 0); }
    whale.userData.droneIgnore = true;
    updates.push(t => {
      const m = reduced.matches ? 0 : t;
      rays.forEach(({ g, wings, r, y, ph, sp }) => {
        const a = m * sp + ph; g.position.set(Math.cos(a) * r, y + Math.sin(a * 2) * 3, Math.sin(a) * r * 0.8); g.rotation.set(0, -a - Math.PI / 2, -0.15);
        wings.forEach((w, k) => { w.rotation.x = Math.sin(m * 1.1 + ph) * 0.35 * (k ? -1 : 1); });
      });
      jellyfish.forEach(({ g, y }, i) => { const pulse = Math.sin(m * 1.4 + i); g.position.y = y + Math.sin(m * 0.4 + i) * 4; g.scale.set(1 + pulse * 0.08, 1 - pulse * 0.1, 1 + pulse * 0.08); });
      whale.position.set(Math.sin(m * 0.035) * (radius + 40), SURF - 22 + Math.sin(m * 0.15) * 3, -radius + 60); whale.rotation.y = Math.cos(m * 0.035) > 0 ? 0 : Math.PI;
      tail.rotation.z = Math.sin(m * 0.8) * 0.25;
    });
  }

  // 海の底から昇る細かな泡。ゴールの瞬間は大真珠貝が口を開き、真珠色の光と泡があふれる
  ambient(TEX_SOFT, true, 9, (a, c) => a.emit(c.x + rand(-50, 50), c.y + rand(-14, 4), c.z + rand(-50, 50), rand(-0.1, 0.1), rand(0.6, 1.4), rand(-0.1, 0.1), 9, rand(0.15, 0.3), C('#c9f7f6'), 0, 0), true);
  const finish = tp(track.finishS, W / 2).v; let celebration = 0, open = 0;
  themeFinish = () => { celebration = 7; }; themeReset = () => { celebration = 0; open = 0; };
  const burstCols = ['#fff4fb', '#f6d9ff', '#cdf6ff', '#ffe9c4'].map(c => C(c).multiplyScalar(2));
  updates.push((t, dt) => {
    SEA_U.time.value = reduced.matches ? 0 : t;
    celebration = Math.max(0, celebration - dt);
    // 大真珠貝：ふだんはゆっくり息をするように開閉し、ゴールでは大きく開いて真珠が輝く
    const target = celebration ? 1.05 : 0.28 + Math.sin((reduced.matches ? 0 : t) * 0.35) * 0.1;
    open += (target - open) * Math.min(1, dt * 2);
    lidG.rotation.x = open; pearlGlow.emissiveIntensity = 0.25 + Math.max(0, open - 0.4) * 1.6;
    bigPearl.position.y = 5.4 + Math.max(0, open - 0.4) * 3;
    if (celebration > 3.5) {
      const n = reduced.matches ? 1 : lightQuality() ? 3 : 6, p = bigPearl.getWorldPosition(new V3());
      for (let i = 0; i < n; i++) {
        sparkP.emit(finish.x + rand(-W / 2, W / 2), finish.y + rand(2, 9), finish.z + rand(-W / 2, W / 2), rand(-1.5, 1.5), rand(1, 3), rand(-1.5, 1.5), rand(1.4, 2.4), rand(0.4, 0.9), burstCols[i % burstCols.length], -0.6, 0.8);
        bubble(finish.x + rand(-W / 2, W / 2), finish.y + rand(0, 2), finish.z + rand(-W / 2, W / 2), rand(0.3, 0.6));
        sparkP.emit(p.x + rand(-2, 2), p.y + rand(0, 2), p.z + rand(-2, 2), rand(-2, 2), rand(2, 5), rand(-2, 2), rand(1.5, 2.5), rand(0.5, 1), burstCols[i % burstCols.length], -0.3, 0.6);
      }
    }
  });
  themeUpd.push((t, dt) => { for (const f of updates) f(t, dt); });
}
function decorPearlOceanStand(stand, len, z0, roof) {
  const g = new THREE.Group(); stand.add(g); registerLandmark(g, 'pearlOcean-stand');
  roof.visible = false;
  // ムハッラクの真珠商人の家：珊瑚石としっくいの壁、チーク材の柱
  const recolor = { [C('#f2eef8').getHex()]: '#e8dcc0', [C('#e3dcef').getHex()]: '#d6c6a2', [C('#d9d3e6').getHex()]: '#7a5536' };
  stand.children.forEach(o => { if (o.isMesh && !o.isInstancedMesh && o.material.color && recolor[o.material.color.getHex()]) o.material.color.set(recolor[o.material.color.getHex()]); });
  const stone = toon('#e3d5b5'), teak = toon('#7a5536'), dark = toon('#2d3b40');
  // 平らな屋根と、三角の飾り（シャラファート）を並べた胸壁
  addBox(g, [len + 6, 0.8, 22], [0, 13.4, z0 + 8.5], stone, null, 0.02);
  addBox(g, [len + 6, 1.2, 0.6], [0, 14.4, z0 - 2.2], stone);
  const tri = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-0.5, 0), new THREE.Vector2(0.5, 0), new THREE.Vector2(0, 1)]), { depth: 0.4, bevelEnabled: false });
  const crest = []; for (let x = -len / 2 - 2.5; x <= len / 2 + 2.5; x += 1.4) crest.push({ p: new V3(x, 15, z0 - 2.4), s: new V3(0.9, 1.1, 1) });
  g.add(inst(tri, stone, crest, false));
  // 透かし彫りの木の格子窓（マシュラビーヤ）の帯
  const lattice = ctex(128, 64, c => { c.fillStyle = '#7a5536'; c.fillRect(0, 0, 128, 64); c.fillStyle = '#2d3b40'; for (let y = 4; y < 64; y += 10) for (let x = (y / 10 % 2) * 5 + 2; x < 128; x += 10) c.fillRect(x, y, 6, 6); }, true);
  lattice.repeat.set(len / 8, 1);
  addBox(g, [len + 4, 1.6, 0.3], [0, 12.4, z0 - 2], toon('#ffffff', { map: lattice }));
  // 風の塔（バードギール）：屋根の上に5本
  for (let i = 0; i < 5; i++) {
    const x = -len / 2 + (i + 0.5) * len / 5, z = z0 + 12;
    addBox(g, [4, 9, 4], [x, 18.3, z], stone, null, 0.02);
    // 四方の面に縦長の開口を3つずつ
    for (let k = -1; k <= 1; k++) for (const sd of [-1, 1]) { addBox(g, [0.45, 5, 0.1], [x + k, 19, z + sd * 2.02], dark); addBox(g, [0.1, 5, 0.45], [x + sd * 2.02, 19, z + k], dark); }
    addBox(g, [4.6, 0.6, 4.6], [x, 23, z], teak);
  }
  // 軒先の真珠の首飾り：柱の間に真珠の粒を連ねて垂らす
  const pearls = [];
  for (let x = -len / 2; x < len / 2; x += len / 5) for (let k = 0; k <= 24; k++) { const u = k / 24, px = x + u * len / 5; pearls.push({ p: new V3(px, 11.6 - Math.sin(u * Math.PI) * 2.2, z0 - 2.4), s: new V3(0.32, 0.32, 0.32) }); }
  g.add(inst(SPH_LO, toon('#fff4fa', { emissive: C('#d9c6e0'), emissiveIntensity: 0.4 }), pearls, false));
}
