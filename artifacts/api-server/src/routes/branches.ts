import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, branchesTable } from "@workspace/db";
import {
  CreateBranchBody,
  UpdateBranchBody,
  UpdateBranchParams,
  GetBranchParams,
  DeleteBranchParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/branches", async (req, res): Promise<void> => {
  const branches = await db
    .select()
    .from(branchesTable)
    .orderBy(branchesTable.name);
  res.json(branches);
});

router.get("/branches/:id", async (req, res): Promise<void> => {
  const params = GetBranchParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [branch] = await db
    .select()
    .from(branchesTable)
    .where(eq(branchesTable.id, params.data.id));
  if (!branch) {
    res.status(404).json({ error: "Branch not found" });
    return;
  }
  res.json(branch);
});

router.post("/branches", async (req, res): Promise<void> => {
  const parsed = CreateBranchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [branch] = await db.insert(branchesTable).values(parsed.data).returning();
  res.status(201).json(branch);
});

router.patch("/branches/:id", async (req, res): Promise<void> => {
  const params = UpdateBranchParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateBranchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [branch] = await db
    .update(branchesTable)
    .set(parsed.data)
    .where(eq(branchesTable.id, params.data.id))
    .returning();
  if (!branch) {
    res.status(404).json({ error: "Branch not found" });
    return;
  }
  res.json(branch);
});

router.delete("/branches/:id", async (req, res): Promise<void> => {
  const params = DeleteBranchParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [branch] = await db
    .delete(branchesTable)
    .where(eq(branchesTable.id, params.data.id))
    .returning();
  if (!branch) {
    res.status(404).json({ error: "Branch not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
