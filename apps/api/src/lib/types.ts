import { t } from "elysia";

export const ChangesDefinition = t.Array(
  t.Object({
    type: t.Union([
      t.Literal("CREATE_COLUMN"),
      t.Literal("CREATE_TABLE"),
      t.Literal("UPDATE_COLUMN"),
      t.Literal("DROP_TABLE"),
    ]),
    schema: t.String(),
    table: t.String(),
    column: t.Optional(
      t.Object({
        name: t.String(),
        type: t.String(),
        nullable: t.Boolean(),
        defaultValue: t.Optional(t.String()),
      }),
    ),
  }),
);

export type ChangesDefinitionType = typeof ChangesDefinition.static;
