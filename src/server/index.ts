import { config } from "dotenv";
import { createServerApp } from "./app";

config();

const port = Number(process.env.PORT ?? 8787);
const app = createServerApp();

app.listen(port, () => {
  process.stdout.write(`[repolaunch-api] online em http://localhost:${port}\n`);
});
