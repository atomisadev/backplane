import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import { api } from "./api";

type LBAuthResult = { token: string } | { error: string; reason: string };

export const client = createClient({
  authEndpoint: async (room?: string): Promise<LBAuthResult> => {
    const { data, error } = await api.api.liveblocks.auth.post({
      room: room ?? "",
    });

    if (error) {
      return {
        error: error.value ? JSON.stringify(error.value) : "Unauthorized",
        reason: JSON.stringify(error.value),
      };
    }

    const token =
      typeof (data as any)?.token === "string"
        ? (data as any).token
        : typeof (data as any)?.data?.token === "string"
          ? (data as any).data.token
          : null;

    if (!token) {
      return {
        error: "Liveblocks auth: missing token in response",
        reason: "Liveblocks auth: missing token in response",
      };
    }

    return { token };
  },
});

type Presence = {
  cursor: { x: number; y: number } | null;
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
};

type Storage = {
  pendingChanges: Array<{
    type:
      | "CREATE_COLUMN"
      | "CREATE_TABLE"
      | "UPDATE_COLUMN"
      | "DROP_TABLE"
      | "DELETE_COLUMN";
    schema: string;
    table: string;
    column?: {
      name: string;
      type: string;
      nullable: boolean;
      defaultValue?: string;
    };
    oldColumn?: {
      name: string;
      type: string;
      nullable: boolean;
      defaultValue?: string;
    };
  }>;
  nodePositions: { [id: string]: { x: number; y: number } };
};

export const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useOthers,
  useUpdateMyPresence,
  useStorage,
  useMutation,
  useBroadcastEvent,
  useEventListener,
} = createRoomContext<Presence, Storage, any, { type: "SCHEMA_PUBLISHED" }>(
  client,
);
