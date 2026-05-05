import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import pickupsRouter from "./pickups";
import jobsRouter from "./jobs";
import receiptsRouter from "./receipts";
import collectorsRouter from "./collectors";
import rewardsRouter from "./rewards";
import integrationsRouter from "./integrations";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(pickupsRouter);
router.use(jobsRouter);
router.use(receiptsRouter);
router.use(collectorsRouter);
router.use(rewardsRouter);
router.use(integrationsRouter);

export default router;
