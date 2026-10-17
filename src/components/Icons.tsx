export function Icon({
  name,
  size = 20,
}: {
  name:
    | "leaf"
    | "pause"
    | "arrow"
    | "close"
    | "dew"
    | "sun"
    | "sound"
    | "check"
    | "scissors"
    | "book";
  size?: number;
}) {
  const paths = {
    leaf: "M19 4C8 2 3 9 8 14M19 4C21 16 14 21 8 14M5 20L16 7",
    pause: "M8 5V19M16 5V19",
    arrow: "M4 12H20M14 6L20 12L14 18",
    close: "M6 6L18 18M18 6L6 18",
    dew: "M12 3C10 7 5 12 5 16A7 7 0 0020 16C20 12 14 6 12 3Z",
    sun: "M12 3V1M12 23V21M3 12H1M23 12H21M5 5L3 3M21 21L19 19M19 5L21 3M3 21L5 19M17 12A5 5 0 117 12A5 5 0 0117 12",
    sound: "M4 9H8L13 5V19L8 15H4ZM17 8Q23 12 17 16",
    check: "M5 12L10 17L20 6",
    scissors:
      "M10 10L20 3M10 14L20 21M9 9A3 3 0 113 6A3 3 0 019 9M9 15A3 3 0 113 18A3 3 0 019 15",
    book: "M12 5Q6 2 2 5V20Q6 17 12 20Q18 17 22 20V5Q18 2 12 5V20",
  };
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
