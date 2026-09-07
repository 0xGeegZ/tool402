import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import postcss from "postcss";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

function parseStylesheet(stylesheet) {
  return postcss.parse(stylesheet);
}

function findDirectRule(container, selector) {
  const normalizedSelector = selector.replace(/\s+/gu, "");

  return container.nodes?.find(
    (node) =>
      node.type === "rule" &&
      node.selector.replace(/\s+/gu, "") === normalizedSelector,
  );
}

function matchesDeclaration(rule, property, value, important = false) {
  const declaration = rule?.nodes?.find(
    (node) => node.type === "decl" && node.prop === property,
  );

  return (
    declaration?.value === value && Boolean(declaration.important) === important
  );
}

function findReducedMotionMedia(root) {
  return root.nodes?.find(
    (node) =>
      node.type === "atrule" &&
      node.name === "media" &&
      node.params.replace(/\s+/gu, "") === "(prefers-reduced-motion:reduce)",
  );
}

function hasScopedReducedMotionRules(stylesheet) {
  const root = parseStylesheet(stylesheet);
  const media = findReducedMotionMedia(root);
  const documentRule = media && findDirectRule(media, "html");
  const generatedElementRule =
    media && findDirectRule(media, "*,*::before,*::after");

  return (
    matchesDeclaration(documentRule, "scroll-behavior", "auto") &&
    matchesDeclaration(
      generatedElementRule,
      "animation-duration",
      "0.01ms",
      true,
    ) &&
    matchesDeclaration(
      generatedElementRule,
      "animation-iteration-count",
      "1",
      true,
    ) &&
    matchesDeclaration(
      generatedElementRule,
      "transition-duration",
      "0.01ms",
      true,
    )
  );
}

function hasOverflowMask(root) {
  let found = false;

  root.walkDecls((declaration) => {
    if (
      /^overflow(?:-(?:[xy]|inline|block))?$/iu.test(declaration.prop) &&
      /(?:^|\s)(?:hidden|clip)(?:\s|$)/iu.test(declaration.value)
    ) {
      found = true;
    }
  });

  return found;
}

test("preserves the shared focus and landmark seams without masking overflow", async () => {
  const [stylesheet, layout, navigation] = await Promise.all([
    readAppFile("src/app/globals.css"),
    readAppFile("src/app/layout.tsx"),
    readAppFile("src/components/discovery/local-navigation.tsx"),
  ]);

  const root = parseStylesheet(stylesheet);
  const focusRule = findDirectRule(root, ":focus-visible");

  assert.equal(
    matchesDeclaration(focusRule, "outline", "2px solid var(--ring)"),
    true,
  );
  assert.equal(
    matchesDeclaration(focusRule, "outline-offset", "3px"),
    true,
  );
  assert.equal(hasOverflowMask(root), false);
  assert.match(layout, /<header\s+aria-label=["']Tool402["']/u);
  assert.match(navigation, /<nav\s+aria-label=["']Main navigation["']/u);
});

test("honors reduced motion for the document and generated shell elements", async () => {
  const stylesheet = await readAppFile("src/app/globals.css");
  const root = parseStylesheet(stylesheet);
  const documentRule = findDirectRule(root, "html");

  assert.equal(matchesDeclaration(documentRule, "scroll-behavior", "smooth"), true);
  assert.equal(hasScopedReducedMotionRules(stylesheet), true);
});

test("does not accept reduced-motion rules outside their media query", () => {
  const incorrectlyScopedStylesheet = `
    @media (prefers-reduced-motion: reduce) {}

    html {
      scroll-behavior: auto;
    }

    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  `;

  assert.equal(hasScopedReducedMotionRules(incorrectlyScopedStylesheet), false);
});

test("detects global overflow masking", () => {
  const stylesheet = parseStylesheet(`
    html {
      overflow: clip;
    }
  `);

  assert.equal(hasOverflowMask(stylesheet), true);
});

test("detects case-insensitive and logical overflow masking", () => {
  const uppercasePhysicalMask = parseStylesheet(`
    html {
      OVERFLOW-X: hidden;
    }
  `);
  const logicalMask = parseStylesheet(`
    html {
      overflow-inline: clip;
    }
  `);
  const logicalBlockMask = parseStylesheet(`
    html {
      overflow-block: hidden;
    }
  `);

  assert.equal(hasOverflowMask(uppercasePhysicalMask), true);
  assert.equal(hasOverflowMask(logicalMask), true);
  assert.equal(hasOverflowMask(logicalBlockMask), true);
});
