import type { PlantKind } from "../engine/types";
export function PlantArt({
  kind,
  growth = 3,
  decorative = false,
}: {
  kind: PlantKind;
  growth?: number;
  decorative?: boolean;
}) {
  const stem = "#466b48",
    leaf = "#7f9b68";
  return (
    <svg
      className={`plant-art plant-${kind} growth-${growth}`}
      viewBox="0 0 100 108"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="50" cy="96" rx="25" ry="5" fill="#234a38" opacity=".12" />
      {growth < 2 && !decorative ? (
        <g stroke={stem} strokeWidth="3" strokeLinecap="round">
          <path d="M50 93V58" />
          <path d="M49 78Q21 80 26 58Q47 54 49 78" fill={leaf} />
          <path d="M51 67Q77 70 75 48Q54 46 51 67" fill="#a4b57a" />
          {growth === 1 && (
            <circle
              cx="50"
              cy="48"
              r="9"
              fill={
                kind === "rose"
                  ? "#c27a80"
                  : kind === "sunflower"
                    ? "#d8b153"
                    : "#aaa0b6"
              }
              stroke="none"
            />
          )}
        </g>
      ) : (
        <g className="plant-sway">
          {kind !== "cactus" && kind !== "mushroom" && (
            <g stroke={stem} strokeWidth="3" strokeLinecap="round">
              <path d="M50 94V43" />
              <path d="M49 79Q25 82 25 64Q45 62 49 79" fill={leaf} />
              <path d="M51 68Q76 70 75 52Q55 51 51 68" fill="#9bac76" />
            </g>
          )}
          {kind === "sunflower" && (
            <g>
              {Array.from({ length: 10 }, (_, i) => (
                <ellipse
                  key={i}
                  cx="50"
                  cy="22"
                  rx="8"
                  ry="17"
                  fill={i % 2 ? "#e0b650" : "#efc66a"}
                  transform={`rotate(${i * 36} 50 40)`}
                />
              ))}
              <circle cx="50" cy="40" r="16" fill="#79553c" />
              <circle cx="46" cy="36" r="2" fill="#c29957" />
              <circle cx="55" cy="40" r="2" fill="#c29957" />
              <circle cx="48" cy="46" r="2" fill="#c29957" />
            </g>
          )}
          {kind === "rose" && (
            <g>
              <path d="M35 55L28 36L46 42L57 28L68 48L60 59Z" fill="#648355" />
              <path
                d="M50 18C27 13 22 35 33 49C43 65 68 58 74 39C81 19 60 11 50 18"
                fill="#c47a7f"
              />
              <path
                d="M31 32Q54 49 66 22M37 49Q34 25 58 25Q74 37 54 48Q40 53 43 37Q48 29 57 36"
                fill="none"
                stroke="#a4505c"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path d="M50 56L53 46" stroke="#8d4352" strokeWidth="2" />
            </g>
          )}
          {kind === "mushroom" && (
            <g>
              <path
                d="M40 49L37 89Q50 100 64 89L59 48Z"
                fill="#e0cbb1"
                stroke="#baaa93"
                strokeWidth="2"
              />
              <path d="M16 54C21 1 79 0 85 54Q52 69 16 54" fill="#a784a4" />
              <path d="M16 54Q48 47 85 54Q54 69 16 54" fill="#d8b5c8" />
              <circle cx="39" cy="29" r="6" fill="#eee3d6" />
              <circle cx="62" cy="35" r="7" fill="#eee3d6" />
              <circle cx="28" cy="46" r="4" fill="#eee3d6" />
            </g>
          )}
          {kind === "cactus" && (
            <g stroke="#527560" strokeWidth="2">
              <path d="M38 94V38C38 17 62 17 62 38V94Z" fill="#80a389" />
              <path
                d="M39 71H26Q17 71 17 61V49Q17 40 26 44V56Q26 62 39 60M61 58H74Q85 58 85 47V38Q85 31 77 34V44Q77 49 61 47"
                fill="#80a389"
              />
              <path
                d="M49 91V35M56 89V40M25 51L29 48M72 44L68 40M41 48L35 44M62 77L68 72M40 82L34 79"
                fill="none"
                opacity=".7"
              />
              <path
                d="M43 25Q31 10 43 11L49 20Q54 6 61 13L56 25"
                fill="#d7969a"
                stroke="#bb727e"
              />
            </g>
          )}
          {kind === "clover" && (
            <g>
              <path
                d="M50 78Q20 63 27 43Q38 30 51 46Q61 23 76 35Q91 52 63 66Q85 75 71 88Q56 99 50 78"
                fill="#8da65c"
                stroke="#658647"
                strokeWidth="2"
              />
              <path
                d="M50 64Q25 65 19 50Q14 31 32 30Q49 28 50 52Q40 24 54 18Q75 12 75 32Q76 49 50 64"
                fill="#9eb573"
                stroke="#658647"
                strokeWidth="2"
              />
              <path
                d="M50 92V61M50 61L29 43M50 61L62 30M50 61L70 45M50 61L65 80"
                stroke="#648345"
                strokeWidth="2"
                fill="none"
              />
            </g>
          )}
          {kind === "wildflower" && (
            <g>
              <path
                d="M49 87L29 54M51 79L73 40"
                stroke={stem}
                strokeWidth="2"
              />
              {[
                [49, 31, 12],
                [27, 51, 9],
                [74, 37, 9],
              ].map(([x, y, r], i) => (
                <g key={i}>
                  {Array.from({ length: 5 }, (_, j) => (
                    <ellipse
                      key={j}
                      cx={x}
                      cy={y - r + 2}
                      rx={r * 0.52}
                      ry={r * 0.76}
                      fill={i === 1 ? "#b1b3ca" : "#939abc"}
                      transform={`rotate(${j * 72} ${x} ${y})`}
                    />
                  ))}
                  <circle cx={x} cy={y} r={r * 0.35} fill="#e8c979" />
                </g>
              ))}
            </g>
          )}
        </g>
      )}
    </svg>
  );
}
