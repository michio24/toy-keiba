// コースの形状計算（直線・カーブ・高低差・レーン）
'use strict';

/* ============ TRACK MATH ============ */
const W = 16, ELEV_EX = 2.5;
// Generic course: a chain of straights and arcs (radius measured to the mid-lane), left- or right-handed,
// optional elevation profile, closed loop or a single straight. Sampled at ~0.5 m, lanes offset along the outward normal.
class Track {
  constructor(def) {
    this.def = def;
    const k = def.scale || 1;
    const segs = def.segs ? def.segs.map(g => g.len != null ? { len: g.len * k } : g.curve ? { curve: g.curve.map(([px, pz]) => [px * k, pz * k]) } : { r: g.r * k, ang: g.ang })
      : [{ len: def.S }, { r: def.R + W / 2, ang: 180 }, { len: def.S }, { r: def.R + W / 2, ang: 180 }];
    this.closed = def.closed !== false;
    this.turn = def.dir === 'right' ? 1 : -1;          // sign of dh along the course
    this.sgn = -this.turn;                             // +1: outward normal = (-sin h, cos h)
    // raw walk
    const rx = [0], rz = [0], rh = [0], rk = [0], rs = [0]; const segStart = [];
    let x = 0, z = 0, h = 0, sAcc = 0;
    for (const g of segs) {
      segStart.push(sAcc);
      if (g.curve) {
        const curve = new THREE.CubicBezierCurve3(new V3(x, 0, z), ...g.curve.map(([px, pz]) => new V3(px, 0, pz * this.turn)));
        const n = Math.max(1, Math.ceil(curve.getLength() / 0.25)), start = sAcc;
        for (let i = 1; i <= n; i++) {
          const q = curve.getPoint(i / n), tangent = curve.getTangent(i / n);
          const heading = h + mod(Math.atan2(tangent.z, tangent.x) - h + Math.PI, Math.PI * 2) - Math.PI;
          const ds = Math.hypot(q.x - x, q.z - z);
          rx.push(q.x); rz.push(q.z); rh.push(heading); rk.push(Math.abs(heading - h) / Math.max(ds, 1e-6));
          sAcc += ds; rs.push(sAcc); x = q.x; z = q.z; h = heading;
        }
        g.len2 = sAcc - start; continue;
      }
      const len = g.len != null ? g.len : g.r * g.ang * Math.PI / 180;
      const n = Math.max(1, Math.ceil(len / 0.25)), ds = len / n, dh = g.len != null ? 0 : this.turn * ds / g.r;
      for (let i = 0; i < n; i++) { x += Math.cos(h + dh / 2) * ds; z += Math.sin(h + dh / 2) * ds; h += dh; sAcc += ds; rx.push(x); rz.push(z); rh.push(h); rk.push(g.len != null ? 0 : 1 / g.r); rs.push(sAcc); }
      g.len2 = len;
    }
    rk[0] = rk[1];
    let pointRatio = 1;
    if (def.points) {
      const controls = def.points.map(([px, pz]) => new V3(px * k * (def.pointScale || 1.6), 0, pz * k * (def.pointScale || 1.6)));
      let rounded = controls;
      // Round street junctions before sampling, keeping the narrow hairpin driveable.
      // 一本道（closed: false）は両端の点を固定したまま角だけを丸める
      for (let pass = 0; pass < 2; pass++) {
        const next = this.closed ? [] : [rounded[0]];
        for (let i = 0; i < rounded.length - (this.closed ? 0 : 1); i++) {
          const a = rounded[i], b = rounded[(i + 1) % rounded.length];
          next.push(a.clone().lerp(b, 0.25), a.clone().lerp(b, 0.75));
        }
        if (!this.closed) next.push(rounded[rounded.length - 1]);
        rounded = next;
      }
      const curve = new THREE.CatmullRomCurve3(rounded, this.closed, 'centripetal');
      curve.arcLengthDivisions = 4000;
      sAcc = curve.getLength();
      if (def.normalizedLength) {
        const ratio = def.normalizedLength / sAcc; pointRatio = ratio;
        controls.forEach(p => p.multiplyScalar(ratio));
        rounded.forEach(p => p.multiplyScalar(ratio));
        curve.updateArcLengths(); sAcc = def.normalizedLength;
      }
      if (def.tunnelPoints || def.corners) {
        // 制御点に最も近い周回距離（トンネル区間・コーナー名の位置合わせ用）。曲線の標本は一度だけ取る
        const probe = Array.from({ length: 4001 }, (_, i) => curve.getPointAt(i / 4000));
        const pointDistance = index => {
          let best = Infinity, at = 0;
          probe.forEach((p, i) => { const distance = p.distanceToSquared(controls[index]); if (distance < best) { best = distance; at = i / 4000 * sAcc; } });
          return at;
        };
        if (def.tunnelPoints) this.tunnelRange = def.tunnelPoints.map(pointDistance);
        this.corners = (def.corners || []).map(([index, name]) => ({ name, s: pointDistance(index) }));
      }
      const count = Math.ceil(sAcc / 0.25);
      rx.length = rz.length = rh.length = rk.length = rs.length = 0;
      let last = 0;
      for (let i = 0; i <= count; i++) {
        const u = i / count, q = curve.getPointAt(u), tangent = curve.getTangentAt(u);
        let heading = Math.atan2(tangent.z, tangent.x);
        if (i) heading = last + mod(heading - last + Math.PI, Math.PI * 2) - Math.PI;
        rx.push(q.x); rz.push(q.z); rh.push(heading); rs.push(u * sAcc);
        rk.push(i ? Math.abs(heading - last) / (sAcc / count) : 0); last = heading;
      }
      rk[0] = rk[1]; segs[0].len2 = sAcc; x = z = 0;
    }
    const L = sAcc; this.L = L; this.segStart = segStart; this.segs = segs;
    if (this.closed) { const gx = x, gz = z; for (let i = 0; i < rx.length; i++) { rx[i] -= gx * rs[i] / L; rz[i] -= gz * rs[i] / L; } }
    // resample uniformly
    const N = Math.ceil(L / 0.5), ds = L / N; this.N = N; this.ds = ds;
    const xs = new Float32Array(N + 1), zs = new Float32Array(N + 1), hs = new Float32Array(N + 1), ks = new Float32Array(N + 1), ys = new Float32Array(N + 1);
    let j = 0;
    for (let i = 0; i <= N; i++) {
      const s = i * ds; while (j < rs.length - 2 && rs[j + 1] < s) j++;
      const t = clamp((s - rs[j]) / Math.max(1e-6, rs[j + 1] - rs[j]), 0, 1);
      xs[i] = lerp(rx[j], rx[j + 1], t); zs[i] = lerp(rz[j], rz[j + 1], t); hs[i] = lerp(rh[j], rh[j + 1], t); ks[i] = rk[t < 0.5 ? j : j + 1];
    }
    // recentre
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let i = 0; i <= N; i++) { x0 = Math.min(x0, xs[i]); x1 = Math.max(x1, xs[i]); z0 = Math.min(z0, zs[i]); z1 = Math.max(z1, zs[i]); }
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2; for (let i = 0; i <= N; i++) { xs[i] -= cx; zs[i] -= cz; }
    this.extent = Math.max(x1 - x0, z1 - z0) / 2 + W + 10;
    this.halfX = (x1 - x0) / 2; this.halfZ = (z1 - z0) / 2;
    // elevation
    this.hasElev = !!(def.elev && def.elev.length);
    this.ex = def.elevEx || ELEV_EX;                   // visual exaggeration of hill heights
    if (this.hasElev) {
      const kp = def.elev.map(([si, t, y]) => [segStart[si] + t * segs[si].len2, y]).sort((a, b) => a[0] - b[0]);
      if (this.closed) { const f = kp[0], l = kp[kp.length - 1]; kp.unshift([l[0] - L, l[1]]); kp.push([f[0] + L, f[1]]); }
      let m = 0;
      for (let i = 0; i <= N; i++) {
        const s = i * ds; while (m < kp.length - 2 && kp[m + 1][0] < s) m++;
        const a = kp[m], b = kp[Math.min(m + 1, kp.length - 1)];
        const t = b[0] > a[0] ? clamp((s - a[0]) / (b[0] - a[0]), 0, 1) : 0;
        ys[i] = lerp(a[1], b[1], (1 - Math.cos(t * Math.PI)) / 2) * this.ex;
      }
    }
    const gs = new Float32Array(N + 1);
    for (let i = 0; i <= N; i++) { const a = Math.max(0, i - 2), b = Math.min(N, i + 2); gs[i] = (ys[b] - ys[a]) / ((b - a) * ds); }
    Object.assign(this, { xs, zs, hs, ks, ys, gs });
    if (this.hasElev && (def.theme === 'monaco' || def.theme === 'hakone' || def.zones)) {
      // Index the same samples as groundH; beyond this radius all heights fade to zero.
      const cells = new Map(); let radius = W / 2 + 80;
      for (let i = 0; i <= N; i += 4) {
        const cx = Math.floor(xs[i] / 64), cz = Math.floor(zs[i] / 64);
        let column = cells.get(cx); if (!column) cells.set(cx, column = new Map());
        let bucket = column.get(cz); if (!bucket) column.set(cz, bucket = []);
        bucket.push(i); radius = Math.max(radius, W / 2 + 80 + ys[i] * 4);
      }
      if (def.theme === 'hakone') radius = 200;
      // 竜の火口：火口の底（内馬場の中央）まで、最寄りの走路の標本を探す。火口の中心は走路の重心。地平の板は火口の上に穴をあけた輪にする
      if (def.theme === 'dragonCrater') {
        radius = 320; let sx = 0, sz = 0;
        for (let i = 0; i <= N; i++) { sx += xs[i]; sz += zs[i]; }
        this.crater = { x: sx / (N + 1), z: sz / (N + 1), floor: -30 };
      }
      this.groundGrid = { cells, radius };
    }
    let minR = 1e9; for (const g of segs) if (g.r) minR = Math.min(minR, g.r - W / 2);
    if (segs.some(g => g.curve)) for (const curvature of ks) if (curvature > 1e-4) minR = Math.min(minR, 1 / curvature - W / 2);
    this.R = minR < 1e8 ? minR : 150;                  // tightest inner-rail radius (infield depth)
    const fin = def.finish || [0, def.S - 25];
    this.finishS = segStart[fin[0]] + fin[1] * (def.segs ? k : 1);
    const hsg = def.home || 0; this.homeS0 = segStart[hsg]; this.homeS1 = segStart[hsg] + (def.homeLength || segs[hsg].len2);
    // 制御点で描く一本道は、終点側の homeLength をゴール前の直線として扱う
    if (def.points && !this.closed) { this.homeS1 = L; this.homeS0 = L - (def.homeLength || 200); }
    this.S = this.homeS1 - this.homeS0;
    this.stations = (def.stations || []).map(([name, px, pz, major], index) => {
      const factor = k * (def.pointScale || 1.6) * pointRatio;
      const point = new V3(px * factor, 0, pz * factor);
      let best = Infinity, at = 0;
      for (let i = 0; i < rx.length; i++) {
        const distance = (rx[i] - point.x) ** 2 + (rz[i] - point.z) ** 2;
        if (distance < best) { best = distance; at = rs[i]; }
      }
      return { name, major: !!major, s: mod(at, L), index };
    });
    if (this.stations.length) {
      this.finishS = this.stations[0].s;
      this.homeS0 = this.finishS - this.S * 0.7; this.homeS1 = this.homeS0 + this.S;
    }
    this.corners = this.corners || [];
    this.zones = (def.zones || []).map((zone, id) => ({ ...zone, id, start: segStart[zone.seg] + zone.from * segs[zone.seg].len2, end: segStart[zone.seg] + zone.to * segs[zone.seg].len2 }));
  }
  idx(sa) {
    let s, ex = 0;
    if (this.closed) s = mod(sa, this.L); else { s = clamp(sa, 0, this.L); ex = sa - s; }
    const f = s / this.ds, i = Math.min(this.N - 1, Math.floor(f));
    return [i, f - i, ex];
  }
  pos(sa, lane) {
    const [i, t, ex] = this.idx(sa);
    let x = lerp(this.xs[i], this.xs[i + 1], t), z = lerp(this.zs[i], this.zs[i + 1], t);
    const h = lerp(this.hs[i], this.hs[i + 1], t), y = lerp(this.ys[i], this.ys[i + 1], t);
    if (ex) { x += Math.cos(h) * ex; z += Math.sin(h) * ex; }
    const off = (lane - W / 2) * this.sgn;
    return { x: x - Math.sin(h) * off, z: z + Math.cos(h) * off, h, y };
  }
  curv(sa) { return this.ks[this.idx(sa)[0]]; }
  onCurve(sa) { return this.curv(sa) > 1e-4; }
  grade(sa) { return this.hasElev ? this.gs[this.idx(sa)[0]] / this.ex : 0; }   // true gradient (race physics)
  zoneAt(sa) { const s = this.closed ? mod(sa, this.L) : sa; return this.zones.find(z => s >= z.start && s < z.end) || null; }
  visGrade(sa) { return this.hasElev ? this.gs[this.idx(sa)[0]] : 0; }        // exaggerated gradient (visuals)
  // ground height near the course (for sloped courses): follows the nearest course point, fades out with distance
  groundH(x, z) {
    // 天空庭園の浮島は平らな円盤で、坂は虹橋の橋脚で支える。ネオンシティも平らな街で、高架道路を橋脚で支える
    if (!this.hasElev || this.def.theme === 'skyGarden' || this.def.theme === 'neon') return 0;
    let best = 1e18, bi = 0, heightSum = 0, weightSum = 0;
    if (this.groundGrid) {
      const { cells, radius } = this.groundGrid;
      const z0 = Math.floor((z - radius) / 64), z1 = Math.floor((z + radius) / 64);
      for (let cx = Math.floor((x - radius) / 64), x1 = Math.floor((x + radius) / 64); cx <= x1; cx++) {
        const column = cells.get(cx); if (!column) continue;
        for (let cz = z0; cz <= z1; cz++) {
          const bucket = column.get(cz); if (!bucket) continue;
          for (const i of bucket) {
            const dx = this.xs[i] - x, dz = this.zs[i] - z, d = dx * dx + dz * dz;
            if (d < best || (d === best && i < bi)) { best = d; bi = i; }
            if (this.def.theme === 'hakone' && i % 16 === 0 && d < radius * radius) {
              const w = Math.pow(1 - d / (radius * radius), 2) / Math.pow(d + 100, 2);
              heightSum += this.ys[i] * w; weightSum += w;
            }
          }
        }
      }
      if (best >= radius * radius) return 0;
    } else {
      for (let i = 0; i <= this.N; i += 4) { const dx = this.xs[i] - x, dz = this.zs[i] - z, d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } }
    }
    const d = Math.sqrt(best);
    if (this.def.theme === 'dragonCrater') return this.craterH(x, z, bi, d);
    if (this.def.theme === 'hakone') {
      // Blend neighbouring switchbacks away from the road, avoiding cliffs at nearest-path boundaries.
      const y = lerp(this.ys[bi], weightSum ? heightSum / weightSum : 0, THREE.MathUtils.smoothstep(d, 22, 48));
      return (y - 0.12) * (1 - THREE.MathUtils.smoothstep(d, 80, 200));
    }
    const w = 1 - THREE.MathUtils.smoothstep(d, W / 2 + 2, W / 2 + 80 + this.ys[bi] * 4);
    return (this.ys[bi] - 0.12) * w;
  }
  // 竜の火口（ブロモ山）：走路は火口の縁。内側は台地から漏斗形の火口の壁を火口底へ下り、
  // 外側は筋（ガリー）の刻まれた火山の斜面を砂の海（高さ0）へ下る。ホーム直線の外はスタンドの載る台地。
  // craterAt に内外・壁の位置を残す（地面の色分けに使う）
  craterH(x, z, bi, d) {
    const y = this.ys[bi] - 0.12, h = this.hs[bi], c = this.crater, a = Math.atan2(z - c.z, x - c.x);
    const out = ((x - this.xs[bi]) * -Math.sin(h) + (z - this.zs[bi]) * Math.cos(h)) * this.sgn;
    if (out < 0) {
      // 内側：走路の中心から40mまでは台地、その先80mで火口底へ。縁は丸く、上半分が急な漏斗形で、壁に縦の筋
      const t = clamp((d - 40) / 80, 0, 1), k = t < 0.15 ? t * t / 0.15 : 1 - (1 - t) ** 2 / 0.85;
      this.craterAt = { inside: true, t, y };
      return lerp(y, c.floor, k) + Math.sin(a * 23 + d * 0.08) * 0.9 * Math.sin(t * Math.PI);
    }
    // 外側：ホーム直線の外は幅50mの台地。その先は縁が高いほど長い斜面で砂の海へ
    const s = bi * this.ds, off = e => Math.max(this.homeS0 - e, e - this.homeS1, 0);
    const home = 1 - THREE.MathUtils.smoothstep(Math.min(off(s), off(s - this.L)), 0, 40);
    const p0 = W / 2 + 6 + 46 * home, t = THREE.MathUtils.smoothstep(d, p0, p0 + 22 + y * 2.4);
    const gully = Math.sin(a * 37 + Math.sin(a * 5) * 2) * 1.6 * t * (1 - t) * 4;
    this.craterAt = { inside: false, t, y, gully };
    return y * (1 - t) + gully;
  }
}
function tp(sa, lane, y = 0) {
  const q = track.pos(sa, lane), sg = track.sgn;
  return { v: new V3(q.x, q.y + y, q.z), h: q.h, dir: new V3(Math.cos(q.h), 0, Math.sin(q.h)), n: new V3(-Math.sin(q.h) * sg, 0, Math.cos(q.h) * sg) };
}
