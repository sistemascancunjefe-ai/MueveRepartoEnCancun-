import { test, expect } from '@playwright/test';

test.describe('Security: XSS Protection in /reparto', () => {
  test('should escape HTML in address and client name to prevent XSS', async ({ page }) => {
    // Malicious payload
    const payload = '<img src=x onerror="window.xss_executed=true">';

    // Initialize IndexedDB with malicious data before the page loads
    await page.addInitScript((maliciousPayload) => {
      const DB_NAME = 'mueve-reparto-db';
      const DB_VERSION = 3;
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('stops')) {
          const stops = db.createObjectStore('stops', { keyPath: 'id' });
          stops.createIndex('status', 'status', { unique: false });
          stops.createIndex('priority', 'priority', { unique: false });
          stops.createIndex('order', 'order', { unique: false });
        }
      };

      request.onsuccess = (e: any) => {
        const db = e.target.result;
        const tx = db.transaction('stops', 'readwrite');
        const store = tx.objectStore('stops');
        store.put({
          id: 'xss-test-1',
          address: maliciousPayload,
          clientName: maliciousPayload,
          priority: 'normal',
          status: 'pending',
          order: 0,
          createdAt: Date.now()
        });
      };
    }, payload);

    await page.goto('/reparto');

    // Wait for the UI to render the stop
    await page.waitForSelector('#next-content p');

    // Check if XSS payload was executed
    const xssExecuted = await page.evaluate(() => (window as any).xss_executed);
    expect(xssExecuted).toBeUndefined();

    // Check if the payload is rendered as literal text in the Next Panel
    const nextAddress = await page.locator('#next-content p').first();
    const nextClient = await page.locator('#next-content p').nth(1);

    await expect(nextAddress).toHaveText(payload);
    await expect(nextClient).toHaveText(payload);

    // Check if the payload is rendered as literal text in the Route List
    const listAddress = await page.locator('.route-stop-row p').first();
    await expect(listAddress).toHaveText(payload);

    // Verify the data-id is also escaped (though id usually doesn't contain HTML, it's good practice)
    const row = await page.locator('.route-stop-row').first();
    const dataId = await row.getAttribute('data-id');
    expect(dataId).toBe('xss-test-1');
  });
});
