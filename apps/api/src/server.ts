import { app } from "./app";
import { connectDatabase } from "./config/db";
import { env } from "./config/env";
import { seedDefaults } from "./services/bootstrap";

const start = async () => {
  await connectDatabase();
  await seedDefaults();

  app.listen(env.port, () => {
    console.log(`Scooter API listening on port ${env.port}`);
  });
};

start().catch((error) => {
  console.error("Failed to start API", error);
  process.exit(1);
});
