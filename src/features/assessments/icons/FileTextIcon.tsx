import type { SVGProps } from "react";

export default function FileTextIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.25 3.75H8a1.5 1.5 0 0 0-1.5 1.5v13.5A1.5 1.5 0 0 0 8 20.25h8a1.5 1.5 0 0 0 1.5-1.5V8.25l-3.25-4.5Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 3.75V8.25h4.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 11.25h4.5M9.75 14.25h4.5" />
    </svg>
  );
}
