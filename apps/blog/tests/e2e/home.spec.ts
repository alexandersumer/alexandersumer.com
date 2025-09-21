import { expect, test } from "@playwright/test";

test.describe("homepage", () => {
  test("shows the hero content and navigation links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Alexander Sumer",
    );
    await expect(
      page.getByRole("link", { name: "Read the blog" }),
    ).toHaveAttribute("href", "/blog/");
    await expect(page.getByRole("link", { name: "Say hello" })).toHaveAttribute(
      "href",
      "mailto:hello@alexandersumer.com",
    );
  });

  test("toggles between light and dark themes", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    const toggle = page.getByRole("button", { name: "Toggle theme" });
    await expect(toggle).toBeVisible();

    const initialHasDark = await html.evaluate((element) =>
      element.classList.contains("dark"),
    );
    await toggle.click();
    await expect
      .poll(async () =>
        page.evaluate(() => window.localStorage.getItem("theme")),
      )
      .toBe(initialHasDark ? "light" : "dark");
    await expect
      .poll(async () =>
        html.evaluate((element) => element.classList.contains("dark")),
      )
      .toBe(!initialHasDark);

    await toggle.click();
    await expect
      .poll(async () =>
        page.evaluate(() => window.localStorage.getItem("theme")),
      )
      .toBe(initialHasDark ? "dark" : "light");
    await expect
      .poll(async () =>
        html.evaluate((element) => element.classList.contains("dark")),
      )
      .toBe(initialHasDark);
  });
});
