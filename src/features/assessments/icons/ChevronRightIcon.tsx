import type { SVGProps } from "react";

export default function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 5.75 15.25 11.5 9.5 17.25" />
    </svg>
  );
}
