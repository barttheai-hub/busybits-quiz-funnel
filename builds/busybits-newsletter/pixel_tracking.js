(function() {
  /* 
   * Meta Pixel Event Tracking for BusyBits Newsletter
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
  const PIXEL_ID = 'BUSYBITS_PIXEL_ID_PLACEHOLDER'; 
  fbq('init', PIXEL_ID);
  fbq('track', 'PageView');

  // 2. Page-Specific Events
  const path = window.location.pathname;

  // Squeeze Page -> ViewContent
  if (path === '/' || path.includes('index')) {
    fbq('track', 'ViewContent', {
      content_name: 'BusyBits Squeeze Page',
      content_category: 'Landing Page'
    });
  }

  // Quiz Page -> ViewContent (Quiz Start)
  if (path.includes('quiz')) {
    fbq('track', 'ViewContent', {
      content_name: 'BusyBits Quiz',
      content_category: 'Quiz'
    });
  }

  // Thank You Page -> Lead (Conversion)
  if (path.includes('thank-you')) {
    fbq('track', 'Lead', {
      content_name: 'BusyBits Newsletter Subscription',
      currency: 'USD',
      value: 0.00 // Free signup
    });
  }

})();
