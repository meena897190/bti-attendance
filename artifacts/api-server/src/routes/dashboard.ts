import { Router, type IRouter } from "express";
import { eq, sql, and, gte } from "drizzle-orm";
import { db, studentsTable, subjectsTable, branchesTable, attendanceTable } from "@workspace/db";
import { GetSubjectStatsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];

  const [studentCount] = await db.select({ count: sql<number>`count(*)::int` }).from(studentsTable);
  const [branchCount] = await db.select({ count: sql<number>`count(*)::int` }).from(branchesTable);
  const [subjectCount] = await db.select({ count: sql<number>`count(*)::int` }).from(subjectsTable);
  const [totalAttendance] = await db.select({ count: sql<number>`count(*)::int` }).from(attendanceTable);

  const todayRecords = await db
    .select({ status: attendanceTable.status })
    .from(attendanceTable)
    .where(eq(attendanceTable.date, today));

  const presentToday = todayRecords.filter(r => r.status === "present").length;
  const absentToday = todayRecords.filter(r => r.status === "absent").length;
  const totalToday = todayRecords.length;
  const percentageToday = totalToday > 0 ? Math.round((presentToday / totalToday) * 100 * 10) / 10 : 0;

  const allRecords = await db.select({ status: attendanceTable.status }).from(attendanceTable);
  const totalPresent = allRecords.filter(r => r.status === "present").length;
  const totalAll = allRecords.length;
  const overallPercentage = totalAll > 0 ? Math.round((totalPresent / totalAll) * 100 * 10) / 10 : 0;

  res.json({
    totalStudents: studentCount?.count ?? 0,
    totalBranches: branchCount?.count ?? 0,
    totalSubjects: subjectCount?.count ?? 0,
    presentToday,
    absentToday,
    attendancePercentageToday: percentageToday,
    totalAttendanceRecords: totalAttendance?.count ?? 0,
    overallAttendancePercentage: overallPercentage,
  });
});

router.get("/dashboard/branch-stats", async (_req, res): Promise<void> => {
  const branches = await db.select().from(branchesTable);

  const stats = await Promise.all(
    branches.map(async (branch) => {
      const [studentCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(studentsTable)
        .where(eq(studentsTable.branchId, branch.id));

      const records = await db
        .select({ status: attendanceTable.status })
        .from(attendanceTable)
        .where(eq(attendanceTable.branchId, branch.id));

      const presentCount = records.filter(r => r.status === "present").length;
      const absentCount = records.filter(r => r.status === "absent").length;
      const total = records.length;
      const percentage = total > 0 ? Math.round((presentCount / total) * 100 * 10) / 10 : 0;

      return {
        branchId: branch.id,
        branchName: branch.name,
        branchCode: branch.code,
        studentCount: studentCount?.count ?? 0,
        presentCount,
        absentCount,
        attendancePercentage: percentage,
      };
    })
  );

  res.json(stats);
});

router.get("/dashboard/attendance-trend", async (_req, res): Promise<void> => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDate = thirtyDaysAgo.toISOString().split("T")[0];

  const records = await db
    .select({ date: attendanceTable.date, status: attendanceTable.status })
    .from(attendanceTable)
    .where(gte(attendanceTable.date, startDate))
    .orderBy(attendanceTable.date);

  // Group by date
  const byDate = new Map<string, { present: number; absent: number }>();
  for (const r of records) {
    const d = byDate.get(r.date) ?? { present: 0, absent: 0 };
    if (r.status === "present") d.present++;
    else d.absent++;
    byDate.set(r.date, d);
  }

  const trend = Array.from(byDate.entries()).map(([date, counts]) => ({
    date,
    present: counts.present,
    absent: counts.absent,
    total: counts.present + counts.absent,
  }));

  res.json(trend);
});

router.get("/dashboard/subject-stats", async (req, res): Promise<void> => {
  const query = GetSubjectStatsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = query.data.branchId
    ? [eq(subjectsTable.branchId, query.data.branchId)]
    : [];

  const subjects = await db
    .select({
      id: subjectsTable.id,
      name: subjectsTable.name,
      code: subjectsTable.code,
      branchId: subjectsTable.branchId,
      branchName: branchesTable.name,
    })
    .from(subjectsTable)
    .leftJoin(branchesTable, eq(subjectsTable.branchId, branchesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const stats = await Promise.all(
    subjects.map(async (subject) => {
      const records = await db
        .select({ status: attendanceTable.status })
        .from(attendanceTable)
        .where(eq(attendanceTable.subjectId, subject.id));

      const presentCount = records.filter(r => r.status === "present").length;
      const absentCount = records.filter(r => r.status === "absent").length;
      const total = records.length;
      const percentage = total > 0 ? Math.round((presentCount / total) * 100 * 10) / 10 : 0;

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        subjectCode: subject.code,
        branchId: subject.branchId,
        branchName: subject.branchName ?? "",
        presentCount,
        absentCount,
        attendancePercentage: percentage,
      };
    })
  );

  res.json(stats);
});

export default router;
