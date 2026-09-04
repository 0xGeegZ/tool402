import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

test("declares the strict Next workspace boundary", async () => {
  const manifest = JSON.parse(await readAppFile("package.json"));

  assert.equal(manifest.name, "@tool402/web");
  assert.equal(manifest.private, true);
  assert.equal(manifest.scripts.typecheck, "next typegen && tsc --noEmit");
  assert.deepEqual(manifest.dependencies, {
    clsx: "2.1.1",
    next: "16.3.4",
    react: "19.2.8",
    "react-dom": "19.2.8",
    "tailwind-merge": "3.6.0",
  });
  assert.deepEqual(manifest.devDependencies, {
    "@tailwindcss/postcss": "4.3.3",
    "@types/node": "22.15.0",
    "@types/react": "19.2.7",
    "@types/react-dom": "19.2.3",
    postcss: "8.5.28",
    tailwindcss: "4.3.3",
    typescript: "5.9.3",
  });
});

test("enables Cache Components without a legacy cache opt-out", async () => {
  const config = await readAppFile("next.config.ts");

  assert.match(config, /cacheComponents\s*:\s*true/);
  assert.doesNotMatch(config, /\b(?:dynamicIO|useCache|dynamic|revalidate|fetchCache)\b/);
});

test("renders only the static Tool402 foundation shell", async () => {
  const [layout, page] = await Promise.all([
    readAppFile("src/app/layout.tsx"),
    readAppFile("src/app/page.tsx"),
  ]);

  assert.match(layout, /import\s+["']\.\/globals\.css["'];/);
  assert.match(layout, /data-ui-shell=["']s00["']/);
  assert.match(layout, /<Logo\b/);
  assert.match(layout, /<html\s+lang=["']en["']>/);
  assert.match(layout, /<body\b/);
  assert.match(page, /<main>/);
  assert.match(page, /Tool402 foundation/);
  assert.doesNotMatch(
    `${layout}\n${page}`,
    /\b(?:wallet|payment|provider|credential|deploy|auth|onboarding|analytics|evidence|metric)\b/i,
  );
});

test("defines the S00 presentational primitives and local wordmark without runtime UI dependencies", async () => {
  const requiredPaths = [
    "src/app/globals.css",
    "postcss.config.mjs",
    "src/components/ui/cn.ts",
    "src/components/ui/button.tsx",
    "src/components/ui/card.tsx",
    "src/components/ui/badge.tsx",
    "src/components/tool402/logo.tsx",
    "public/brand/logo-full.png",
  ];

  for (const path of requiredPaths) {
    await readAppFile(path);
  }

  const [stylesheet, postcss, cn, button, card, badge, logo] = await Promise.all([
    readAppFile("src/app/globals.css"),
    readAppFile("postcss.config.mjs"),
    readAppFile("src/components/ui/cn.ts"),
    readAppFile("src/components/ui/button.tsx"),
    readAppFile("src/components/ui/card.tsx"),
    readAppFile("src/components/ui/badge.tsx"),
    readAppFile("src/components/tool402/logo.tsx"),
  ]);

  assert.match(stylesheet, /@import\s+["']tailwindcss["'];/);
  for (const token of [
    "--background",
    "--brand-purple",
    "--brand-green",
    "--brand-coral",
    "--brand-yellow",
    "--border",
    "--radius",
  ]) {
    assert.match(stylesheet, new RegExp(token));
  }
  assert.match(stylesheet, /:focus-visible/);
  assert.match(postcss, /["']@tailwindcss\/postcss["']/);
  assert.match(cn, /clsx/);
  assert.match(cn, /twMerge/);
  assert.match(button, /<button\b/);
  assert.match(button, /data-slot=["']button["']/);
  assert.match(card, /<section\b/);
  assert.match(card, /data-slot=["']card["']/);
  assert.match(badge, /<span\b/);
  assert.match(badge, /data-slot=["']badge["']/);
  assert.match(logo, /src=["']\/brand\/logo-full\.png["']/);
  assert.match(logo, /alt=["']Tool402["']/);

  const selectedSlice = `${stylesheet}\n${postcss}\n${button}\n${card}\n${badge}\n${logo}`;
  assert.doesNotMatch(
    selectedSlice,
    /@base-ui|class-variance-authority|next\/font|analytics|provider|mock-data|adapter|payment|wallet|toast|theme-provider|tw-animate-css|shadcn/i,
  );
});
