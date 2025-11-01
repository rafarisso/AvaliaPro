import type { SVGProps } from "react";

export default function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 18.25 8.75 12.5l5.75-5.75" />
    </svg>
  );
}
