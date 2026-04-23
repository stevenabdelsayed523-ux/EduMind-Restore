import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import quizRouter from "./quiz";
import socialRouter from "./social";

const router: IRouter = Router();

router.use(healthRouter);
router.use(chatRouter);
router.use(quizRouter);
router.use(socialRouter);

export default router;
