"use client";

import { useOthers } from "@/lib/liveblocks";
import { useMemo } from "react";

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

  return (
    <>
      {others.map(({ connectionId, presence }) => {
        if (!presence?.cursor) return null;

        const color = getColorForConnectionId(connectionId);

        return (
          <div
            key={connectionId}
            className="absolute pointer-events-none z-50 transition-transform"
            style={{
              transform: `translate(${presence.cursor.x}px, ${presence.cursor.y}px)`,
            }}
          >
            <svg
              className="relative"
              width="24"
              height="36"
              viewBox="0 0 24 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 17.95L0.500002 1.47541e-05L5.64645 5.64648L11.1535 11.1535L19.5858 19.5858C20.3679 20.3679 20.7721 21.4331 20.5908 22.4458L18.0862 35.9541C17.9209 36.9118 16.9118 37.9209 15.9541 38.0862C15.2883 38.1863 14.6046 37.9071 14.1248 37.4208L9.40484 32.7008L5.65376 28.9497L5.65376 12.3673Z"
                fill={color}
              />
            </svg>
            <div
              className="absolute top-5 left-1 px-1.5 py-0.5 rounded text-white text-xs whitespace-nowrap"
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
