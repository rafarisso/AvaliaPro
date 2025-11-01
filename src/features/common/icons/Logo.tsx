import type { SVGProps } from "react";

export default function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="2" y="2" width="28" height="28" rx="8" fill="#3366FF" />
      <path
        d="M12.5 11.5h6c1.933 0 3.5 1.567 3.5 3.5s-1.567 3.5-3.5 3.5h-6v-7Z"
        fill="white"
      />
      <path
        d="M15 19h4.75A2.25 2.25 0 0 1 22 21.25V24H15v-5Z"
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <text
        x="40"
        y="21"
        fontFamily="Poppins, Arial, sans-serif"
        fontSize="16"
        fontWeight="600"
        fill="#1F2937"
      >
        AvaliaPro
      </text>
    </svg>
  );
}
