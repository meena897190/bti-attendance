import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import branchesRouter from "./branches";
import subjectsRouter from "./subjects";
import studentsRouter from "./students";
import attendanceRouter from "./attendance";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(branchesRouter);
router.use(subjectsRouter);
router.use(studentsRouter);
router.use(attendanceRouter);
router.use(dashboardRouter);

export default router;
