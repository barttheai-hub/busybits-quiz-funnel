(function() {
  /* 
   * Meta Pixel Event Tracking for Hair Loss Funnel
   * Inject this into the <head> of all funnel pages.
   */

  // 1. Initialize Pixel
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  
  // REPLACE WITH YOUR ACTUAL PIXEL ID
  const PIXEL_ID = '1234567890'; 
  fbq('init', PIXEL_ID);
  fbq('track', 'PageView');

  // 2. Page-Specific Events
  const path = window.location.pathname;

  // Bridge Page (Advertorial) -> ViewContent
  if (path.includes('advertorial')) {
    fbq('track', 'ViewContent', {
      content_name: 'Dormancy Protocol Advertorial',
      content_category: 'Bridge Page'
    });
    
    // Scroll Depth Tracking (25%, 50%, 75%, 100%)
    let scrollDepths = [25, 50, 75, 100];
    window.addEventListener('scroll', () => {
      let scrollPercent = Math.round((window.scrollY + window.innerHeight) / document.body.scrollHeight * 100);
      if (scrollDepths.length > 0 && scrollPercent >= scrollDepths[0]) {
        let depth = scrollDepths.shift();
        fbq('trackCustom', `ScrollDepth_${depth}%`);
      }
    });
  }

  // VSL Page -> ViewContent (Video Watch)
  if (path.includes('vsl')) {
    fbq('track', 'ViewContent', {
      content_name: 'Dormancy Protocol VSL',
      content_category: 'VSL'
    });
    
    // Track "InitiateCheckout" when clicking CTA
    document.querySelectorAll('a[href*="checkout"]').forEach(btn => {
      btn.addEventListener('click', () => {
        fbq('track', 'InitiateCheckout');
      });
    });
  }

  // Checkout Page -> AddToCart (Arrival)
  if (path.includes('checkout')) {
    fbq('track', 'AddToCart', {
      content_name: 'Dormancy Protocol Kit',
      value: 49.00, // Default value
      currency: 'USD'
    });
  }

  // Thank You Page -> Purchase (Conversion)
  if (path.includes('thank-you')) {
    // Ideally, value comes from URL params or server-side injection
    const urlParams = new URLSearchParams(window.location.search);
    const value = urlParams.get('value') || 49.00;
    
    fbq('track', 'Purchase', {
      value: value,
      currency: 'USD',
      content_name: 'Dormancy Protocol Kit'
    });
  }
  
  // Lead Magnet (Exit Intent) -> Lead
  document.querySelector('#exitPopup form')?.addEventListener('submit', () => {
      fbq('track', 'Lead', {
          content_name: 'Hair Hackers Bible'
      });
  });

})();
