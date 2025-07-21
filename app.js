// Gmail Attachment Downloader - Manifest v3 Compatible (No InboxSDK)
// console.log('Gmail Attachment Downloader loading...');

// Debounce function to prevent excessive calls
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Wait for Gmail to load
function waitForGmail() {
  return new Promise((resolve) => {
    const checkGmail = () => {
      if (document.querySelector('[data-legacy-thread-id]') || document.querySelector('[data-thread-id]') || document.querySelector('[role="main"]')) {
        resolve();
      } else {
        setTimeout(checkGmail, 1000);
      }
    };
    checkGmail();
  });
}

// Function to check if we're in a conversation view
function isInConversationView() {
  // Check for various indicators that we're viewing a conversation
  return document.querySelector('[data-legacy-thread-id]') ||
         document.querySelector('[data-thread-id]') ||
         document.querySelector('[role="listitem"][data-legacy-thread-id]') ||
         document.querySelector('.nH.if'); // Gmail conversation view container
}

// Function to find individual emails in a conversation
function getEmailsInConversation() {
  const emails = [];

  // Look for email containers in conversation view
  const emailContainers = document.querySelectorAll(
    '[data-legacy-thread-id] [data-message-id], ' +
    '[data-thread-id] [data-message-id], ' +
    '.ii.gt, ' + // Gmail message containers
    '[role="listitem"] .ii.gt'
  );

  return Array.from(emailContainers);
}

// Function to add download buttons only next to "Add all to Drive" buttons
function addDownloadButtons() {
  // console.log('🔍 Looking for "Add all to Drive" buttons...');

  // Only proceed if we're in a conversation view
  if (!isInConversationView()) {
    // console.log('Not in conversation view, skipping button addition');
    return;
  }

  // Get all emails in the conversation
  const emails = getEmailsInConversation();
  // console.log(`Found ${emails.length} emails in conversation`);

  let totalButtonsAdded = 0;

  emails.forEach((email, emailIndex) => {
    // console.log(`Processing email ${emailIndex + 1}:`, email);

    // Look specifically for "Add all to Drive" buttons in this email
    const addToDriveButtons = email.querySelectorAll('[data-tooltip="Add all to Drive"]:not(.download-all-processed)');
    // console.log(`Found ${addToDriveButtons.length} "Add all to Drive" buttons in email ${emailIndex + 1}`);

    addToDriveButtons.forEach((driveButton, buttonIndex) => {
      // Mark as processed to avoid duplicate processing
      driveButton.classList.add('download-all-processed');

      // Check if we haven't already added a download button near this one
      if (!driveButton.closest('.download-all-parent')) {
        // console.log(`✅ Adding download button next to "Add all to Drive" button ${buttonIndex + 1} in email ${emailIndex + 1}`);
        addDownloadAllButton(driveButton, email);
        totalButtonsAdded++;
      }
    });
  });

  // console.log(`🎯 Total download buttons added: ${totalButtonsAdded}`);
}// Add download all button next to "Add all to Drive" button
function addDownloadAllButton(driveButton, emailContainer) {
  // Create a container that wraps both the Drive button and our download button
  const parentContainer = driveButton.parentNode;
  if (!parentContainer) return;

  // Mark the parent to prevent duplicate processing
  parentContainer.classList.add('download-all-parent');

  // Create our download button
  const button = document.createElement('button');
  button.className = 'download-all-btn';
  button.style.cssText = `
    background: transparent;
    color: var(--gm-colortextbutton-color, #5f6368);
    border: none;
    padding: 10px;
    border-radius: 50%;
    font-size: 16px;
    cursor: pointer;
    margin-left: 4px;
    z-index: 1001;
    position: relative;
    font-weight: 400;
    width: 40px;
    height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    vertical-align: middle;
    transition: background-color 0.2s ease;
  `;

  // Use text symbol instead of image for better compatibility
  button.innerHTML = '↓↓'; // Two side-by-side down arrows (emphasizes "multiple files")

  button.title = 'Download All Attachments from this Email';

  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    downloadAllAttachmentsInEmail(emailContainer);
  });

  button.addEventListener('mouseover', () => {
    // Darken the symbol on hover like Gmail buttons
    button.style.background = 'var(--gm-fillcolorprimarycontainer-color, rgba(66, 133, 244, 0.08))';
    button.style.color = 'var(--gm-colortextbutton-color-hover, #202124)';
  });

  button.addEventListener('mouseout', () => {
    button.style.background = 'transparent';
    button.style.color = 'var(--gm-colortextbutton-color, #5f6368)';
  });

  // Insert the download button right after the "Add all to Drive" button
  if (driveButton.nextSibling) {
    parentContainer.insertBefore(button, driveButton.nextSibling);
  } else {
    parentContainer.appendChild(button);
  }

  // console.log('Added download button next to "Add all to Drive" button in email:', emailContainer);
}

// Function to download all attachments in a specific email
function downloadAllAttachmentsInEmail(emailContainer) {
  // console.log('Downloading all attachments in specific email:', emailContainer);

  // Look for download links specifically within this email container
  const downloadSelectors = [
    '[data-tooltip*="Download"]',
    '[aria-label*="Download"]',
    'a[download]',
    'span[download]',
    '[role="button"][aria-label*="attachment"]',
    'a[href*="attachment"]',
    'a[href*="mail-attachment.googleusercontent.com"]',
    '.aZo a', // Gmail attachment links
    '.aQH a', // Gmail attachment area links
  ];

  let allDownloadLinks = [];

  downloadSelectors.forEach(selector => {
    const links = emailContainer.querySelectorAll(selector);
    allDownloadLinks.push(...Array.from(links));
  });

  // Remove duplicates
  const uniqueLinks = [...new Set(allDownloadLinks)];

  // console.log(`Found ${uniqueLinks.length} potential download links in this email:`, uniqueLinks);

  let downloadCount = 0;

  uniqueLinks.forEach((link, index) => {
    setTimeout(() => {
      // console.log(`Processing link ${index + 1}:`, link);

      if (link.href && link.href.startsWith('http')) {
        // Direct download link - handle all files with new tab and special PDF handling
        // console.log('Downloading via URL:', link.href);

        // Use our enhanced downloadAttachment function for all files
        downloadAttachment(link.href);
        downloadCount++;
      } else if (link.click && typeof link.click === 'function') {
        // Clickable element - get URL and handle properly
        // console.log('Clicking download element:', link);
        try {
          if (link.href) {
            // If we have a URL, use our download function
            downloadAttachment(link.href);
          } else {
            // If no direct URL, try clicking but modify the link first
            const originalTarget = link.target;
            link.target = '_blank';
            link.click();
            // Restore original target after click
            if (originalTarget) {
              link.target = originalTarget;
            }
          }
          downloadCount++;
        } catch (e) {
          // console.error('Failed to click element:', e);
        }
      } else if (link.getAttribute('data-tooltip')?.includes('Download')) {
        // Try to trigger download by simulating click with new tab
        // console.log('Simulating click on tooltip element:', link);
        try {
          // Set target to new tab before clicking
          const originalTarget = link.target;
          link.target = '_blank';
          const event = new MouseEvent('click', { bubbles: true, cancelable: true });
          link.dispatchEvent(event);
          // Restore original target
          if (originalTarget) {
            link.target = originalTarget;
          }
          downloadCount++;
        } catch (e) {
          // console.error('Failed to simulate click:', e);
        }
      }
    }, index * 300); // Delay to avoid overwhelming Gmail
  });

  setTimeout(() => {
    // console.log(`Initiated download of ${downloadCount} attachments from this email`);
    if (downloadCount === 0) {
      // console.log('No downloads initiated. Trying alternative method...');
      tryAlternativeDownloadMethod(emailContainer);
    }
  }, uniqueLinks.length * 300 + 100);
}

// Alternative download method if primary method fails
function tryAlternativeDownloadMethod(container) {
  // console.log('Trying alternative download method...');

  // Look for any clickable elements that might be downloads
  const potentialDownloads = container.querySelectorAll('*[onclick], button, [role="button"], a');

  potentialDownloads.forEach(element => {
    const text = element.textContent?.toLowerCase() || '';
    const tooltip = element.getAttribute('data-tooltip')?.toLowerCase() || '';
    const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';

    if (text.includes('download') || tooltip.includes('download') || ariaLabel.includes('download') ||
        text.includes('save') || tooltip.includes('save') || ariaLabel.includes('save')) {
      // console.log('Found potential download element:', element);
      try {
        element.click();
      } catch (e) {
        // console.error('Failed to click potential download:', e);
      }
    }
  });
}

// Initialize the extension with conversation-specific monitoring
async function initExtension() {
  try {
    // console.log('Waiting for Gmail to load...');
    await waitForGmail();
    // console.log('Gmail loaded, initializing extension...');

    // Debounced version to prevent excessive calls
    const debouncedAddButtons = debounce(addDownloadButtons, 500);

    // Function to check if a conversation is currently open
    function checkForConversationView() {
      if (isInConversationView()) {
        // console.log('Conversation view detected, adding download buttons...');
        setTimeout(debouncedAddButtons, 1000); // Short delay to let Gmail render
      }
    }

    // Initial check
    checkForConversationView();

    // Watch for navigation changes that might open/close conversations
    const observer = new MutationObserver((mutations) => {
      // Look for significant changes that indicate a conversation was opened
      const hasSignificantChange = mutations.some(mutation => {
        if (mutation.addedNodes.length > 0) {
          return Array.from(mutation.addedNodes).some(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if new nodes include conversation-related elements
              return node.querySelector('[data-legacy-thread-id], [data-thread-id], [data-tooltip="Add all to Drive"]') ||
                     node.hasAttribute?.('data-legacy-thread-id') ||
                     node.hasAttribute?.('data-thread-id') ||
                     node.getAttribute?.('data-tooltip') === 'Add all to Drive';
            }
          });
        }
        return false;
      });

      if (hasSignificantChange) {
        // console.log('Detected conversation-related changes');
        checkForConversationView();
      }
    });

    // Observe the main Gmail content area
    const mainContent = document.querySelector('[role="main"]') ||
                       document.querySelector('.nH.if') || // Gmail conversation area
                       document.body;

    observer.observe(mainContent, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });

    // Also listen for URL changes (Gmail is a SPA)
    let currentUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        // console.log('URL changed, checking for conversation view...');
        setTimeout(checkForConversationView, 500);
      }
    }, 1000);

    // console.log('Gmail Attachment Downloader initialized successfully!');

  } catch (error) {
    // console.error('Extension initialization failed:', error);
  }
}

// Start the extension
initExtension();