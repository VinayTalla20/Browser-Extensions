// Wait for the DOM to load
window.addEventListener('DOMContentLoaded', function () {
  const btn = document.getElementById('change-bg');
  btn.addEventListener('click', async function () {
    // Get the active tab
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    // Inject code to change background color
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        document.body.style.backgroundColor = '#ADD8E6';
        document.documentElement.style.backgroundColor = '#ADD8E6';
        document.body.style.backgroundImage = 'none';
        document.documentElement.style.backgroundImage = 'none';
      }
    });
  });
});