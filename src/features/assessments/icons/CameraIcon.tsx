import type { SVGProps } from "react";

export default function CameraIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 7.5h2.004l1.2-2.4A1.5 1.5 0 0 1 9.08 4.5h5.84a1.5 1.5 0 0 1 1.377.9l1.2 2.4H19.5a1.5 1.5 0 0 1 1.5 1.5v8.25a1.5 1.5 0 0 1-1.5 1.5h-15a1.5 1.5 0 0 1-1.5-1.5V9a1.5 1.5 0 0 1 1.5-1.5Z"
      />
      <circle cx={12} cy={12.75} r={3} />
    </svg>
  );
}
