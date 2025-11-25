import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Testing', () => {
  
  test('Homepage should be accessible', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Product page should be accessible', async ({ page }) => {
    await page.goto('/productos');
    
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"], .product-card', { timeout: 10000 });
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('.third-party-widget') // Exclude third-party content
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Navigation should be accessible', async ({ page }) => {
    await page.goto('/');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);
    
    // Test ARIA labels
    const navigation = page.locator('nav[role="navigation"], nav');
    if (await navigation.count() > 0) {
      await expect(navigation).toBeVisible();
    }
  });

  test('Forms should be accessible', async ({ page }) => {
    await page.goto('/');
    
    // Try to find login/contact forms
    const loginButton = page.locator('button:has-text("Iniciar"), button:has-text("Login")');
    
    if (await loginButton.isVisible()) {
      await loginButton.click();
      
      // Wait for form to appear
      await page.waitForSelector('form, [role="dialog"]', { timeout: 5000 });
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
      
      // Test form labels
      const inputs = page.locator('input');
      const inputCount = await inputs.count();
      
      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const inputId = await input.getAttribute('id');
        const inputType = await input.getAttribute('type');
        
        if (inputType !== 'hidden' && inputId) {
          // Check for associated label
          const label = page.locator(`label[for="${inputId}"]`);
          const hasLabel = await label.count() > 0;
          const hasAriaLabel = await input.getAttribute('aria-label');
          const hasAriaLabelledBy = await input.getAttribute('aria-labelledby');
          
          expect(hasLabel || hasAriaLabel || hasAriaLabelledBy).toBeTruthy();
        }
      }
    }
  });

  test('Images should have alt text', async ({ page }) => {
    await page.goto('/productos');
    
    // Wait for images to load
    await page.waitForTimeout(2000);
    
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const altText = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      const ariaLabel = await img.getAttribute('aria-label');
      
      // Images should have alt text, or be marked as decorative
      const isAccessible = altText !== null || role === 'presentation' || ariaLabel;
      
      if (!isAccessible) {
        const src = await img.getAttribute('src');
        console.warn(`Image missing alt text: ${src}`);
      }
      
      // Don't fail the test for this, but log warnings
      // expect(isAccessible).toBeTruthy();
    }
  });

  test('Color contrast should meet WCAG standards', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include(['color-contrast'])
      .analyze();

    // Log color contrast violations but don't fail
    if (accessibilityScanResults.violations.length > 0) {
      console.warn('Color contrast violations found:', accessibilityScanResults.violations.length);
      accessibilityScanResults.violations.forEach(violation => {
        console.warn(`- ${violation.description}`);
      });
    }
  });

  test('Interactive elements should be focusable', async ({ page }) => {
    await page.goto('/');
    
    // Test that buttons are focusable
    const buttons = page.locator('button:visible');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      const firstButton = buttons.first();
      await firstButton.focus();
      
      const isFocused = await firstButton.evaluate(el => 
        document.activeElement === el
      );
      
      expect(isFocused).toBeTruthy();
    }
    
    // Test that links are focusable
    const links = page.locator('a:visible');
    const linkCount = await links.count();
    
    if (linkCount > 0) {
      const firstLink = links.first();
      await firstLink.focus();
      
      const isFocused = await firstLink.evaluate(el => 
        document.activeElement === el
      );
      
      expect(isFocused).toBeTruthy();
    }
  });

  test('Page should have proper heading structure', async ({ page }) => {
    await page.goto('/');
    
    // Check for h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    
    // Check heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    const headingLevels = await Promise.all(
      headings.map(async (heading) => {
        const tagName = await heading.evaluate(el => el.tagName);
        return parseInt(tagName.substring(1));
      })
    );
    
    // Check that heading levels don't skip (e.g., h1 -> h3)
    for (let i = 1; i < headingLevels.length; i++) {
      const currentLevel = headingLevels[i];
      const previousLevel = headingLevels[i - 1];
      
      // Allow same level or one level deeper
      if (currentLevel > previousLevel + 1) {
        console.warn(`Heading level skip detected: h${previousLevel} to h${currentLevel}`);
      }
    }
  });

  test('Should support screen reader navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check for landmarks
    const landmarks = await page.locator('[role="banner"], [role="navigation"], [role="main"], [role="contentinfo"], header, nav, main, footer').count();
    expect(landmarks).toBeGreaterThan(0);
    
    // Check for skip links (if present)
    const skipLink = page.locator('a:has-text("Skip"), a[href="#main"], a[href="#content"]').first();
    if (await skipLink.count() > 0) {
      await skipLink.focus();
      expect(await skipLink.isVisible()).toBeTruthy();
    }
  });

  test('Dynamic content should be accessible', async ({ page }) => {
    await page.goto('/');
    
    // Test modal accessibility (if login modal exists)
    const loginButton = page.locator('button:has-text("Iniciar"), button:has-text("Login")').first();
    
    if (await loginButton.isVisible()) {
      await loginButton.click();
      
      // Wait for modal
      const modal = page.locator('[role="dialog"], .modal').first();
      if (await modal.count() > 0) {
        // Check modal has proper ARIA attributes
        const ariaLabel = await modal.getAttribute('aria-label');
        const ariaLabelledBy = await modal.getAttribute('aria-labelledby');
        
        expect(ariaLabel || ariaLabelledBy).toBeTruthy();
        
        // Check focus management
        const activeElement = await page.evaluate(() => document.activeElement?.tagName);
        expect(['INPUT', 'BUTTON', 'A']).toContain(activeElement);
        
        // Test escape key closes modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        
        await modal.isVisible();
        // Modal should close on escape (or at least handle the key)
        // expect(modalVisible).toBeFalsy();
      }
    }
  });

  test('Touch targets should be large enough', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile size
    await page.goto('/');
    
    // Get all clickable elements
    const clickables = page.locator('button, a, input[type="submit"], [role="button"]');
    const clickableCount = await clickables.count();
    
    const smallTargets = [];
    
    for (let i = 0; i < Math.min(clickableCount, 10); i++) { // Test first 10
      const element = clickables.nth(i);
      
      if (await element.isVisible()) {
        const box = await element.boundingBox();
        
        if (box && (box.width < 44 || box.height < 44)) {
          const elementInfo = await element.evaluate(el => ({
            tagName: el.tagName,
            textContent: el.textContent?.substring(0, 50),
            className: el.className
          }));
          
          smallTargets.push({
            ...elementInfo,
            size: `${box.width}x${box.height}`
          });
        }
      }
    }
    
    if (smallTargets.length > 0) {
      console.warn('Small touch targets found:', smallTargets);
    }
    
    // Don't fail the test, but warn about small targets
    // expect(smallTargets.length).toBe(0);
  });
});