import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
async function start(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Enter the garden" }).click();
}
async function settle(page: Page) {
  await expect(page.locator(".board-frame")).not.toHaveClass(/resolving/);
}
test("plays a complete 25-turn garden and records one result across reload", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await start(page);
  for (let turn = 0; turn < 25; turn++) {
    await settle(page);
    if (
      turn < 16 ||
      (await page.locator('.garden-tile:not([data-plant=""])').count()) === 0
    ) {
      await page.getByRole("button", { name: "Plant", exact: true }).click();
      await page
        .getByRole("button", { name: /^Seed / })
        .nth(turn % 3)
        .click();
      await page.locator('.garden-tile[data-plant=""]').first().click();
    } else {
      await page.getByRole("button", { name: "Harvest", exact: true }).click();
      const rose = page.locator('.garden-tile[data-plant="rose"]');
      if (await rose.count()) await rose.first().click();
      else
        await page.locator('.garden-tile:not([data-plant=""])').first().click();
    }
  }
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("A garden well grown.")).toBeVisible();
  const score = await page.getByTestId("final-score").textContent();
  expect(Number(score!.replace(/\D/g, ""))).toBeGreaterThan(0);
  await page.reload();
  await page.getByRole("button", { name: "Open garden journal" }).click();
  await expect(page.locator(".history-list>div")).toHaveCount(1);
  await expect(page.locator(".history-list")).toContainText(
    score!.trim().replace(" points", " pts"),
  );
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Open garden journal" }).click();
  await expect(page.locator(".history-list>div")).toHaveCount(1);
});
test("restores a turn, shows real guide, pauses and confirms restart", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await start(page);
  await page.getByTestId("tile-0").click();
  await settle(page);
  await expect(page.getByTestId("turn")).toHaveText("1 / 25");
  const plant = await page.getByTestId("tile-0").getAttribute("data-plant");
  await page.reload();
  await page.getByRole("button", { name: "Continue your garden" }).click();
  await expect(page.getByTestId("tile-0")).toHaveAttribute(
    "data-plant",
    plant!,
  );
  await expect(page.getByTestId("turn")).toHaveText("1 / 25");
  await page.getByRole("button", { name: "Field guide" }).click();
  await expect(
    page.getByRole("heading", { name: "The field guide" }),
  ).toBeVisible();
  await expect(page.locator(".guide-grid article")).toHaveCount(6);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Pause game" }).click();
  await page.getByLabel("Garden sounds").check();
  await page.getByLabel("Gentle motion only").check();
  await page.getByRole("button", { name: "Start a new garden" }).click();
  await page.getByRole("button", { name: "Keep this garden" }).click();
  await expect(page.getByTestId("turn")).toHaveText("1 / 25");
  await page.getByRole("button", { name: "Pause game" }).click();
  await page.getByRole("button", { name: "Start a new garden" }).click();
  await page.getByRole("button", { name: "Plant a new beginning" }).click();
  await expect(page.getByTestId("turn")).toHaveText("0 / 25");
});
test("keyboard seed selection, harvest inspection and responsive page have no overflow", async ({
  page,
}) => {
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
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.keyboard.press("p");
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(errors).toEqual([]);
});
test("shows a three-plant chain, locks controls during playback and logs its cause", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await start(page);
  await page.getByTestId("tile-0").click();
  await settle(page);
  await page.getByRole("button", { name: "Harvest", exact: true }).click();
  await page.getByTestId("tile-20").click();
  await expect(page.locator(".board-frame")).toHaveClass(/resolving/);
  await expect(page.getByTestId("tile-14")).toBeDisabled();
  await settle(page);
  await expect(page.getByTestId("score")).toHaveText("73 pts");
  await expect(page.locator(".chain-feedback")).toContainText("3-plant chain");
  await expect(page.locator(".event-journal")).toContainText(
    "Sunflower activated",
  );
  await expect(page.locator(".event-journal")).toContainText("×1.25");
});
