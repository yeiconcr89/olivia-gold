import { test, expect } from '@playwright/test';

// Basic E2E tests for critical user journeys
test.describe('Critical User Journeys', () => {
  
  test.beforeEach(async ({ page }) => {
    // Start from the homepage
    await page.goto('/');
  });

  test('should load homepage successfully', async ({ page }) => {
    // Check that the main elements are present
    await expect(page).toHaveTitle(/Olivia Gold/);
    await expect(page.locator('h1')).toContainText(/Joyería|Elegante|Olivia/);
    
    // Check navigation is present
    await expect(page.locator('nav')).toBeVisible();
    
    // Check hero section loads
    await expect(page.locator('.hero, [data-testid="hero"]')).toBeVisible();
  });

  test('should navigate to products page', async ({ page }) => {
    // Click on products/catalog link
    await page.click('text="Productos" , text="Catálogo" , a[href*="product"]');
    
    // Wait for products to load
    await page.waitForSelector('.product-card, [data-testid="product-card"]', { timeout: 10000 });
    
    // Verify products are displayed
    const productCards = page.locator('.product-card, [data-testid="product-card"]');
    await expect(productCards).toHaveCountGreaterThan(0);
  });

  test('should be able to view product details', async ({ page }) => {
    // Navigate to products
    await page.goto('/productos');
    
    // Wait for first product and click it
    await page.waitForSelector('.product-card, [data-testid="product-card"]');
    await page.click('.product-card:first-child, [data-testid="product-card"]:first-child');
    
    // Verify product detail page elements
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.price, [data-testid="price"]')).toBeVisible();
    await expect(page.locator('.description, [data-testid="description"]')).toBeVisible();
  });

  test('should show cart functionality', async ({ page }) => {
    // Try to find add to cart button (may not work without login but should be present)
    await page.goto('/productos');
    await page.waitForSelector('.product-card, [data-testid="product-card"]');
    
    // Click on first product
    await page.click('.product-card:first-child, [data-testid="product-card"]:first-child');
    
    // Look for add to cart button
    const addToCartButton = page.locator('button:has-text("Añadir"), button:has-text("Carrito"), [data-testid="add-to-cart"]');
    await expect(addToCartButton).toBeVisible();
    
    // Try to open cart (should show empty cart or login modal)
    const cartButton = page.locator('[data-testid="cart-button"], button:has-text("Carrito")');
    if (await cartButton.isVisible()) {
      await cartButton.click();
      // Should show either cart modal or login prompt
      await expect(page.locator('.modal, [data-testid="modal"]')).toBeVisible();
    }
  });

  test('should show login/register functionality', async ({ page }) => {
    // Look for login button
    const loginButton = page.locator('button:has-text("Iniciar"), button:has-text("Login"), [data-testid="login-button"]');
    
    if (await loginButton.isVisible()) {
      await loginButton.click();
      
      // Should open login modal
      await expect(page.locator('.modal, [data-testid="login-modal"]')).toBeVisible();
      
      // Check login form elements
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"], button:has-text("Iniciar")')).toBeVisible();
    } else {
      console.log('Login button not found - may already be logged in');
    }
  });

  test('should have working navigation', async ({ page }) => {
    // Test main navigation links
    const navLinks = [
      { text: 'Inicio', path: '/' },
      { text: 'Productos', path: '/productos' },
      { text: 'Nosotros', path: '/nosotros' },
      { text: 'Contacto', path: '/contacto' }
    ];

    for (const link of navLinks) {
      try {
        const linkElement = page.locator(`a:has-text("${link.text}"), nav a[href*="${link.path}"]`);
        if (await linkElement.isVisible()) {
          await linkElement.click();
          // Wait for navigation
          await page.waitForTimeout(1000);
          // Basic check that page changed
          await expect(page).toHaveURL(new RegExp(link.path));
        }
      } catch {
        console.log(`Navigation link ${link.text} not found or not working`);
      }
    }
  });

  test('should be mobile responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Mobile menu should be present
    const mobileMenu = page.locator('button:has-text("Menú"), .mobile-menu-button, [data-testid="mobile-menu"]');
    
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      // Mobile navigation should appear
      await expect(page.locator('.mobile-nav, [data-testid="mobile-nav"]')).toBeVisible();
    }
    
    // Content should still be readable on mobile
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should have basic SEO elements', async ({ page }) => {
    // Check meta tags
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    
    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    if (await metaDescription.count() > 0) {
      const content = await metaDescription.getAttribute('content');
      expect(content?.length).toBeGreaterThan(0);
    }
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Try to navigate to non-existent page
    const response = await page.goto('/non-existent-page');
    
    // Should show 404 page or redirect
    if (response?.status() === 404) {
      await expect(page.locator('h1')).toContainText(/404|No encontrada|Error/);
    }
    
    // Should still have navigation back to home
    const homeLink = page.locator('a[href="/"], a:has-text("Inicio"), a:has-text("Home")');
    await expect(homeLink).toBeVisible();
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    // Navigate through main pages
    await page.goto('/');
    await page.goto('/productos');
    
    // Wait for any async operations
    await page.waitForTimeout(3000);
    
    // Check for critical errors (ignore minor ones)
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('analytics') && 
      !error.includes('GTM') &&
      !error.includes('404')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});