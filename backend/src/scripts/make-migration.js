import { execSync } from "child_process";

const name = process.argv[2];

if (!name) {
  console.error("\x1b[31m%s\x1b[0m", "Error: Please specify a migration name.");
  console.log("Example: npm run make:migration create-users-table");
  process.exit(1);
}

// Destination path where you want migrations created
const migrationPath = `./src/database/migrations/${name}`;

try {
  execSync(`typeorm migration:create src/migrations/${migrationPath}`, { stdio: "inherit" });
} catch {
  process.exit(1);
}