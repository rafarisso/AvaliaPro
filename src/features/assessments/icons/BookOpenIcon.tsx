import type { SVGProps } from "react";

export default function BookOpenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 5.5A2.25 2.25 0 0 1 6 3.25h5.25v17.5H6A2.25 2.25 0 0 0 3.75 18.5V5.5Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 5.5A2.25 2.25 0 0 0 18 3.25h-5.25v17.5H18a2.25 2.25 0 0 1 2.25-2.25V5.5Z"
      />
    </svg>
  );
}
