import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
async function settle(page: Page) {
  await expect(page.locator(".board-frame")).not.toHaveClass(/resolving/);
}
async function chooseUpgrade(page: Page) {
  if (await page.locator(".upgrade-card").count()) {
    await page
      .locator('.upgrade-card button[aria-label^="Install"]')
      .first()
      .click();
    await settle(page);
  }
}
async function start(page: Page) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "I know my way around", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Begin cultivation", exact: true })
    .click();
}
async function plant(page: Page) {
  await page.locator('.garden-tile[data-plant=""]:enabled').first().click();
}
async function harvest(page: Page) {
  const rose = page.locator('.garden-tile[data-plant="rose"]:enabled');
  await (
    (await rose.count())
      ? rose.first()
      : page.locator('.garden-tile:not([data-plant=""]):enabled').first()
  ).click();
  await page.getByRole("button", { name: /Harvest · \d+ pts/ }).click();
}
async function finish(page: Page, turn: number) {
  for (let n = turn; n < 25; n++) {
    await settle(page);
    await chooseUpgrade(page);
    if (
      n < 16 ||
      (await page.locator('.garden-tile:not([data-plant=""])').count()) === 0
    )
      await plant(page);
    else await harvest(page);
  }
  await settle(page);
}
test("first garden teaches real actions, resumes, drafts, pays once and unlocks research", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Grow with M.O.S.S.", exact: true })
    .click();
  await expect(
    page.getByText("Every experiment starts with a seed.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("tile-0")).toBeDisabled();
  await expect(page.getByTestId("tile-8")).toBeEnabled();
  await page.getByTestId("tile-8").click();
  await settle(page);
  await expect(
    page.getByText("Each turn, your garden evolves.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("tile-14")).toHaveAttribute("data-growth", "3");
  await page.reload();
  await page
    .getByRole("button", { name: "Continue your garden", exact: true })
    .click();
  await expect(
    page.getByText("Each turn, your garden evolves.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("turn")).toHaveText("1 / 25");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByText("Neighbors can change everything.", { exact: true }),
  ).toBeVisible();
  await page.getByTestId("tile-15").click();
  await settle(page);
  await page.getByTestId("tile-20").click();
  await expect(page.locator(".forecast-stats strong").first()).toHaveText("80");
  await page
    .getByRole("button", { name: "Harvest · 80 pts", exact: true })
    .click();
  await settle(page);
  await expect(page.getByTestId("score")).toHaveText("80 pts");
  await expect(
    page.getByText("Big reactions wake the reactor.", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".tutorial-instrument")).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await plant(page);
  await settle(page);
  await plant(page);
  await settle(page);
  await expect(page.locator(".upgrade-card")).toHaveCount(3);
  await expect(
    page.getByText("Choose a new way to grow.", { exact: true }),
  ).toBeVisible();
  const choices = await page.locator(".upgrade-card h3").allTextContents();
  await page.reload();
  await page
    .getByRole("button", { name: "Continue your garden", exact: true })
    .click();
  await expect(page.locator(".upgrade-card h3")).toHaveText(choices);
  await chooseUpgrade(page);
  await expect(page.getByTestId("turn")).toHaveText("5 / 25");
  await finish(page, 5);
  await expect(
    page.getByRole("heading", { name: "Cultivation complete.", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("biomass-earned")).toContainText("Biomass");
  await page
    .getByRole("button", { name: /Research your next experiment/ })
    .click();
  await expect(
    page.getByText("New tools. New possibilities.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Research Mycology for 8 Biomass",
      exact: true,
    })
    .click();
  const balance = await page.getByTestId("biomass").innerText();
  await page.reload();
  await page.getByRole("button", { name: "Research lab", exact: true }).click();
  await expect(page.getByTestId("biomass")).toHaveText(balance);
  await expect(
    page.getByRole("button", {
      name: "Research Mycology for 8 Biomass",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(
    page.getByText("New tools. New possibilities.", { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page
    .getByRole("button", { name: "Statistics & journal", exact: true })
    .click();
  await expect(page.locator(".history-list article")).toHaveCount(1);
});
test("normal complete game, nonblocking discoveries, unlocked seed pool and returning flow", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await start(page);
  await page.getByTestId("tile-0").click();
  await settle(page);
  await page.getByTestId("tile-1").click();
  await settle(page);
  await expect(page.locator(".discovery-strip")).toContainText("Charged Bloom");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await finish(page, 2);
  const score = await page.getByTestId("final-score").innerText();
  expect(Number(score.replace(/\D/g, ""))).toBeGreaterThan(0);
  await page
    .getByRole("button", { name: /Research your next experiment/ })
    .click();
  await page
    .getByRole("button", {
      name: "Research Mycology for 8 Biomass",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page
    .getByRole("button", { name: "Change protocol or seeds", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Include Mushroom", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Begin cultivation", exact: true })
    .click();
  await page.locator(".seed-library summary").click();
  await expect(page.getByTestId("seed-pool")).toContainText("Mushroom");
  await page.reload();
  await page
    .getByRole("button", { name: "Continue your garden", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Skip guide", exact: true }),
  ).toHaveCount(0);
  await page.locator(".seed-library summary").click();
  await expect(page.getByTestId("seed-pool")).toContainText("Mushroom");
});
test("tutorial skip and settings replay preserve the actual garden and rewards", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Grow with M.O.S.S.", exact: true })
    .click();
  await page.getByTestId("tile-8").click();
  await settle(page);
  await page.getByRole("button", { name: "Skip guide", exact: true }).click();
  await expect(page.getByTestId("turn")).toHaveText("1 / 25");
  await expect(page.getByTestId("tile-0")).toBeEnabled();
  await page.getByRole("button", { name: "Pause game", exact: true }).click();
  await page.getByLabel("M.O.S.S. tips", { exact: true }).uncheck();
  await page
    .getByRole("button", { name: "Replay tutorial", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Begin guided garden", exact: true })
    .click();
  await expect(page.getByTestId("turn")).toHaveText("0 / 25");
  await expect(
    page.getByText("Every experiment starts with a seed.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Continue your garden", exact: true })
    .click();
  await page.getByRole("button", { name: "Pause game", exact: true }).click();
  await expect(
    page.getByLabel("M.O.S.S. tips", { exact: true }),
  ).not.toBeChecked();
});
test("direct harvest preview, cancel, arrow keys and exact event playback", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await start(page);
  await page.keyboard.press("2");
  await expect(page.getByRole("button", { name: /^Seed 2:/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByTestId("tile-0").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("tile-1")).toBeFocused();
  await page.getByTestId("tile-0").click();
  await settle(page);
  await page.getByTestId("tile-20").click();
  await expect(page.getByTestId("turn")).toHaveText("1 / 25");
  await expect(page.locator(".forecast-stats strong").first()).toHaveText("73");
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("harvest-preview")).toHaveCount(0);
  await page.keyboard.press("h");
  await expect(page.getByTestId("harvest-preview")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByTestId("tile-20").click();
  await page
    .getByRole("button", { name: "Harvest · 73 pts", exact: true })
    .click();
  await expect(page.locator(".board-frame")).toHaveClass(/resolving/);
  await expect(page.getByTestId("tile-14")).toBeDisabled();
  await page
    .getByRole("button", { name: "Skip playback", exact: true })
    .click();
  await settle(page);
  await expect(page.getByTestId("score")).toHaveText("73 pts");
  await expect(page.locator(".chain-feedback")).toContainText("3-plant chain");
  await page.locator(".event-journal summary").click();
  await expect(page.locator(".event-journal")).toContainText(
    "Clover stabilization",
  );
});
test("compact collections hide secrets, show locked research and preserve settings", async ({
  page,
}) => {
  await start(page);
  await page
    .getByRole("button", { name: "About selected seed", exact: true })
    .click();
  await expect(page.locator(".specimen-rule")).toBeVisible();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByRole("button", { name: "Field guide", exact: true }).click();
  await expect(page.locator(".guide-grid button")).toHaveCount(8);
  await page.getByRole("button", { name: "Mutations", exact: true }).click();
  await expect(page.locator(".mutation-catalogue .unknown")).toHaveCount(10);
  await expect(page.locator(".cabinet-detail")).not.toContainText(
    "Ripe Rose beside",
  );
  await page.getByRole("button", { name: "Reactor", exact: true }).click();
  await expect(page.locator(".collection")).toContainText("Overload at 100");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByRole("button", { name: "Research lab", exact: true }).click();
  await expect(page.locator(".research-purchase:enabled")).toHaveCount(0);
  await page.getByRole("button", { name: "Reactions", exact: true }).click();
  await expect(page.locator(".research-node")).toHaveCount(3);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByRole("button", { name: "Pause game", exact: true }).click();
  await page.getByLabel("Garden sounds").check();
  await page.getByLabel("Gentle motion only").check();
  await page
    .getByRole("button", { name: "Back to the garden", exact: true })
    .click();
  await page.reload();
  await page
    .getByRole("button", { name: "Continue your garden", exact: true })
    .click();
  await page.getByRole("button", { name: "Pause game", exact: true }).click();
  await expect(page.getByLabel("Garden sounds")).toBeChecked();
  await expect(page.getByLabel("Gentle motion only")).toBeChecked();
});
test("responsive board, reachable choices and locked protocols on a fresh profile", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page
    .getByRole("button", { name: "I know my way around", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Volatile Experiment/ }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: /Symbiotic Growth/ }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Include Mushroom", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Begin cultivation", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const board = await page.locator(".board-frame").boundingBox();
  expect(board!.width).toBeGreaterThan(290);
  await expect(page.locator(".seed-card")).toHaveCount(3);
  if ((page.viewportSize()?.width ?? 1000) < 500)
    expect(
      (await page.locator(".seed-card").last().boundingBox())!.y +
        (await page.locator(".seed-card").last().boundingBox())!.height,
    ).toBeLessThan(page.viewportSize()!.height);
  const originalViewport = page.viewportSize()!;
  for (const viewport of [
    { width: 320, height: 740 },
    { width: 390, height: 664 },
    { width: 768, height: 1024 },
    { width: 1280, height: 720 },
  ]) {
    await page.setViewportSize(viewport);
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    const choices = await page.locator(".seed-card").last().boundingBox();
    expect(choices!.y + choices!.height).toBeLessThan(viewport.height);
  }
  await page.setViewportSize(originalViewport);
  if (testInfo.project.name === "mobile") {
    await page.getByTestId("tile-0").tap();
    await settle(page);
    await expect(page.getByTestId("turn")).toHaveText("1 / 25");
  }
  expect(errors).toEqual([]);
});
