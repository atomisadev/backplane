import { Elysia, t } from "elysia";
import { requireAPIToken } from "../../middleware/mockAuto.middleware";
import { Prisma } from "@prisma/client";
import { prisma } from "../../db";
import knex from "knex";
import { decrypt } from "../../lib/crypto";
import { mockService } from "./mock.service";

export const mockController = new Elysia({ prefix: "/mock" })
  //   .use(requireAPIToken)
  .get(
    "/:projectID/:tableName",
    async ({ params: { projectID, tableName }, set }) => {
      const project = await prisma.project.findUnique({
        where: { id: projectID },
      });

      if (!project) {
        set.status = 404;
        return { success: false, message: "Project not found." };
      }

      const connectionString = decrypt(project.connectionUri);

      const pg = knex({
        client: "pg",
        connection: connectionString,
        pool: { min: 0, max: 5 },
      });

      try {
        const res = await mockService.findAllRecords(pg, tableName);

        set.status = 200;
        return {
          success: true,
          data: res,
        };
      } catch (e) {
        console.error("Database fetch error:", e);
        set.status = 500;
        return {
          success: false,
          message: "Failed to search datatbase with error: " + e,
        };
      } finally {
        await pg.destroy();
      }
    },
    {
      params: t.Object({
        projectID: t.String(),
        tableName: t.String(),
      }),
    },
  );
//   .get(
//     "/:projectID/:tableName/:schemaName",
//     async ({ params: { projectID, tableName, schemaName }, set }) => {
//       const project = await prisma.project.findUnique({
//         where: { id: projectID },
//       });

//       if (!project) {
//         set.status = 404;
//         return { success: false, message: "Project not found." };
//       }

//       const connectionString = decrypt(project.connectionUri);

//       const pg = knex({
//         client: "pg",
//         connection: connectionString,
//         pool: { min: 0, max: 5 },
//       });

//       try {
//         const res = await mockService.findAllRecordsWithSchema(
//           pg,
//           schemaName,
//           tableName,
//         );

//         set.status = 200;
//         return {
//           success: true,
//           data: res,
//         };
//       } catch (e) {
//         console.error("Database fetch error:", e);
//         set.status = 500;
//         return {
//           success: false,
//           message: "Failed to search datatbase with error: " + e,
//         };
//       } finally {
//         await pg.destroy();
//       }
//     },
//     {
//       params: t.Object({
//         projectID: t.String(),
//         tableName: t.String(),
//         schemaName: t.String(),
//       }),
//     },
//   )
//   .get(
//     "/:projectID/:tableName/:id",
//     async ({ params: { projectID, tableName, id }, set }) => {
//       const project = await prisma.project.findUnique({
//         where: { id: projectID },
//       });

//       if (!project) {
//         set.status = 404;
//         return { success: false, message: "Project not found." };
//       }

//       const connectionString = decrypt(project.connectionUri);

//       const pg = knex({
//         client: "pg",
//         connection: connectionString,
//         pool: { min: 0, max: 5 },
//       });

//       try {
//         const res = await mockService.findRecordWithID(pg, tableName, id);

//         set.status = 200;
//         return {
//           success: true,
//           data: res,
//         };
//       } catch (e) {
//         console.error("Database fetch error:", e);
//         set.status = 500;
//         return {
//           success: false,
//           message: "Failed to search datatbase with error: " + e,
//         };
//       } finally {
//         await pg.destroy();
//       }
//     },
//     {
//       params: t.Object({
//         projectID: t.String(),
//         tableName: t.String(),
//         id: t.Any(),
//       }),
//     },
//   )
//   .get(
//     "/:projectID/:tableName/:id/:schemaName",
//     async ({ params: { projectID, schemaName, tableName, id }, set }) => {
//       const project = await prisma.project.findUnique({
//         where: { id: projectID },
//       });

//       if (!project) {
//         set.status = 404;
//         return { success: false, message: "Project not found." };
//       }

//       const connectionString = decrypt(project.connectionUri);

//       const pg = knex({
//         client: "pg",
//         connection: connectionString,
//         pool: { min: 0, max: 5 },
//       });

//       try {
//         const res = await mockService.findRecordWithIDAndSchema(
//           pg,
//           schemaName,
//           tableName,
//           id,
//         );

//         set.status = 200;
//         return {
//           success: true,
//           data: res,
//         };
//       } catch (e) {
//         console.error("Database fetch error:", e);
//         set.status = 500;
//         return {
//           success: false,
//           message: "Failed to search datatbase with error: " + e,
//         };
//       } finally {
//         await pg.destroy();
//       }
//     },
//     {
//       params: t.Object({
//         projectID: t.String(),
//         schemaName: t.String(),
//         tableName: t.String(),
//         id: t.Any(),
//       }),
//     },
//   )
//   .post(
//     "/:projectID/:tableName",
//     async ({ body, params: { projectID, tableName }, set }) => {
//       const project = await prisma.project.findUnique({
//         where: { id: projectID },
//       });

//       if (!project) {
//         set.status = 404;
//         return { success: false, message: "Project not found." };
//       }

//       const connectionString = decrypt(project.connectionUri);

//       const pg = knex({
//         client: "pg",
//         connection: connectionString,
//         pool: { min: 0, max: 5 },
//       });

//       try {
//         const res = await mockService.addRecord(pg, tableName, body);

//         set.status = 200;
//         return {
//           success: true,
//           data: res,
//         };
//       } catch (e) {
//         console.error("Database fetch error:", e);
//         set.status = 500;
//         return {
//           success: false,
//           message: "Failed to search datatbase with error: " + e,
//         };
//       } finally {
//         await pg.destroy();
//       }
//     },
//     {
//       params: t.Object({
//         projectID: t.String(),
//         tableName: t.String(),
//       }),
//       body: t.Object({}),
//     },
//   )
//   .post(
//     "/:projectID/:tableName/:schemaName",
//     async ({ body, params: { projectID, schemaName, tableName }, set }) => {
//       const project = await prisma.project.findUnique({
//         where: { id: projectID },
//       });

//       if (!project) {
//         set.status = 404;
//         return { success: false, message: "Project not found." };
//       }

//       const connectionString = decrypt(project.connectionUri);

//       const pg = knex({
//         client: "pg",
//         connection: connectionString,
//         pool: { min: 0, max: 5 },
//       });

//       try {
//         const res = await mockService.addRecordWithSchema(
//           pg,
//           schemaName,
//           tableName,
//           body,
//         );

//         set.status = 200;
//         return {
//           success: true,
//           data: res,
//         };
//       } catch (e) {
//         console.error("Database fetch error:", e);
//         set.status = 500;
//         return {
//           success: false,
//           message: "Failed to search datatbase with error: " + e,
//         };
//       } finally {
//         await pg.destroy();
//       }
//     },
//     {
//       params: t.Object({
//         projectID: t.String(),
//         schemaName: t.String(),
//         tableName: t.String(),
//       }),
//       body: t.Object({}),
//     },
//   )
//   .delete(
//     "/:projectID/:tableName/:id",
//     async ({ params: { projectID, tableName, id }, set }) => {
//       const project = await prisma.project.findUnique({
//         where: { id: projectID },
//       });

//       if (!project) {
//         set.status = 404;
//         return { success: false, message: "Project not found." };
//       }

//       const connectionString = decrypt(project.connectionUri);

//       const pg = knex({
//         client: "pg",
//         connection: connectionString,
//         pool: { min: 0, max: 5 },
//       });

//       try {
//         const res = await mockService.deleteRecord(pg, tableName, id);

//         set.status = 200;
//         return {
//           success: true,
//           data: res,
//         };
//       } catch (e) {
//         console.error("Database fetch error:", e);
//         set.status = 500;
//         return {
//           success: false,
//           message: "Failed to search datatbase with error: " + e,
//         };
//       } finally {
//         await pg.destroy();
//       }
//     },
//     {
//       params: t.Object({
//         projectID: t.String(),
//         tableName: t.String(),
//         id: t.Any(),
//       }),
//     },
//   )
//   .delete(
//     "/:projectID/:tableName/:id/:schemaName",
//     async ({ params: { projectID, schemaName, tableName, id }, set }) => {
//       const project = await prisma.project.findUnique({
//         where: { id: projectID },
//       });

//       if (!project) {
//         set.status = 404;
//         return { success: false, message: "Project not found." };
//       }

//       const connectionString = decrypt(project.connectionUri);

//       const pg = knex({
//         client: "pg",
//         connection: connectionString,
//         pool: { min: 0, max: 5 },
//       });

//       try {
//         const res = await mockService.deleteRecordWithSchema(
//           pg,
//           schemaName,
//           tableName,
//           id,
//         );

//         set.status = 200;
//         return {
//           success: true,
//           data: res,
//         };
//       } catch (e) {
//         console.error("Database fetch error:", e);
//         set.status = 500;
//         return {
//           success: false,
//           message: "Failed to search datatbase with error: " + e,
//         };
//       } finally {
//         await pg.destroy();
//       }
//     },
//     {
//       params: t.Object({
//         projectID: t.String(),
//         schemaName: t.String(),
//         tableName: t.String(),
//         id: t.Any(),
//       }),
//     },
//   );
