import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, subjectsTable, branchesTable } from "@workspace/db";
import {
  CreateSubjectBody,
  UpdateSubjectBody,
  UpdateSubjectParams,
  DeleteSubjectParams,
  ListSubjectsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/subjects", async (req, res): Promise<void> => {
  const query = ListSubjectsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const subjects = await db
    .select({
      id: subjectsTable.id,
      name: subjectsTable.name,
      code: subjectsTable.code,
      branchId: subjectsTable.branchId,
      branchName: branchesTable.name,
      createdAt: subjectsTable.createdAt,
    })
    .from(subjectsTable)
    .leftJoin(branchesTable, eq(subjectsTable.branchId, branchesTable.id))
    .where(
      query.data.branchId ? eq(subjectsTable.branchId, query.data.branchId) : undefined
    )
    .orderBy(subjectsTable.name);

  res.json(subjects);
});

router.post("/subjects", async (req, res): Promise<void> => {
  const parsed = CreateSubjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [subject] = await db.insert(subjectsTable).values(parsed.data).returning();
  const [full] = await db
    .select({
      id: subjectsTable.id,
      name: subjectsTable.name,
      code: subjectsTable.code,
      branchId: subjectsTable.branchId,
      branchName: branchesTable.name,
      createdAt: subjectsTable.createdAt,
    })
    .from(subjectsTable)
    .leftJoin(branchesTable, eq(subjectsTable.branchId, branchesTable.id))
    .where(eq(subjectsTable.id, subject.id));
  res.status(201).json(full);
});

router.patch("/subjects/:id", async (req, res): Promise<void> => {
  const params = UpdateSubjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateSubjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [updated] = await db
    .update(subjectsTable)
    .set(parsed.data)
    .where(eq(subjectsTable.id, params.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }
  const [full] = await db
    .select({
      id: subjectsTable.id,
      name: subjectsTable.name,
      code: subjectsTable.code,
      branchId: subjectsTable.branchId,
      branchName: branchesTable.name,
      createdAt: subjectsTable.createdAt,
    })
    .from(subjectsTable)
    .leftJoin(branchesTable, eq(subjectsTable.branchId, branchesTable.id))
    .where(eq(subjectsTable.id, params.data.id));
  res.json(full);
});

router.delete("/subjects/:id", async (req, res): Promise<void> => {
  const params = DeleteSubjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [subject] = await db
    .delete(subjectsTable)
    .where(eq(subjectsTable.id, params.data.id))
    .returning();
  if (!subject) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
