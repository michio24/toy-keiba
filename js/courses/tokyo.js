// 東京（府中）
'use strict';

function decorTokyo(th) {
  // 内馬場の木はダートコースより内側に置く
  // 内馬場の日本庭園：池と太鼓橋、松（4コーナー寄り、ターフビジョンから離して置く）
  const garden = landmarkGroup('日本庭園', 0.2, -60); landmarkFoundation(garden, 56, 34, '#88b46e');
  { const pond = part(garden, new THREE.CircleGeometry(1, 40), toon('#5f9fc4'), [0, 0.08, 0], [20, 10, 1], [-Math.PI / 2, 0, 0], 0); pond.receiveShadow = true;
    const arch = new THREE.Mesh(new THREE.TorusGeometry(5, 0.6, 6, 16, Math.PI), toon('#c2493a')); arch.position.set(0, 0, 0); arch.rotation.y = Math.PI / 2; arch.scale.set(1, 0.5, 2.2); garden.add(arch);
    const pine = new THREE.ConeGeometry(1, 1, 7); pine.translate(0, 0.5, 0);
    for (const [x, z] of [[-22, -12], [-24, 8], [22, 11], [24, -9], [-12, 14], [13, -14]]) {
      part(garden, new THREE.CylinderGeometry(0.4, 0.6, 3, 6), toon('#6b4a35'), [x, 1.5, z], null, null, 0);
      for (const [r, y] of [[3.6, 2.5], [2.6, 4.6]]) part(garden, pine, toon('#2f6a3e'), [x, y, z], [r, 2.4, r], null, 0);
    }
    for (const [x, z, sc] of [[-15, -3, 1.6], [16, 3, 1.3], [8, 9, 1]]) part(garden, SPH_LO, toon('#9c988c'), [x, 0.6, z], [sc * 1.6, sc, sc * 1.3], null, 0); }
  const gardenPos = garden.position;
  const infield = Array.from({ length: 18 }, () => { const q = tp(Math.random() * track.L, -rand(26, Math.max(30, track.R - 14))); q.v.y = track.groundH(q.v.x, q.v.z); return { p: q.v }; })
    .filter(it => it.p.distanceTo(boardPos) > 26 && it.p.distanceTo(gardenPos) > 38);
  // スタンドの裏（パドック・トキノミノル像・連絡通路）には木を置かない
  const behind = p => { for (let s = track.homeS0 - 80; s <= track.homeS1 + 40; s += 4) { const q = track.pos(s, W + 120); if ((q.x - p.x) ** 2 + (q.z - p.z) ** 2 < 70 ** 2) return true; } return false; };
  roundTrees([...treeSpots(110, 0).filter(it => !behind(it.p)), ...infield], ['#3f8f3a', '#4fa546', '#5fb853', '#377d34']);
  // けやき並木：正門の先へまっすぐ延びる2列の大きなケヤキ（府中の馬場大門のケヤキ並木をイメージ）
  { const avenue = [];
    for (let k = 0; k < 9; k++) for (const ds of [-9, 9]) { const q = tp(lerp(track.homeS0, track.homeS1, 0.62) + ds, W + 150 + k * 14); q.v.y = track.groundH(q.v.x, q.v.z); avenue.push({ p: q.v, s: rand(1.9, 2.3) }); }
    roundTrees(avenue, ['#3a7f36', '#4a9442', '#5aa54c'], '#5a3e2b');
    // 大國魂神社の鎮守の森（社殿の左右と奥）
    const forest = [];
    for (let i = 0; i < 16; i++) { const q = tp(174 + (i % 2 ? 1 : -1) * rand(24, 40), W + 250 + rand(0, 40)); q.v.y = track.groundH(q.v.x, q.v.z); forest.push({ p: q.v, s: rand(1.6, 2.2) }); }
    roundTrees(forest, ['#2f6e2c', '#3a7f36', '#4a9442'], '#5a3e2b'); }
  // 府中の街並み：スタンドの裏（北側）に広がる低層〜中層のビル。正門・駅・並木・乗馬センター・JRの線路の周りは空ける
  { const keep = [[150, 198, 0, W + 320], [-15, 180, 0, W + 222], [195, 257, W + 210, W + 262], [195, 365, 0, W + 208]];
    const blocks = [], cols = ['#e7e2d8', '#d9d4ca', '#cfd6dc', '#ece6da', '#c9c2b6', '#dfe6e8'].map(C);
    for (let s = -90; s <= 340; s += 15) for (let lane = W + 200; lane <= W + 330; lane += 17) {
      if (Math.random() < 0.25 || keep.some(([s0, s1, l0, l1]) => s >= s0 && s <= s1 && lane >= l0 && lane <= l1)) continue;
      const q = tp(s + rand(-2, 2), lane + rand(-2, 2)), w = rand(9, 13), d = rand(9, 13), h = rand(5, 18) + (lane > W + 280 ? rand(0, 10) : 0);
      blocks.push({ p: new V3(q.v.x, h / 2, q.v.z), s: new V3(w, h, d), r: [0, -q.h, 0], c: cols[(Math.random() * cols.length) | 0] });
    }
    // 府中駅前の高層ビル（並木の西側、街並みの奥）
    for (const [s, lane, h] of [[96, W + 318, 52], [118, W + 330, 40]]) { const q = tp(s, lane); blocks.push({ p: new V3(q.v.x, h / 2, q.v.z), s: new V3(16, h, 16), r: [0, -q.h, 0], c: C('#bfc9d1') }); }
    inst(BOX, toon('#ffffff'), blocks); }
  // 多摩川：向正面の向こう（南側）を流れる川。水面と河川敷、川を渡る橋
  { const mid = track.segStart[2] + track.segs[2].len2 / 2, P = track.pos(mid, W + 200), d = new V3(Math.cos(P.h), 0, Math.sin(P.h));
    const river = decorPath([new V3(P.x - d.x * 700, 0, P.z - d.z * 700), new V3(P.x + d.x * 700, 0, P.z + d.z * 700)]);
    decorCourseLane(river, 'turf', 0, river.L, { lanes: [W / 2 - 34, W / 2 + 34], cols: 2, step: 20, onGround: true, lift: 0.12, mat: toon('#b9cf8f', { side: THREE.DoubleSide }) });
    decorCourseLane(river, 'water', 0, river.L, { lanes: [W / 2 - 16, W / 2 + 16], cols: 2, step: 20, onGround: true, lift: 0.2, mat: toon('#6fa9c9', { side: THREE.DoubleSide }) });
    const b = new THREE.Group(); b.position.set(P.x + d.x * 160, 0, P.z + d.z * 160); b.rotation.y = -P.h; world.add(b);
    addBox(b, [9, 1, 84], [0, 5, 0], toon('#c9c6bd'), null, 0.02);
    for (const z of [-24, -8, 8, 24]) addBox(b, [6, 5, 2], [0, 2.5, z], toon('#a9a59b'), null, 0); }
  // 芝の内側のダートコース（飾り）。内柵を挟んで並走し、1周は約1/2縮尺で実物の1899mに近い
  decorCourseLane(track, 'dirt', 0, track.L, { lanes: [-3.5, -14.5], onGround: true });
  decorInnerRail(-15.3, th.rail);
  // 芝の発走ポケット（飾り）：2000mは1コーナー奥へ直進、1600mは向正面から2コーナー奥へ延びる引き込み線
  const mat = decorTurfMat();
  decorTurfPocket(track.segStart[1], 60, true, mat); decorTurfPocket(track.segStart[2], 55, false, mat);
  // 大ケヤキ: a lone giant zelkova inside the 3rd corner, beyond the dirt course
  { const q = tp(track.segStart[3] + track.segs[3].len2 * 0.12, -32); q.v.y = track.groundH(q.v.x, q.v.z); roundTrees([{ p: q.v, s: 3.4 }], ['#3a7f36', '#4a9442', '#2f6e2c'], '#5a3e2b'); }
  // 富士山：南向きのスタンドから見て右前方（西南西）、1〜2コーナーの向こう。図鑑の全景では隠す
  { const home = tp(lerp(track.homeS0, track.homeS1, 0.5), W / 2), a = 65 * Math.PI / 180;
    const d = home.n.clone().negate().multiplyScalar(Math.cos(a)).addScaledVector(home.dir, Math.sin(a)), f = d.multiplyScalar(1150);
    const g = new THREE.ConeGeometry(1, 1, 48); g.translate(0, 0.5, 0);
    const fuji = new THREE.Mesh(g, toon('#6f86b8', { fog: false })); fuji.position.set(f.x, -8, f.z); fuji.scale.set(430, 250, 430); world.add(fuji);
    const cap = new THREE.Mesh(g, toon('#ffffff', { fog: false })); cap.position.set(f.x, -8 + 250 * 0.62, f.z); cap.scale.set(430 * 0.38, 250 * 0.38, 430 * 0.38); world.add(cap);
    fuji.userData.backdrop = cap.userData.backdrop = true; }
  mountains(th.mount, 10, false);
}
// Decorative lanes do not participate in race physics or replace the selected course.
// opts.lanes: 描く幅（レーン範囲）、opts.onGround: 坂のあるコースでは地形の高さに沿わせる、opts.mat: 材質の指定（UVは走路面と同じ割り付け）
