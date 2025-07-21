/**
 * Run multiple files download
 * @param  {Array} urls  Array of urls (pointing to files)
 * @param  {Integer} duration time between each HTTP call
 */
function processMultipleFilesDownload(urls, duration) { // Not used anymore
  for(var i = 0; i < urls.length; i++) {
    setTimeout(
      (function(url) {
        downloadAttachment(urls[i]);
    })(urls[i]), duration);
  }
}


/**
 * Run attachment download
 * @param  {string} url    Url to download the attachment
 */
function downloadAttachment(url) {
  console.log('🔽 downloadAttachment called with URL:', url);

  var stripped = stripUrl(url);

  if(stripped) {
    console.log('🔽 Stripped URL:', stripped);

    // Special handling for PDF files to ensure they're downloaded, not just opened
    if (stripped.toLowerCase().includes('.pdf') || stripped.toLowerCase().includes('pdf')) {
      console.log('🔽 PDF detected, using enhanced blob download approach');

      // Method 1: Try blob download (most reliable)
      fetch(stripped, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
        .then(response => {
          if (!response.ok) throw new Error('Network response was not ok');
          return response.blob();
        })
        .then(blob => {
          const blobUrl = URL.createObjectURL(blob);
          const downloadLink = document.createElement('a');
          downloadLink.href = blobUrl;
          downloadLink.download = getFilenameFromUrl(stripped) || 'download.pdf';
          downloadLink.style.display = 'none';

          // Force download by setting MIME type
          const newBlob = new Blob([blob], { type: 'application/octet-stream' });
          const newBlobUrl = URL.createObjectURL(newBlob);
          downloadLink.href = newBlobUrl;

          document.body.appendChild(downloadLink);

          // Multiple click attempts
          downloadLink.click();

          // Also try with events
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          });
          downloadLink.dispatchEvent(clickEvent);

          document.body.removeChild(downloadLink);
          console.log('🔽 PDF blob download completed');

          // Clean up blob URLs
          setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
            URL.revokeObjectURL(newBlobUrl);
          }, 1000);
        })
        .catch(error => {
          console.log('🔽 PDF fetch failed, trying alternative methods:', error);

          // Method 2: Force Content-Disposition header simulation
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = stripped + (stripped.includes('?') ? '&' : '?') + 'download=1&attachment=1';
          document.body.appendChild(iframe);

          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 3000);

          // Method 3: Traditional approach with enhanced attributes
          const fallbackLink = document.createElement('a');
          fallbackLink.href = stripped;
          fallbackLink.download = getFilenameFromUrl(stripped) || 'download.pdf';
          fallbackLink.rel = 'noopener noreferrer';
          fallbackLink.target = '_blank';
          fallbackLink.type = 'application/octet-stream';

          document.body.appendChild(fallbackLink);

          // Try multiple click methods
          fallbackLink.click();

          // Ctrl+Click simulation
          const ctrlClickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
            ctrlKey: true,
            button: 0
          });
          fallbackLink.dispatchEvent(ctrlClickEvent);

          document.body.removeChild(fallbackLink);
        });
      return; // Exit early for PDFs since we handle them specially
    }

    var a = document.createElement('a');
    a.href = stripped;

    // Always open in new tab for all files
    a.target = '_blank';

    // Force download instead of preview - this is key for bypassing Chrome PDF settings
    a.download = getFilenameFromUrl(stripped) || '';

    var dispatchMouseEvent = function(type) {
      var event = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        view : window,
        detail: 0,
        screenX: 0,
        screenY: 0,
        clientX: 0,
        clientY: 0,
        ctrlKey: true,  // This is crucial - simulates Ctrl+Click which forces download
        shiftKey: false,
        altKey : false,
        metaKey: false,
        button: 0,
        relatedTarget: null
      });

      console.log(`🔽 Dispatching ${type} event with ctrlKey: true`);
      return dispatchEvent(a, event, type);
    }

    // Append to DOM first
    document.body.appendChild(a);
    console.log('🔽 Link added to DOM with download attribute:', a.download);

    // The original extension's approach - dispatch multiple events with ctrlKey
    // This combination bypasses Chrome's PDF viewer setting
    var mouseenterResult = dispatchMouseEvent('mouseenter');
    var mousedownResult = dispatchMouseEvent('mousedown');
    var clickResult = dispatchMouseEvent('click');

    console.log('🔽 Event results - mouseenter:', mouseenterResult, 'mousedown:', mousedownResult, 'click:', clickResult);

    // If click event is blocked, try alternative download methods
    if (!clickResult) {
      console.log('🔽 Click event blocked, trying alternative download methods for non-PDF files...');

      // Method 1: Try direct click() method
      try {
        a.click();
        console.log('🔽 Direct click() method attempted');
      } catch (e) {
        console.log('🔽 Direct click() failed:', e);
      }

      // Method 2: Try fetch + blob download for all files (like PDFs)
      console.log('🔽 Trying fetch + blob download approach for all file types...');
      fetch(stripped, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
        .then(response => {
          if (!response.ok) throw new Error('Network response was not ok');
          return response.blob();
        })
        .then(blob => {
          const blobUrl = URL.createObjectURL(blob);
          const downloadLink = document.createElement('a');
          downloadLink.href = blobUrl;
          downloadLink.download = getFilenameFromUrl(stripped) || 'download';
          downloadLink.style.display = 'none';

          // Force download by setting MIME type to octet-stream
          const newBlob = new Blob([blob], { type: 'application/octet-stream' });
          const newBlobUrl = URL.createObjectURL(newBlob);
          downloadLink.href = newBlobUrl;

          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);

          console.log('🔽 Blob download completed for blocked click');

          // Clean up blob URLs
          setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
            URL.revokeObjectURL(newBlobUrl);
          }, 1000);
        })
        .catch(err => {
          console.log('🔽 Blob download failed, trying window.open method:', err);

          // Method 3: Try window.open with download hint
          try {
            const downloadWindow = window.open(stripped + (stripped.includes('?') ? '&' : '?') + 'download=1', '_blank');
            console.log('🔽 Opened download window');

            // Try to close it after a short delay to simulate download behavior
            setTimeout(() => {
              try {
                if (downloadWindow && !downloadWindow.closed) {
                  downloadWindow.close();
                }
              } catch (e) {
                // Window may not be closeable due to cross-origin restrictions
                console.log('🔽 Could not close download window (normal for cross-origin)');
              }
            }, 2000);
          } catch (e) {
            console.log('🔽 Window.open failed:', e);
          }
        });
    }

    // Clean up
    document.body.removeChild(a);
  } else {
    console.error('🔽 Failed to strip URL from:', url);
  }
}

/**
 * Parse a string containing a url
 * @param  {string} Url Surrounded url
 * @return {string} The url extracted from the given string
 */
function stripUrl(url) {
  var re = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/;

  // Return the full url
  return re.exec(url)[0];
}

function dispatchEvent (element, event, type) {
  if (element.dispatchEvent) {
    return element.dispatchEvent(event);
  } else if (element.fireEvent) {
    return element.fireEvent('on' + event.eventType, event);
  }
  return false;
}

/**
 * Extract filename from URL
 * @param  {string} url The URL to extract filename from
 * @return {string} The filename or null if not found
 */
function getFilenameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop();
    return filename || null;
  } catch (e) {
    // Fallback: extract filename from URL string
    const parts = url.split('/');
    return parts[parts.length - 1] || null;
  }
}
