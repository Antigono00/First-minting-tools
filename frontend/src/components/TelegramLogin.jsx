import { useEffect } from 'react';

const TelegramLogin = () => {
  useEffect(() => {
    // Clear any existing telegram login buttons
    const container = document.getElementById('telegram-login-container');
    if (container) {
      container.innerHTML = '';
    }

    // Create a new script element for the Telegram login widget
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22'; // Use latest version
    script.async = true;
    
    // Use the correct bot name
    script.setAttribute('data-telegram-login', 'CorvaxCoins_bot');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-auth-url', 'https://cvxlab.net/callback');
    script.setAttribute('data-request-access', 'write');
    
    // Add the script to the container
    if (container) {
      container.appendChild(script);
    }
    
    return () => {
      // Clean up on unmount
      if (container && container.contains(script)) {
        container.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="telegram-login-modal">
      <h2>Log in with Telegram</h2>
      <p>Log in to synchronize your resources.</p>
      <div id="telegram-login-container"></div>
      <p style={{ marginTop: '20px', fontSize: '14px', color: '#ccc' }}>
        Note: Make sure you're using the Telegram app and that cookies are enabled in your browser.
        <br/>
        If login fails, try clearing your browser cookies or using a different browser.
      </p>
    </div>
  );
};

export default TelegramLogin;
