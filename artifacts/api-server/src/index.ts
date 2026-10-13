import app from "./app";
import { startFulfillmentSweeper } from "./lib/fulfillment-sweeper.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  // Started here rather than in app.ts so importing the app does not start
  // timers that talk to Airalo.
  startFulfillmentSweeper();
});
