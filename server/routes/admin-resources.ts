import express from "express";
import { registerAdminCrudRoutes } from "../lib/crud-factory.js";
import { DEFAULT_DEPARTMENTS, DEFAULT_BOOKS, DEFAULT_JOURNALS } from "../lib/seed-data.js";

const router = express.Router();

registerAdminCrudRoutes(router, {
  resourcePath: "departments",
  table: "departments",
  singular: "department",
  orderColumn: "display_order",
  ascending: true,
  requiredFields: ["name", "slug"],
  defaultData: DEFAULT_DEPARTMENTS,
});

registerAdminCrudRoutes(router, {
  resourcePath: "books",
  table: "books",
  singular: "book",
  orderColumn: "created_at",
  ascending: false,
  requiredFields: ["title", "author"],
  defaultData: DEFAULT_BOOKS,
});

registerAdminCrudRoutes(router, {
  resourcePath: "journals",
  table: "journals",
  singular: "journal",
  orderColumn: "created_at",
  ascending: false,
  requiredFields: ["title"],
  defaultData: DEFAULT_JOURNALS,
});

export default router;
