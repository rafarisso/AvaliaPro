import type { SVGProps } from "react";

export default function SparklesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4 13.3 8.2 17.5 9.5 13.3 10.8 12 15 10.7 10.8 6.5 9.5 10.7 8.2 12 4Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 15.25 6.75 17 8.5 17.75 6.75 18.5 6 20.25 5.25 18.5 3.5 17.75 5.25 17 6 15.25Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.5 15.5 18.25 17.5 20.25 18.25 18.25 19 17.5 21 16.75 19 14.75 18.25 16.75 17.5 17.5 15.5Z" />
    </svg>
  );
}
