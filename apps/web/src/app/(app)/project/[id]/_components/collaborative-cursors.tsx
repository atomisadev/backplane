"use client";

import { useOthers } from "@/lib/liveblocks";
import { useReactFlow } from "@xyflow/react";
import React from "react";

// Generate a color based on connectionId
function getColorForConnectionId(connectionId: number): string {
  const colors = [
    "#3b82f6", // blue
    "#ef4444", // red
    "#10b981", // green
    "#f59e0b", // amber
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#f97316", // orange
  ];
  return colors[connectionId % colors.length];
}

export function CollaborativeCursors() {
  const others = useOthers();
  const { flowToScreenPosition } = useReactFlow();

  return (
    <>
      {others.map(({ connectionId, presence }) => {
        if (!presence?.cursor) return null;

        const color = getColorForConnectionId(connectionId);
        const screenPos = flowToScreenPosition(presence.cursor);

        return (
          <div
            key={connectionId}
            className="fixed pointer-events-none z-[9999] transition-transform duration-75 ease-out"
            style={{
              left: 0,
              top: 0,
              transform: `translate(${screenPos.x}px, ${screenPos.y}px)`,
            }}
          >
            <svg
              width="24px"
              height="24px"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M17.2607 12.4008C19.3774 11.2626 20.4357 10.6935 20.7035 10.0084C20.9359 9.41393 20.8705 8.74423 20.5276 8.20587C20.1324 7.58551 18.984 7.23176 16.6872 6.52425L8.00612 3.85014C6.06819 3.25318 5.09923 2.95471 4.45846 3.19669C3.90068 3.40733 3.46597 3.85584 3.27285 4.41993C3.051 5.06794 3.3796 6.02711 4.03681 7.94545L6.94793 16.4429C7.75632 18.8025 8.16052 19.9824 8.80519 20.3574C9.36428 20.6826 10.0461 20.7174 10.6354 20.4507C11.3149 20.1432 11.837 19.0106 12.8813 16.7454L13.6528 15.0719C13.819 14.7113 13.9021 14.531 14.0159 14.3736C14.1168 14.2338 14.2354 14.1078 14.3686 13.9984C14.5188 13.8752 14.6936 13.7812 15.0433 13.5932L17.2607 12.4008Z"
                stroke={color}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {/* <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path
                fill={color}
                d="M19.27 15.32 7.77 1.61A1 1 0 0 0 6 2.25v17.89a1 1 0 0 0 1.64.77l3.08-2.58 1.56 4.3a1 1 0 0 0 1.28.6l1.88-.68a1 1 0 0 0 .6-1.28l-1.56-4.3h4.02a1 1 0 0 0 .77-1.64Z"
              ></path>
            </svg> */}
            <div
              className="absolute top-5 left-5 px-1.5 py-0.5 rounded text-white text-[10px] font-medium whitespace-nowrap shadow-sm"
              style={{
                backgroundColor: color,
              }}
            >
              {presence.user?.name || "Anonymous"}
            </div>
          </div>
        );
      })}
    </>
  );
}
