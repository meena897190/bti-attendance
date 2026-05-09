import { Router, type IRouter } from "express";
import { eq, and, ilike, or } from "drizzle-orm";
import { db, studentsTable, branchesTable } from "@workspace/db";
import {
  CreateStudentBody,
  UpdateStudentBody,
  UpdateStudentParams,
  GetStudentParams,
  DeleteStudentParams,
  ListStudentsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/students", async (req, res): Promise<void> => {
  const query = ListStudentsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [];
  if (query.data.branchId) conditions.push(eq(studentsTable.branchId, query.data.branchId));
  if (query.data.year) conditions.push(eq(studentsTable.year, query.data.year));
  if (query.data.section) conditions.push(eq(studentsTable.section, query.data.section));
  if (query.data.search) {
    conditions.push(
      or(
        ilike(studentsTable.name, `%${query.data.search}%`),
        ilike(studentsTable.studentId, `%${query.data.search}%`),
        ilike(studentsTable.email, `%${query.data.search}%`)
      )
    );
  }

  const students = await db
    .select({
      id: studentsTable.id,
      studentId: studentsTable.studentId,
      name: studentsTable.name,
      branchId: studentsTable.branchId,
      branchName: branchesTable.name,
      year: studentsTable.year,
      section: studentsTable.section,
      phone: studentsTable.phone,
      email: studentsTable.email,
      createdAt: studentsTable.createdAt,
    })
    .from(studentsTable)
    .leftJoin(branchesTable, eq(studentsTable.branchId, branchesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(studentsTable.name);

  res.json(students);
});

router.get("/students/:id", async (req, res): Promise<void> => {
  const params = GetStudentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [student] = await db
    .select({
      id: studentsTable.id,
      studentId: studentsTable.studentId,
      name: studentsTable.name,
      branchId: studentsTable.branchId,
      branchName: branchesTable.name,
      year: studentsTable.year,
      section: studentsTable.section,
      phone: studentsTable.phone,
      email: studentsTable.email,
      createdAt: studentsTable.createdAt,
    })
    .from(studentsTable)
    .leftJoin(branchesTable, eq(studentsTable.branchId, branchesTable.id))
    .where(eq(studentsTable.id, params.data.id));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }
  res.json(student);
});

router.post("/students", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = CreateStudentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [student] = await db.insert(studentsTable).values(parsed.data).returning();
  const [full] = await db
    .select({
      id: studentsTable.id,
      studentId: studentsTable.studentId,
      name: studentsTable.name,
      branchId: studentsTable.branchId,
      branchName: branchesTable.name,
      year: studentsTable.year,
      section: studentsTable.section,
      phone: studentsTable.phone,
      email: studentsTable.email,
      createdAt: studentsTable.createdAt,
    })
    .from(studentsTable)
    .leftJoin(branchesTable, eq(studentsTable.branchId, branchesTable.id))
    .where(eq(studentsTable.id, student.id));
  res.status(201).json(full);
});

router.patch("/students/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const params = UpdateStudentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateStudentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [updated] = await db
    .update(studentsTable)
    .set(parsed.data)
    .where(eq(studentsTable.id, params.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Student not found" });
    return;
  }
  const [full] = await db
    .select({
      id: studentsTable.id,
      studentId: studentsTable.studentId,
      name: studentsTable.name,
      branchId: studentsTable.branchId,
      branchName: branchesTable.name,
      year: studentsTable.year,
      section: studentsTable.section,
      phone: studentsTable.phone,
      email: studentsTable.email,
      createdAt: studentsTable.createdAt,
    })
    .from(studentsTable)
    .leftJoin(branchesTable, eq(studentsTable.branchId, branchesTable.id))
    .where(eq(studentsTable.id, params.data.id));
  res.json(full);
});

router.delete("/students/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const params = DeleteStudentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [student] = await db
    .delete(studentsTable)
    .where(eq(studentsTable.id, params.data.id))
    .returning();
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
