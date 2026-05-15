import { Router, type IRouter } from "express";
import { eq, and, gte, lte, ilike, or, sql, desc, asc } from "drizzle-orm";
import { db, attendanceTable, studentsTable, subjectsTable, branchesTable } from "@workspace/db";
import {
  CreateAttendanceBody,
  UpdateAttendanceBody,
  UpdateAttendanceParams,
  DeleteAttendanceParams,
  ListAttendanceQueryParams,
  GetAttendanceReportQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const attendanceWithJoins = {
  id: attendanceTable.id,
  studentId: attendanceTable.studentId,
  studentName: studentsTable.name,
  studentCode: studentsTable.studentId,
  subjectId: attendanceTable.subjectId,
  subjectName: subjectsTable.name,
  branchId: attendanceTable.branchId,
  branchName: branchesTable.name,
  date: attendanceTable.date,
  time: attendanceTable.time,
  status: attendanceTable.status,
  createdAt: attendanceTable.createdAt,
};

router.get("/attendance/report", async (req, res): Promise<void> => {
  const query = GetAttendanceReportQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [
    eq(attendanceTable.branchId, query.data.branchId),
    eq(attendanceTable.subjectId, query.data.subjectId),
  ];
  if (query.data.date) conditions.push(eq(attendanceTable.date, query.data.date));
  if (query.data.startDate) conditions.push(gte(attendanceTable.date, query.data.startDate));
  if (query.data.endDate) conditions.push(lte(attendanceTable.date, query.data.endDate));

  const records = await db
    .select(attendanceWithJoins)
    .from(attendanceTable)
    .leftJoin(studentsTable, eq(attendanceTable.studentId, studentsTable.id))
    .leftJoin(subjectsTable, eq(attendanceTable.subjectId, subjectsTable.id))
    .leftJoin(branchesTable, eq(attendanceTable.branchId, branchesTable.id))
    .where(and(...conditions))
    .orderBy(attendanceTable.date, studentsTable.studentId);

  const [branch] = await db.select().from(branchesTable).where(eq(branchesTable.id, query.data.branchId));
  const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, query.data.subjectId));

  const totalStudents = new Set(records.map(r => r.studentId)).size;
  const presentCount = records.filter(r => r.status === "present").length;
  const absentCount = records.filter(r => r.status === "absent").length;
  const total = records.length;
  const percentage = total > 0 ? Math.round((presentCount / total) * 100 * 10) / 10 : 0;

  res.json({
    collegeName: "Bangalore Technological Institute",
    branchName: branch?.name ?? "",
    subjectName: subject?.name ?? "",
    subjectCode: subject?.code ?? "",
    date: query.data.date ?? (query.data.startDate ? `${query.data.startDate} to ${query.data.endDate}` : "All Dates"),
    facultyName: query.data.facultyName ?? null,
    totalStudents,
    totalPresent: presentCount,
    totalAbsent: absentCount,
    attendancePercentage: percentage,
    records,
  });
});

router.get("/attendance", async (req, res): Promise<void> => {
  const query = ListAttendanceQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [];
  if (query.data.branchId) conditions.push(eq(attendanceTable.branchId, query.data.branchId));
  if (query.data.subjectId) conditions.push(eq(attendanceTable.subjectId, query.data.subjectId));
  if (query.data.studentId) conditions.push(eq(attendanceTable.studentId, query.data.studentId));
  if (query.data.date) conditions.push(eq(attendanceTable.date, query.data.date));
  if (query.data.startDate) conditions.push(gte(attendanceTable.date, query.data.startDate));
  if (query.data.endDate) conditions.push(lte(attendanceTable.date, query.data.endDate));
  if (query.data.status) conditions.push(eq(attendanceTable.status, query.data.status));
  if (query.data.search) {
    conditions.push(
      or(
        ilike(studentsTable.name, `%${query.data.search}%`),
        ilike(studentsTable.studentId, `%${query.data.search}%`)
      )
    );
  }

  const page = query.data.page ?? 1;
  const limit = query.data.limit ?? 50;
  const offset = (page - 1) * limit;

  const orderBy = query.data.sortOrder === "asc" ? asc(attendanceTable.date) : desc(attendanceTable.date);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(attendanceTable)
    .leftJoin(studentsTable, eq(attendanceTable.studentId, studentsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const records = await db
    .select(attendanceWithJoins)
    .from(attendanceTable)
    .leftJoin(studentsTable, eq(attendanceTable.studentId, studentsTable.id))
    .leftJoin(subjectsTable, eq(attendanceTable.subjectId, subjectsTable.id))
    .leftJoin(branchesTable, eq(attendanceTable.branchId, branchesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  res.json({
    records,
    total: countResult?.count ?? 0,
    page,
    limit,
  });
});

router.post("/attendance", async (req, res): Promise<void> => {
  const parsed = CreateAttendanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const inserted = await db
    .insert(attendanceTable)
    .values(parsed.data.records)
    .onConflictDoUpdate({
      target: [attendanceTable.studentId, attendanceTable.subjectId, attendanceTable.date],
      set: {
        status: sql`excluded.status`,
        time: sql`excluded.time`,
        updatedAt: new Date(),
      },
    })
    .returning();

  const ids = inserted.map(r => r.id);
  const records = await db
    .select(attendanceWithJoins)
    .from(attendanceTable)
    .leftJoin(studentsTable, eq(attendanceTable.studentId, studentsTable.id))
    .leftJoin(subjectsTable, eq(attendanceTable.subjectId, subjectsTable.id))
    .leftJoin(branchesTable, eq(attendanceTable.branchId, branchesTable.id))
    .where(sql`${attendanceTable.id} = ANY(${ids})`);

  res.status(201).json(records);
});

router.patch("/attendance/:id", async (req, res): Promise<void> => {
  const params = UpdateAttendanceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateAttendanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [updated] = await db
    .update(attendanceTable)
    .set(parsed.data)
    .where(eq(attendanceTable.id, params.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Attendance record not found" });
    return;
  }
  const [full] = await db
    .select(attendanceWithJoins)
    .from(attendanceTable)
    .leftJoin(studentsTable, eq(attendanceTable.studentId, studentsTable.id))
    .leftJoin(subjectsTable, eq(attendanceTable.subjectId, subjectsTable.id))
    .leftJoin(branchesTable, eq(attendanceTable.branchId, branchesTable.id))
    .where(eq(attendanceTable.id, params.data.id));
  res.json(full);
});

router.delete("/attendance/:id", async (req, res): Promise<void> => {
  const params = DeleteAttendanceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [record] = await db
    .delete(attendanceTable)
    .where(eq(attendanceTable.id, params.data.id))
    .returning();
  if (!record) {
    res.status(404).json({ error: "Attendance record not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
