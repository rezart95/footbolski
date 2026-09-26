import { useId } from "react";
import { cn } from "../../../lib/utils";

/** The landing page's one image: a football cut into a red half and a blue
 * half, the fair split. Drawn like cut paper: the outline is a run of short
 * straight scissor snips, not a compass curve, and the cut follows the ball's
 * own seam so no stray slivers of ink survive it. On load the halves slide
 * apart along the cut (see `.split-ball-*` in index.css). */

type Point = [number, number];

const CENTER: Point = [200, 204];
const RADIUS = 184;
const RED = "#D2231A";
const BLUE = "#1C2E91";

// Fixed offsets so the snipped edge is identical on every render.
const EDGE_JITTER = [
  0.012, -0.018, 0.022, -0.006, 0.019, -0.024, 0.008, 0.021, -0.015, 0.004, -0.022, 0.016, -0.009,
  0.024, -0.017, 0.006, 0.018, -0.02, 0.011, -0.012, 0.023, -0.004, -0.019, 0.014, -0.011, 0.02
];
const PATCH_JITTER = [2.6, -2.2, 1.8, -3, 2.4];

// The scissor line runs down the top seam (x = 200), through the middle patch,
// then wavers slightly through the bottom panel.
const CUT: Point[] = [
  [200, -20],
  [200, 241],
  [203, 330],
  [196, 430]
];

const fmt = ([x, y]: Point) => `${x.toFixed(1)} ${y.toFixed(1)}`;
const polar = (origin: Point, r: number, degrees: number): Point => {
  const a = (degrees * Math.PI) / 180;
  return [origin[0] + r * Math.cos(a), origin[1] + r * Math.sin(a)];
};

/** A circle cut with scissors: straight snips between jittered points. */
function snippedCircle(origin: Point, r: number, jitter: number[]) {
  const n = jitter.length;
  const pts = jitter.map((k, i) => polar(origin, r * (1 + k), (360 / n) * i - 90));
  return `M${pts.map(fmt).join(" L")} Z`;
}

function pentagon(origin: Point, r: number, pointingDeg: number) {
  return [0, 1, 2, 3, 4].map((i) => polar(origin, r + PATCH_JITTER[i], pointingDeg + i * 72));
}

const BALL = snippedCircle(CENTER, RADIUS, EDGE_JITTER);
const HALF_A = `M-20 -20 ${CUT.map((p) => `L${fmt(p)}`).join(" ")} L-20 430 Z`;
const HALF_B = `M420 -20 ${CUT.map((p) => `L${fmt(p)}`).join(" ")} L420 430 Z`;

const MIDDLE_PATCH = pentagon(CENTER, 46, -90);
const OUTER = [0, 1, 2, 3, 4].map((k) => {
  const angle = -90 + k * 72;
  // Held well inside the rim, so a solid band of ink keeps the ball's
  // silhouette and no hairline can form between a patch and the edge.
  const origin = polar(CENTER, 126, angle);
  // Outer patches point back at the middle one, like a real ball's panels.
  return { angle, points: pentagon(origin, 38, angle + 180) };
});

const PATCHES = [MIDDLE_PATCH, ...OUTER.map((o) => o.points)].map(
  (pts) => `M${pts.map(fmt).join(" L")} Z`
);

const SEAMS = OUTER.flatMap(({ points }, k) => {
  const inner = MIDDLE_PATCH[k];
  // points[0] faces the middle patch; points[2] and [3] face the ball's edge.
  const toEdge = [points[2], points[3]].map((p) => {
    const deg = (Math.atan2(p[1] - CENTER[1], p[0] - CENTER[0]) * 180) / Math.PI;
    return [p, polar(CENTER, RADIUS + 20, deg)] as const;
  });
  return [[inner, points[0]] as const, ...toEdge];
}).map(([a, b]) => `M${fmt(a)} L${fmt(b)}`);

/** The patches and seams are cut out of the ink with a mask rather than painted
 * over it in paper colour, so no red or blue fringe survives at their edges. */
function Half({ clipId, maskId, fill }: { clipId: string; maskId: string; fill: string }) {
  return (
    <g clipPath={`url(#${clipId})`}>
      <rect x="-20" y="-20" width="440" height="460" fill={fill} mask={`url(#${maskId})`} />
    </g>
  );
}

export function SplitBall({ className, still = false }: { className?: string; still?: boolean }) {
  const id = useId().replace(/:/g, "");
  const ids = { mask: `${id}-mask`, a: `${id}-a`, b: `${id}-b` };

  return (
    <svg
      viewBox="-24 -20 448 448"
      className={cn(className, still && "split-ball-still")}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <mask id={ids.mask} maskUnits="userSpaceOnUse" x="-20" y="-20" width="440" height="460">
          <path d={BALL} fill="white" />
          {PATCHES.map((d) => (
            <path d={d} fill="black" key={d} />
          ))}
          {SEAMS.map((d) => (
            <path d={d} stroke="black" strokeWidth="7" strokeLinecap="round" fill="none" key={d} />
          ))}
        </mask>
        <clipPath id={ids.a}>
          <path d={HALF_A} />
        </clipPath>
        <clipPath id={ids.b}>
          <path d={HALF_B} />
        </clipPath>
      </defs>
      <g className="split-ball-a">
        <Half clipId={ids.a} maskId={ids.mask} fill={RED} />
      </g>
      <g className="split-ball-b">
        <Half clipId={ids.b} maskId={ids.mask} fill={BLUE} />
      </g>
    </svg>
  );
}
