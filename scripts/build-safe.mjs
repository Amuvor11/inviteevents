import { execSync, spawnSync } from "node:child_process";

function devServerRunning() {
  try {
    const out = execSync("lsof -ti:3000 2>/dev/null || true", { encoding: "utf8" }).trim();
    return out.length > 0;
  } catch {
    return false;
  }
}

if (devServerRunning()) {
  console.error("\n⛔ Dev-сервер працює на порту 3000.");
  console.error("   Зупиніть його перед build, інакше .next-кеш пошкодиться і CSS перестане завантажуватись.\n");
  console.error("   Зупинити: Ctrl+C у терміналі з npm run dev");
  console.error("   Або:     npm run dev:clean — для чистого перезапуску\n");
  process.exit(1);
}

const result = spawnSync("next", ["build"], { stdio: "inherit", shell: true });
process.exit(result.status ?? 1);
