import { test, expect } from '@playwright/test';

test.describe('TrendSurf Copilot E2E Tests', () => {
  test('complete demo flow from start to results', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Verify Tourist mode is default
    await expect(page.getByTestId('mode-toggle-tourist')).toHaveClass(/bg-zinc-100/);

    // Verify hero section
    await expect(page.getByTestId('hero-section')).toBeVisible();
    await expect(page.locator('text=TRENDSURF')).toBeVisible();

    // Click Run Demo button
    await page.getByTestId('button-run-demo').click();

    // Wait for pipeline to start (button should show "RUNNING...")
    await expect(page.getByTestId('button-run-demo')).toContainText('RUNNING');

    // Wait for pipeline visualization to appear
    await expect(page.getByTestId('pipeline-visualization')).toBeVisible({
      timeout: 10000,
    });

    // Verify all pipeline nodes exist
    await expect(page.getByTestId('pipeline-node-input')).toBeVisible();
    await expect(page.getByTestId('pipeline-node-research')).toBeVisible();
    await expect(page.getByTestId('pipeline-node-brand_guard')).toBeVisible();
    await expect(page.getByTestId('pipeline-node-copywriter')).toBeVisible();
    await expect(page.getByTestId('pipeline-node-reviewer')).toBeVisible();
    await expect(page.getByTestId('pipeline-node-output')).toBeVisible();

    // Wait for results to appear (timeout: 60 seconds for full pipeline)
    await expect(page.getByTestId('results-view')).toBeVisible({
      timeout: 60000,
    });

    // Verify LinkedIn card
    const linkedInCard = page.getByTestId('card-linkedin');
    await expect(linkedInCard).toBeVisible();
    await expect(linkedInCard.locator('text=LINKEDIN')).toBeVisible();
    await expect(page.getByTestId('copy-linkedin')).toBeVisible();
    await expect(page.getByTestId('download-linkedin')).toBeVisible();

    // Verify X/Twitter card
    const twitterCard = page.getByTestId('card-twitter');
    await expect(twitterCard).toBeVisible();
    await expect(twitterCard.locator('text=X/TWITTER')).toBeVisible();
    await expect(page.getByTestId('twitter-char-count')).toBeVisible();
    await expect(page.getByTestId('copy-twitter')).toBeVisible();
    await expect(page.getByTestId('download-twitter')).toBeVisible();

    // Verify Teams card
    const teamsCard = page.getByTestId('card-teams');
    await expect(teamsCard).toBeVisible();
    await expect(teamsCard.locator('text=TEAMS')).toBeVisible();
    await expect(page.getByTestId('copy-teams')).toBeVisible();
    await expect(page.getByTestId('download-teams')).toBeVisible();

    // Verify compliance checklist
    await expect(page.getByTestId('compliance-section')).toBeVisible();
    await expect(page.getByTestId('compliance-item-0')).toBeVisible();
    await expect(page.getByTestId('compliance-item-1')).toBeVisible();
    await expect(page.getByTestId('compliance-item-2')).toBeVisible();

    // Verify sources section
    await expect(page.getByTestId('sources-section')).toBeVisible();
    await expect(page.getByTestId('source-0')).toBeVisible();

    // Verify Adaptive Card section
    await expect(page.getByTestId('adaptive-card-section')).toBeVisible();
    await expect(page.getByTestId('download-adaptive-card')).toBeVisible();

    // Verify all nodes have completed (no running status)
    const researchNode = page.getByTestId('pipeline-node-research');
    await expect(researchNode).not.toContainText('RUNNING');

    // Switch to Purist mode
    await page.getByTestId('mode-toggle-purist').click();
    await expect(page.getByTestId('mode-toggle-purist')).toHaveClass(/bg-zinc-100/);

    // Verify JSON panel appears in Purist mode
    await expect(page.getByTestId('copy-json-button')).toBeVisible();

    // Verify Developer Console appears in Purist mode
    await expect(page.getByTestId('developer-console')).toBeVisible();

    // Verify console tabs
    await expect(page.getByTestId('console-tabs')).toBeVisible();
    await expect(page.getByTestId('console-tab-envelope')).toBeVisible();
    await expect(page.getByTestId('console-tab-events')).toBeVisible();
    await expect(page.getByTestId('console-tab-artifacts')).toBeVisible();

    // Test copy button (mock clipboard)
    await page.evaluate(() => {
      navigator.clipboard.writeText = async () => {};
    });
    await page.getByTestId('copy-linkedin').click();

    // Verify no errors are shown
    await expect(page.locator('text=error').first()).not.toBeVisible();
  });

  test('topic input and chips work correctly', async ({ page }) => {
    await page.goto('/');

    // Verify topic input
    const topicInput = page.getByTestId('input-topic');
    await expect(topicInput).toBeVisible();

    // Type in topic input
    await topicInput.fill('Custom topic for testing');
    await expect(topicInput).toHaveValue('Custom topic for testing');

    // Click a chip to populate topic
    await page.getByTestId('topic-chip-0').click();
    await expect(topicInput).toHaveValue('AI safety & NIST updates');

    // Verify Generate button is enabled with topic
    await expect(page.getByTestId('button-generate')).toBeEnabled();
  });

  test('mode toggle switches between Tourist and Purist', async ({ page }) => {
    await page.goto('/');

    // Start in Tourist mode
    await expect(page.getByTestId('mode-toggle-tourist')).toHaveClass(/bg-zinc-100/);

    // Switch to Purist
    await page.getByTestId('mode-toggle-purist').click();
    await expect(page.getByTestId('mode-toggle-purist')).toHaveClass(/bg-zinc-100/);
    await expect(page.getByTestId('mode-toggle-tourist')).not.toHaveClass(/bg-zinc-100/);

    // Switch back to Tourist
    await page.getByTestId('mode-toggle-tourist').click();
    await expect(page.getByTestId('mode-toggle-tourist')).toHaveClass(/bg-zinc-100/);
    await expect(page.getByTestId('mode-toggle-purist')).not.toHaveClass(/bg-zinc-100/);
  });
});
