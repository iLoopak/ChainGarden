import { useId } from "react";
import type { ReactNode } from "react";
import type { MossExpression } from "../experience/moss";
import { Icon } from "./Icons";
/** Original M.O.S.S. silhouette: a cracked ceramic seedpod, copper gimbal and one living eye. */
export function MossArt({
  expression = "neutral",
  className = "",
}: {
  expression?: MossExpression;
  className?: string;
}) {
  const id = useId();
  const warning = expression === "warning";
  return (
    <svg
      className={`moss-art moss-${expression} ${className}`}
      data-expression={expression}
      viewBox="0 0 160 160"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={id}>
          <ellipse cx="82" cy="81" rx="33" ry="27" />
        </clipPath>
      </defs>
      <ellipse
        className="moss-shadow"
        cx="79"
        cy="143"
        rx="35"
        ry="5"
        fill="#061a14"
        opacity=".45"
      />
      <g className="moss-float">
        <path
          d="M38 91L23 103L27 113L42 108M118 93L137 101L133 114L117 108"
          fill="#647e68"
          stroke="#a17d55"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          d="M54 120L49 135L62 139M105 121L111 134L98 140"
          fill="none"
          stroke="#b48c61"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M36 60Q38 31 79 31Q120 33 128 69L123 110Q115 130 79 130Q44 128 35 108Z"
          fill="#233e32"
          stroke="#798e6c"
          strokeWidth="3"
        />
        <path
          d="M38 60Q39 31 79 31L76 49L45 71L39 103L35 100Z"
          fill="#c9cfad"
        />
        <path d="M88 33Q117 35 124 57L117 68L104 57L90 55Z" fill="#a9b89a" />
        <path
          d="M43 112L62 119L96 119L116 110L112 122Q78 141 45 120Z"
          fill="#a7b69a"
        />
        <path
          d="M80 33L76 42L82 48L74 53M111 115L104 108L108 102"
          fill="none"
          stroke="#596f57"
          strokeWidth="2"
        />
        <ellipse
          cx="82"
          cy="81"
          rx="36"
          ry="30"
          fill="#0b211b"
          stroke="#b18b60"
          strokeWidth="4"
        />
        <g clipPath={`url(#${id})`}>
          <ellipse cx="81" cy="85" rx="29" ry="22" fill="#14392c" />
          <g className="moss-eye" fill={warning ? "#efc780" : "#c3efd0"}>
            {expression === "happy" ? (
              <path
                d="M65 86Q81 62 99 85"
                fill="none"
                stroke="#c3efd0"
                strokeWidth="8"
                strokeLinecap="round"
              />
            ) : expression === "warning" ? (
              <path d="M65 91L81 65L99 91Z" />
            ) : (
              <ellipse
                cx={expression === "curious" ? 87 : 82}
                cy="81"
                rx={
                  expression === "surprised"
                    ? 16
                    : expression === "curious"
                      ? 10
                      : 12
                }
                ry={expression === "surprised" ? 18 : 14}
              />
            )}
            {expression !== "happy" && (
              <circle
                cx={expression === "curious" ? 88 : 84}
                cy="78"
                r="3"
                fill="#ecffe6"
              />
            )}
          </g>
          {expression === "curious" && (
            <path d="M53 62L104 70" stroke="#2b4938" strokeWidth="7" />
          )}
        </g>
        <circle cx="43" cy="80" r="3" fill="#ccaa76" />
        <circle cx="119" cy="82" r="3" fill="#ccaa76" />
        <path
          d="M60 116H76M82 116H92"
          stroke="#455b45"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <g fill="#617f40">
          <circle cx="47" cy="43" r="11" />
          <circle cx="59" cy="36" r="10" />
          <circle cx="72" cy="36" r="7" />
        </g>
        <path d="M59 36Q44 14 33 24Q35 38 59 36" fill="#a0ba69" />
        <path d="M63 34Q58 9 76 12Q82 26 63 34" fill="#7fa55d" />
        <path d="M67 30L69 15M50 33L37 26" stroke="#d1d3a0" strokeWidth="1.5" />
        <path d="M105 39Q119 20 129 29Q122 42 105 39" fill="#83a666" />
        <path d="M30 105Q24 91 17 96Q15 106 30 105" fill="#8db36d" />
        <circle cx="115" cy="45" r="3" fill="#d5cf98" />
      </g>
    </svg>
  );
}
export function MossCompanion({
  expression = "neutral",
  text,
  hint,
  children,
  onDismiss,
  quiet = false,
}: {
  expression?: MossExpression;
  text?: string;
  hint?: string;
  children?: ReactNode;
  onDismiss?: () => void;
  quiet?: boolean;
}) {
  return (
    <section
      className={`moss-companion ${quiet ? "moss-quiet" : ""}`}
      aria-label="M.O.S.S. companion"
      aria-live="polite"
    >
      <MossArt expression={expression} />
      {text && (
        <div className="moss-speech">
          <span className="moss-name">M.O.S.S.</span>
          <p>{text}</p>
          {hint && <small>{hint}</small>}
          {children}
        </div>
      )}
      {onDismiss && (
        <button
          className="icon-button moss-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss M.O.S.S. tip"
        >
          <Icon name="close" size={14} />
        </button>
      )}
    </section>
  );
}
