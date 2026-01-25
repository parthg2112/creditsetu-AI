"use client";

import * as React from "react";

export const WormLoader: React.FC = () => {
  const id = React.useId();
  const grad1Id = `grad1-${id}`;
  const grad2Id = `grad2-${id}`;

  return (
    <div className="flex items-center justify-center p-6">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="128px"
        width="256px"
        viewBox="0 0 256 128"
        className="w-40 h-20"
      >
        <defs>
          <linearGradient y2={0} x2={1} y1={0} x1={0} id={grad1Id}>
            <stop stopColor="#FFF4F0" offset="0%" /> {/* Light Rust Base */}
            <stop stopColor="#E8D4D0" offset="33%" /> {/* Soft Clay */}
            <stop stopColor="#DFAFA6" offset="67%" /> {/* Warm Rust */}
            <stop stopColor="#8A5A55" offset="100%" /> {/* Deep Earth */}
          </linearGradient>
          <linearGradient y2={0} x2={0} y1={0} x1={1} id={grad2Id}>
            <stop stopColor="#8A5A55" offset="0%" />
            <stop stopColor="#DFAFA6" offset="33%" />
            <stop stopColor="#E8D4D0" offset="67%" />
            <stop stopColor="#FFF4F0" offset="100%" />
          </linearGradient>
        </defs>
        <g strokeWidth={16} strokeLinecap="round" fill="none">
          {/* Track (light & dark) */}
          <g className="stroke-gray-300 dark:stroke-gray-800 transition-colors">
            <path d="M8,64s0-56,60-56,60,112,120,112,60-56,60-56" />
            <path d="M248,64s0-56-60-56-60,112-120,112S8,64,8,64" />
          </g>

          {/* Worms */}
          <g strokeDasharray="180 656">
            <path
              d="M8,64s0-56,60-56,60,112,120,112,60-56,60-56"
              stroke={`url(#${grad1Id})`}
              className="animate-worm1"
            />
            <path
              d="M248,64s0-56-60-56-60,112-120,112S8,64,8,64"
              stroke={`url(#${grad2Id})`}
              className="animate-worm2"
            />
          </g>
        </g>
      </svg>
    </div>
  );
};
