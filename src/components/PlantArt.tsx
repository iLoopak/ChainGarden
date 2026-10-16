import { useId } from "react";
import { PLANTS } from "../engine/plants";
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
  const id = useId();
  const accent = PLANTS[kind].color;
  const stem = "#729f79",
    leaf = "#4f7754";
  return (
    <svg
      className={`plant-art plant-${kind} growth-${growth}`}
      viewBox="0 0 100 108"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={id}>
          <stop stopColor={accent} stopOpacity=".5" />
          <stop offset="1" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="94" rx="28" ry="8" fill="#081b16" opacity=".7" />
      {growth === 3 && (
        <ellipse
          className="specimen-aura"
          cx="50"
          cy="56"
          rx="41"
          ry="43"
          fill={`url(#${id})`}
          opacity=".35"
        />
      )}
      <path
        d="M34 94Q50 101 67 94M38 97L31 102M58 98L65 104M48 98V106"
        fill="none"
        stroke="#3c7054"
        strokeWidth="1.4"
      />

      {growth < 2 && !decorative ? (
        <g stroke={stem} strokeWidth="3" strokeLinecap="round">
          <path d="M50 93V58" />
          <path d="M49 78Q21 80 26 58Q47 54 49 78" fill={leaf} />
          <path d="M51 67Q77 70 75 48Q54 46 51 67" fill="#86a96d" />
          {growth === 1 && (
            <circle
              cx="50"
              cy="48"
              r="9"
              fill={
                kind === "rose"
                  ? "#da858c"
                  : kind === "sunflower"
                    ? "#d3b55f"
                    : "#b6a0ce"
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
              <path d="M51 68Q76 70 75 52Q55 51 51 68" fill="#789a60" />
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
                  fill={i % 2 ? "#d4aa4a" : "#edce7c"}
                  transform={`rotate(${i * 36} 50 40)`}
                />
              ))}
              <circle cx="50" cy="40" r="16" fill="#393e24" />
              <circle cx="46" cy="36" r="2" fill="#e9d388" />
              <circle cx="55" cy="40" r="2" fill="#e9d388" />
              <circle cx="48" cy="46" r="2" fill="#e9d388" />
            </g>
          )}
          {kind === "rose" && (
            <g>
              <path d="M35 55L28 36L46 42L57 28L68 48L60 59Z" fill="#436f51" />
              <path
                d="M50 18C27 13 22 35 33 49C43 65 68 58 74 39C81 19 60 11 50 18"
                fill="#c8787d"
              />
              <path
                d="M31 32Q54 49 66 22M37 49Q34 25 58 25Q74 37 54 48Q40 53 43 37Q48 29 57 36"
                fill="none"
                stroke="#874f65"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path d="M50 56L53 46" stroke="#edb1a6" strokeWidth="2" />
            </g>
          )}
          {kind === "mushroom" && (
            <g>
              <path
                d="M40 49L37 89Q50 100 64 89L59 48Z"
                fill="#b3c8ab"
                stroke="#5f8972"
                strokeWidth="2"
              />
              <path d="M16 54C21 1 79 0 85 54Q52 69 16 54" fill="#9778ba" />
              <path d="M16 54Q48 47 85 54Q54 69 16 54" fill="#bca2d6" />
              <circle cx="39" cy="29" r="6" fill="#decaee" />
              <circle cx="62" cy="35" r="7" fill="#decaee" />
              <circle cx="28" cy="46" r="4" fill="#decaee" />
            </g>
          )}
          {kind === "cactus" && (
            <g stroke="#457d68" strokeWidth="2">
              <path d="M38 94V38C38 17 62 17 62 38V94Z" fill="#7eb297" />
              <path
                d="M39 71H26Q17 71 17 61V49Q17 40 26 44V56Q26 62 39 60M61 58H74Q85 58 85 47V38Q85 31 77 34V44Q77 49 61 47"
                fill="#7eb297"
              />
              <path
                d="M49 91V35M56 89V40M25 51L29 48M72 44L68 40M41 48L35 44M62 77L68 72M40 82L34 79"
                fill="none"
                opacity=".7"
              />
              <path
                d="M43 25Q31 10 43 11L49 20Q54 6 61 13L56 25"
                fill="#e6b6b4"
                stroke="#a46f80"
              />
            </g>
          )}
          {kind === "clover" && (
            <g>
              <path
                d="M50 78Q20 63 27 43Q38 30 51 46Q61 23 76 35Q91 52 63 66Q85 75 71 88Q56 99 50 78"
                fill="#7c9b49"
                stroke="#4e7048"
                strokeWidth="2"
              />
              <path
                d="M50 64Q25 65 19 50Q14 31 32 30Q49 28 50 52Q40 24 54 18Q75 12 75 32Q76 49 50 64"
                fill="#a3be68"
                stroke="#4e7048"
                strokeWidth="2"
              />
              <path
                d="M50 92V61M50 61L29 43M50 61L62 30M50 61L70 45M50 61L65 80"
                stroke="#c9dc9a"
                strokeWidth="2"
                fill="none"
              />
            </g>
          )}
          <g
            className="specimen-veins"
            fill="none"
            stroke={accent}
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity=".7"
          >
            {kind === "sunflower" && (
              <>
                <circle cx="50" cy="40" r="11" strokeDasharray="1 4" />
                <path d="M50 57V90M49 77L33 69M51 65L67 57" />
                <circle
                  className="specimen-core"
                  cx="50"
                  cy="40"
                  r="4"
                  fill={accent}
                />
              </>
            )}
            {kind === "rose" && (
              <>
                <path d="M50 58V90M37 35L43 39L48 30M55 44L63 35M49 78L32 69" />
                <circle
                  className="specimen-core"
                  cx="51"
                  cy="37"
                  r="3"
                  fill={accent}
                />
              </>
            )}
            {kind === "mushroom" && (
              <>
                <path d="M24 55L43 61M35 54L47 62M50 53V64M62 54L55 63M76 55L59 61M44 65L43 87M55 66L57 88" />
                <circle
                  className="specimen-core"
                  cx="35"
                  cy="39"
                  r="2.5"
                  fill={accent}
                />
                <circle cx="71" cy="46" r="2" fill={accent} />
              </>
            )}
            {kind === "cactus" && (
              <>
                <path d="M49 37V88M41 63H25V50M61 51H79V40" />
                <circle
                  className="specimen-core"
                  cx="49"
                  cy="52"
                  r="3"
                  fill={accent}
                />
                <circle cx="49" cy="73" r="2" fill={accent} />
              </>
            )}
            {kind === "clover" && (
              <>
                <path d="M50 91V61L33 42M50 61L62 31M50 61L70 45M50 61L66 79" />
                <circle
                  className="specimen-core"
                  cx="50"
                  cy="61"
                  r="4"
                  fill={accent}
                />
              </>
            )}
            {kind === "wildflower" && (
              <>
                <path d="M50 88V35M50 78L74 39M49 86L27 52" />
                <circle
                  className="specimen-core"
                  cx="50"
                  cy="47"
                  r="2"
                  fill={accent}
                />
              </>
            )}
          </g>
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
                      fill={i === 1 ? "#bec9ed" : "#8d9fcc"}
                      transform={`rotate(${j * 72} ${x} ${y})`}
                    />
                  ))}
                  <circle cx={x} cy={y} r={r * 0.35} fill="#e8d9a2" />
                </g>
              ))}
            </g>
          )}
        </g>
      )}
    </svg>
  );
}
