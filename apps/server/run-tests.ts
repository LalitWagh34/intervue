import { resolve } from "node:path";

const serverRoot = import.meta.dir;
const testRoot = resolve(serverRoot, "src/__tests__");
const files = Array.from(
  new Bun.Glob("**/*.test.{ts,tsx}").scanSync({ cwd: testRoot, onlyFiles: true })
).sort();

if (files.length === 0) {
  console.error("No server test files found.");
  process.exit(1);
}

const failures: string[] = [];

// Module mocks and imported service singletons are shared within a Bun process.
// Give every file a fresh module registry so its mocks cannot affect other files.
for (const file of files) {
  console.log(`\nRunning ${file}`);
  const child = Bun.spawn([process.execPath, "test", resolve(testRoot, file)], {
    cwd: serverRoot,
    env: { ...process.env, NODE_ENV: "test" },
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  if ((await child.exited) !== 0) failures.push(file);
}

console.log(`\nServer test files: ${files.length - failures.length} passed, ${failures.length} failed.`);
if (failures.length > 0) {
  console.error(`Failed files:\n${failures.join("\n")}`);
  process.exit(1);
}
