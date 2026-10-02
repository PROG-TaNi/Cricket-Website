// @ts-check
/**
 * Mobile Enhancements for Organizer Panel
 * Adds touch-friendly interactions, haptic feedback, and mobile optimizations
 */

/**
 * Add haptic feedback on button clicks (iOS/Android)
 */
export function addHapticFeedback() {
  if (!('vibrate' in navigator)) return;

  // Add haptic to all buttons and links
  document.addEventListener('click', (e) => {
    const target = /** @type {HTMLElement} */ (e.target);
    
    if (
      target.matches('button, a, .btn-primary, .btn-secondary, .btn-ghost') ||
      target.closest('button, a, .btn-primary, .btn-secondary, .btn-ghost')
    ) {
      // Light tap feedback
      navigator.vibrate(10);
      
      // Add visual feedback
      const el = target.closest('button, a, .btn-primary, .btn-secondary, .btn-ghost');
      if (el) {
        el.classList.add('haptic-feedback');
        setTimeout(() => el.classList.remove('haptic-feedback'), 200);
      }
    }
  }, { passive: true });
}

/**
 * Prevent iOS zoom on input focus
 */
export function preventIOSZoom() {
  // Ensure all inputs have font-size >= 16px
  const inputs = document.querySelectorAll('input, select, textarea');
  inputs.forEach((input) => {
    const fontSize = window.getComputedStyle(input).fontSize;
    if (parseInt(fontSize) < 16) {
      /** @type {HTMLElement} */ (input).style.fontSize = '16px';
    }
  });
}

/**
 * Add pull-to-refresh functionality
 */
export function addPullToRefresh() {
  let startY = 0;
  let pulling = false;
  
  document.addEventListener('touchstart', (e) => {
    if (window.scrollY === 0) {
      startY = e.touches[0].pageY;
      pulling = true;
    }
  }, { passive: true });
  
  document.addEventListener('touchmove', (e) => {
    if (!pulling) return;
    
    const currentY = e.touches[0].pageY;
    const diff = currentY - startY;
    
    if (diff > 80) {
      // Show refresh indicator
      const indicator = document.getElementById('pull-refresh-indicator');
      if (indicator) {
        indicator.classList.remove('hidden');
      }
    }
  }, { passive: true });
  
  document.addEventListener('touchend', () => {
    if (!pulling) return;
    
    const indicator = document.getElementById('pull-refresh-indicator');
    if (indicator && !indicator.classList.contains('hidden')) {
      // Reload page
      window.location.reload();
    }
    
    pulling = false;
  }, { passive: true });
}

/**
 * Make tables mobile-friendly with horizontal scroll indicators
 */
export function enhanceTables() {
  const tables = document.querySelectorAll('table');
  
  tables.forEach((table) => {
    // Wrap table in scrollable container
    if (!table.parentElement?.classList.contains('table-scroll-container')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'table-scroll-container relative';
      table.parentNode?.insertBefore(wrapper, table);
      wrapper.appendChild(table);
      
      // Add scroll indicators
      const leftIndicator = document.createElement('div');
      leftIndicator.className = 'absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#050807] to-transparent pointer-events-none opacity-0 transition-opacity';
      leftIndicator.id = 'scroll-indicator-left';
      
      const rightIndicator = document.createElement('div');
      rightIndicator.className = 'absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#050807] to-transparent pointer-events-none transition-opacity';
      rightIndicator.id = 'scroll-indicator-right';
      
      wrapper.appendChild(leftIndicator);
      wrapper.appendChild(rightIndicator);
      
      // Update indicators on scroll
      wrapper.addEventListener('scroll', () => {
        const { scrollLeft, scrollWidth, clientWidth } = wrapper;
        
        leftIndicator.style.opacity = scrollLeft > 10 ? '1' : '0';
        rightIndicator.style.opacity = scrollLeft < scrollWidth - clientWidth - 10 ? '1' : '0';
      }, { passive: true });
      
      // Initial state
      if (wrapper.scrollWidth > wrapper.clientWidth) {
        rightIndicator.style.opacity = '1';
      }
    }
  });
}

/**
 * Add swipe gestures for navigation
 */
export function addSwipeGestures() {
  let startX = 0;
  let startY = 0;
  
  document.addEventListener('touchstart', (e) => {
    startX = e.touches[0].pageX;
    startY = e.touches[0].pageY;
  }, { passive: true });
  
  document.addEventListener('touchend', (e) => {
    const endX = e.changedTouches[0].pageX;
    const endY = e.changedTouches[0].pageY;
    
    const diffX = endX - startX;
    const diffY = endY - startY;
    
    // Only trigger if horizontal swipe is dominant
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 100) {
      if (diffX > 0) {
        // Swipe right - go back
        const backBtn = document.querySelector('[data-action="back"]');
        if (backBtn && window.history.length > 1) {
          window.history.back();
        }
      }
    }
  }, { passive: true });
}

/**
 * Add mobile-optimized dropdown behavior
 */
export function enhanceDropdowns() {
  const selects = document.querySelectorAll('select');
  
  selects.forEach((select) => {
    // Increase touch target
    select.style.minHeight = '48px';
    select.style.fontSize = '16px';
    
    // Add custom styling for mobile
    if (window.innerWidth < 768) {
      select.classList.add('mobile-select');
    }
  });
}

/**
 * Show/hide mobile keyboard-aware UI
 */
export function handleKeyboard() {
  let keyboardVisible = false;
  
  // Detect when keyboard appears
  window.visualViewport?.addEventListener('resize', () => {
    const currentHeight = window.visualViewport?.height || window.innerHeight;
    const screenHeight = window.screen.height;
    
    keyboardVisible = currentHeight < screenHeight * 0.75;
    
    // Hide bottom navigation when keyboard is visible
    const bottomNav = document.querySelector('.mobile-bottom-nav');
    if (bottomNav) {
      bottomNav.style.display = keyboardVisible ? 'none' : 'flex';
    }
  });
}

/**
 * Add long-press context menu
 */
export function addLongPressMenu() {
  let pressTimer;
  
  document.addEventListener('touchstart', (e) => {
    const target = /** @type {HTMLElement} */ (e.target);
    
    if (target.matches('[data-long-press]')) {
      pressTimer = setTimeout(() => {
        navigator.vibrate?.(30);
        const action = target.getAttribute('data-long-press');
        if (action) {
          // Trigger long press action
          const event = new CustomEvent('longpress', { detail: { action, target } });
          document.dispatchEvent(event);
        }
      }, 500);
    }
  });
  
  document.addEventListener('touchend', () => {
    clearTimeout(pressTimer);
  });
  
  document.addEventListener('touchmove', () => {
    clearTimeout(pressTimer);
  });
}

/**
 * Initialize all mobile enhancements
 */
export function initMobileEnhancements() {
  // Only run on mobile devices
  if (window.innerWidth > 1024) return;
  
  console.log('📱 Initializing mobile enhancements...');
  
  addHapticFeedback();
  preventIOSZoom();
  enhanceTables();
  addSwipeGestures();
  enhanceDropdowns();
  handleKeyboard();
  addLongPressMenu();
  
  // Add mobile class to body
  document.body.classList.add('mobile-device');
  
  console.log('✅ Mobile enhancements active');
}
