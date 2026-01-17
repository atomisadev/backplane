import { treaty } from "@elysiajs/eden";
import type { App } from "../../../api/src/index";

export const api = treaty<App>("http://localhost:3001", {
  fetch: {
    credentials: "include",
  },
});
