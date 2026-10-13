import { Router, type IRouter } from "express";
import healthRouter from "./health";
import countriesRouter from "./countries";
import authRouter from "./auth";
import ordersRouter from "./orders";
import qpayRouter from "./qpay";
import heroImagesRouter from "./hero-images";
import chatRouter from "./chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use(countriesRouter);
router.use(authRouter);
router.use(ordersRouter);
router.use(qpayRouter);
router.use(heroImagesRouter);
router.use(chatRouter);

export default router;
