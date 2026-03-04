import express from "express";
import identifyRoute from "./routes/identifyRoute";

const app = express();

app.use(express.json());

app.use("/identify", identifyRoute);

export default app;