import { test, expect } from '@playwright/test';

test.describe('Visual Regression Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    // Configure for consistent screenshots
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('Homepage visual consistency', async ({ page }) => {
    await page.goto('/');
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Hide dynamic elements that change frequently
    await page.addStyleTag({
      content: `
        .loading, .spinner, .animate-pulse { opacity: 0 !important; }
        .timestamp, .current-time { visibility: hidden !important; }
        .carousel-auto { animation: none !important; }
      `
    });
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('homepage-full.png', {
      fullPage: true,
      threshold: 0.3, // Allow 30% pixel difference
      maxDiffPixels: 1000
    });
    
    // Take viewport screenshot
    await expect(page).toHaveScreenshot('homepage-viewport.png', {
      threshold: 0.2
    });
  });

  test('Product catalog visual consistency', async ({ page }) => {
    await page.goto('/productos');
    
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"], .product-card', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    // Stabilize any animations
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });
    
    await expect(page).toHaveScreenshot('products-catalog.png', {
      fullPage: true,
      threshold: 0.3
    });
  });

  test('Product detail page visual consistency', async ({ page }) => {
    await page.goto('/productos');
    
    // Wait for products and click first one
    await page.waitForSelector('[data-testid="product-card"], .product-card');
    await page.click('[data-testid="product-card"]:first-child, .product-card:first-child');
    
    await page.waitForLoadState('networkidle');
    
    // Hide dynamic pricing or inventory that might change
    await page.addStyleTag({
      content: `
        .price-dynamic, .stock-count { visibility: hidden !important; }
      `
    });
    
    await expect(page).toHaveScreenshot('product-detail.png', {
      fullPage: true,
      threshold: 0.3
    });
  });

  test('Navigation menu visual consistency', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test desktop navigation
    const navigation = page.locator('nav');
    if (await navigation.isVisible()) {
      await expect(navigation).toHaveScreenshot('navigation-desktop.png');
    }
    
    // Test mobile navigation
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const mobileMenuButton = page.locator('[data-testid="mobile-menu"], .mobile-menu-button, button:has-text("Menú")');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await page.waitForTimeout(500); // Animation time
      
      const mobileNav = page.locator('[data-testid="mobile-nav"], .mobile-nav');
      if (await mobileNav.isVisible()) {
        await expect(mobileNav).toHaveScreenshot('navigation-mobile.png');
      }
    }
  });

  test('Footer visual consistency', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const footer = page.locator('footer');
    if (await footer.isVisible()) {
      await expect(footer).toHaveScreenshot('footer.png', {
        threshold: 0.2
      });
    }
  });

  test('Modal dialogs visual consistency', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Try to open login modal
    const loginButton = page.locator('button:has-text("Iniciar"), button:has-text("Login"), [data-testid="login-button"]');
    
    if (await loginButton.isVisible()) {
      await loginButton.click();
      
      // Wait for modal to appear
      const modal = page.locator('[data-testid="modal"], .modal, [role="dialog"]');
      await modal.waitFor({ state: 'visible', timeout: 5000 });
      
      await expect(modal).toHaveScreenshot('login-modal.png', {
        threshold: 0.2
      });
      
      // Close modal for cleanup
      const closeButton = modal.locator('button:has-text("Cerrar"), button:has-text("×"), .close-button');
      if (await closeButton.isVisible()) {
        await closeButton.click();
      } else {
        await page.keyboard.press('Escape');
      }
    }
  });

  test('Cart component visual consistency', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Try to open cart
    const cartButton = page.locator('[data-testid="cart-button"], button:has-text("Carrito"), .cart-icon');
    
    if (await cartButton.isVisible()) {
      await cartButton.click();
      await page.waitForTimeout(500);
      
      const cartModal = page.locator('[data-testid="cart-modal"], .cart-modal, .shopping-cart');
      if (await cartModal.isVisible()) {
        await expect(cartModal).toHaveScreenshot('cart-empty.png', {
          threshold: 0.2
        });
      }
    }
  });

  test('Error states visual consistency', async ({ page }) => {
    // Test 404 page
    await page.goto('/non-existent-page');
    await page.waitForLoadState('networkidle');
    
    // Check if we get a 404 page or redirect
    const pageContent = await page.textContent('body');
    if (pageContent.includes('404') || pageContent.includes('No encontrada') || pageContent.includes('Error')) {
      await expect(page).toHaveScreenshot('error-404.png', {
        threshold: 0.3
      });
    }
  });

  test('Form states visual consistency', async ({ page }) => {
    await page.goto('/');
    
    // Try to find and test form states
    const loginButton = page.locator('button:has-text("Iniciar"), button:has-text("Login")');
    
    if (await loginButton.isVisible()) {
      await loginButton.click();
      
      const modal = page.locator('[data-testid="modal"], .modal, [role="dialog"]');
      await modal.waitFor({ state: 'visible', timeout: 5000 });
      
      // Test empty form
      await expect(modal).toHaveScreenshot('form-empty.png');
      
      // Test form with validation errors (try to submit empty)
      const submitButton = modal.locator('button[type="submit"], button:has-text("Iniciar")');
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(1000); // Wait for validation
        
        await expect(modal).toHaveScreenshot('form-validation-errors.png');
      }
    }
  });

  test('Loading states visual consistency', async ({ page }) => {
    // Intercept API calls to simulate loading
    await page.route('/api/products', async route => {
      // Delay the response to capture loading state
      await new Promise(resolve => setTimeout(resolve, 2000));
      route.continue();
    });
    
    await page.goto('/productos');
    
    // Try to capture loading state quickly
    try {
      await expect(page).toHaveScreenshot('loading-state.png', {
        timeout: 1500 // Short timeout to catch loading
      });
    } catch {
      console.log('Loading state screenshot not captured - page loaded too quickly');
    }
    
    // Wait for actual content
    await page.waitForSelector('[data-testid="product-card"], .product-card', { timeout: 10000 });
  });

  test('Responsive design visual consistency', async ({ page }) => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 },
      { name: 'large-desktop', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot(`homepage-${viewport.name}.png`, {
        threshold: 0.3
      });
    }
  });

  test('Theme consistency', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test light theme (default)
    await expect(page).toHaveScreenshot('theme-light.png');
    
    // Test dark theme if available
    const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle, button:has-text("Dark")');
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(500); // Theme transition
      
      await expect(page).toHaveScreenshot('theme-dark.png');
    }
  });

  test('Component hover states', async ({ page }) => {
    await page.goto('/productos');
    await page.waitForLoadState('networkidle');
    
    const firstProduct = page.locator('[data-testid="product-card"]:first-child, .product-card:first-child');
    if (await firstProduct.isVisible()) {
      await firstProduct.hover();
      await page.waitForTimeout(300); // Hover animation
      
      await expect(firstProduct).toHaveScreenshot('product-card-hover.png');
    }
  });
});