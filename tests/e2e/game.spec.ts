import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
async function start(page: Page) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Enter the garden", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Begin cultivation", exact: true })
    .click();
}
async function waitAnimations(page: Page) {
  await expect(page.locator(".board-frame")).not.toHaveClass(/resolving/);
}
async function settle(page: Page) {
  await waitAnimations(page);
  if (
    await page
      .getByRole("button", { name: "Continue cultivation", exact: true })
      .isVisible()
  )
    await page
      .getByRole("button", { name: "Continue cultivation", exact: true })
      .click();
  if (await page.locator(".upgrade-card").count()) {
    await page.locator(".upgrade-card").first().click();
    await waitAnimations(page);
  }
}
async function plant(page: Page) {
  await page.getByRole("button", { name: "Plant", exact: true }).click();
  await page.locator('.garden-tile[data-plant=""]:enabled').first().click();
}
async function release(page: Page) {
  await page.getByRole("button", { name: "Harvest", exact: true }).click();
  const rose = page.locator('.garden-tile[data-plant="rose"]:enabled');
  if (await rose.count()) await rose.first().click();
  else
    await page
      .locator('.garden-tile:not([data-plant=""]):enabled')
      .first()
      .click();
  await page.getByRole("button", { name: /Harvest · \d+ pts/ }).click();
}
test("complete progression loop: mutation, interrupted draft, completion, research, unlocked pool and reload", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await start(page);
  await page.getByTestId("tile-0").click();
  await settle(page);
  await page.getByTestId("tile-1").click();
  await waitAnimations(page);
  await expect(
    page.getByRole("heading", { name: "New tissue discovered.", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".discovery-reveal")).toContainText(
    "Charged Bloom",
  );
  await expect(page.locator(".discovery-bonus")).toContainText("+3 Biomass");
  await page
    .getByRole("button", { name: "Continue cultivation", exact: true })
    .click();
  for (let turn = 2; turn < 5; turn++) {
    await plant(page);
    await waitAnimations(page);
    if (
      await page
        .getByRole("button", { name: "Continue cultivation", exact: true })
        .isVisible()
    )
      await page
        .getByRole("button", { name: "Continue cultivation", exact: true })
        .click();
  }
  await expect(page.locator(".upgrade-card")).toHaveCount(3);
  const choices = await page.locator(".upgrade-card h3").allTextContents();
  await page.reload();
  await page
    .getByRole("button", { name: "Continue your garden", exact: true })
    .click();
  await expect(page.locator(".upgrade-card h3")).toHaveText(choices);
  await expect(page.getByTestId("turn")).toHaveText("5 / 25");
  await page.locator(".upgrade-card").first().click();
  await settle(page);
  await expect(page.getByTestId("turn")).toHaveText("5 / 25");
  for (let turn = 5; turn < 25; turn++) {
    await settle(page);
    if (
      turn < 16 ||
      (await page.locator('.garden-tile:not([data-plant=""])').count()) === 0
    )
      await plant(page);
    else await release(page);
  }
  await settle(page);
  await expect(
    page.getByRole("heading", { name: "Cultivation complete.", exact: true }),
  ).toBeVisible();
  const score = await page.getByTestId("final-score").textContent();
  expect(Number(score!.replace(/\D/g, ""))).toBeGreaterThan(0);
  await expect(page.getByTestId("biomass-earned")).toContainText("Biomass");
  await page
    .getByRole("button", { name: /Research your next experiment/ })
    .click();
  await page
    .getByRole("button", {
      name: "Research Mycology for 8 Biomass",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Research Mycology for 8 Biomass",
      exact: true,
    }),
  ).toBeDisabled();
  const balance = await page.getByTestId("biomass").textContent();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page
    .getByRole("button", { name: "Begin next run", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Include Mushroom", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Begin cultivation", exact: true })
    .click();
  await expect(page.getByTestId("seed-pool")).toContainText("Mushroom");
  await page.reload();
  await page
    .getByRole("button", { name: "Continue your garden", exact: true })
    .click();
  await expect(page.getByTestId("seed-pool")).toContainText("Mushroom");
  await page.getByRole("button", { name: "Research lab", exact: true }).click();
  await expect(page.getByTestId("biomass")).toHaveText(balance!);
  await expect(
    page.getByRole("button", {
      name: "Research Mycology for 8 Biomass",
      exact: true,
    }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page
    .getByRole("button", { name: "Open garden journal", exact: true })
    .click();
  await expect(page.locator(".history-list>div")).toHaveCount(1);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByTestId("tile-0").click();
  await settle(page);
  await page.getByTestId("tile-1").click();
  await settle(page);
  await page.reload();
  await page.getByRole("button", { name: "Research lab", exact: true }).click();
  await expect(page.getByTestId("biomass")).toHaveText(balance!);
});
test("restores a turn, shows the collection, pauses and confirms restart", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await start(page);
  await page.getByTestId("tile-0").click();
  await settle(page);
  const kind = await page.getByTestId("tile-0").getAttribute("data-plant");
  await page.reload();
  await page
    .getByRole("button", { name: "Continue your garden", exact: true })
    .click();
  await expect(page.getByTestId("tile-0")).toHaveAttribute("data-plant", kind!);
  await expect(page.getByTestId("turn")).toHaveText("1 / 25");
  await page.getByRole("button", { name: "Field guide", exact: true }).click();
  await expect(page.locator(".guide-grid article")).toHaveCount(4);
  await expect(page.locator(".mutation-catalogue article")).toHaveCount(10);
  await expect(page.locator(".mutation-catalogue .unknown")).toHaveCount(10);
  await page.getByRole("button", { name: "reactor", exact: true }).click();
  await expect(page.locator(".collection")).toContainText("Reaching 100");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByRole("button", { name: "Pause game", exact: true }).click();
  await page.getByLabel("Garden sounds").check();
  await page.getByLabel("Gentle motion only").check();
  await page
    .getByRole("button", { name: "Start a new garden", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Keep this garden", exact: true })
    .click();
  await expect(page.getByTestId("turn")).toHaveText("1 / 25");
  await page.getByRole("button", { name: "Pause game", exact: true }).click();
  await page
    .getByRole("button", { name: "Start a new garden", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Configure a new beginning", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Begin cultivation", exact: true })
    .click();
  await expect(page.getByTestId("turn")).toHaveText("0 / 25");
});
test("keyboard and responsive page work without overflow or runtime errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  await page.keyboard.press("2");
  await expect(page.getByRole("button", { name: /^Seed 2:/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByTestId("tile-20").click();
  await expect(
    page.getByRole("button", { name: /Harvest · \d+ pts/ }),
  ).toBeVisible();
  await page.keyboard.press("h");
  await expect(
    page.getByRole("button", { name: "Harvest", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("p");
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(errors).toEqual([]);
});
test("plays a causal three-plant chain, locks input and supports skipping playback", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await start(page);
  await page.getByTestId("tile-0").click();
  await settle(page);
  await page.getByRole("button", { name: "Harvest", exact: true }).click();
  await page.getByTestId("tile-20").click();
  await expect(page.getByTestId("harvest-preview")).toContainText("73");
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
    "Sunflower activated",
  );
  await expect(page.locator(".event-journal")).toContainText(
    "Clover stabilization",
  );
});
test("inspection and cancellation spend no turn; forecast matches exact result and heat", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await start(page);
  await page.getByRole("button", { name: "Harvest", exact: true }).click();
  await page.getByTestId("tile-20").click();
  await expect(page.locator(".forecast-harvest")).toHaveCount(3);
  await expect(page.getByTestId("turn")).toHaveText("0 / 25");
  await page
    .getByRole("button", { name: "Cancel harvest preview", exact: true })
    .click();
  await expect(page.getByTestId("turn")).toHaveText("0 / 25");
  await page.getByTestId("tile-20").click();
  const points = await page
    .locator(".forecast-stats strong")
    .first()
    .textContent();
  await page.getByRole("button", { name: /Harvest · \d+ pts/ }).click();
  await settle(page);
  await expect(page.getByTestId("turn")).toHaveText("1 / 25");
  await expect(page.getByTestId("score")).toHaveText(`${points} pts`);
  await expect(page.getByTestId("heat")).toHaveText("6 / 100");
});
test("locked specimens, protocols and research cannot be selected on a new profile", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Research lab", exact: true }).click();
  await expect(page.locator(".research-node")).toHaveCount(10);
  await expect(page.locator(".research-purchase:enabled")).toHaveCount(0);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page
    .getByRole("button", { name: "Enter the garden", exact: true })
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
  await expect(page.getByLabel("Containment Trial")).toHaveCount(0);
});
