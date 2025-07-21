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
  // console.log('🔽 downloadAttachment called with URL:', url);

  var stripped = stripUrl(url);

  if(stripped) {
    // console.log('🔽 Stripped URL:', stripped);

    // Simple direct download approach - let Gmail server provide the filename
    const downloadLink = document.createElement('a');
    downloadLink.href = stripped;
    downloadLink.download = ''; // Let the server provide the filename via Content-Disposition header
    downloadLink.style.display = 'none';

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // console.log('🔽 Download triggered');
  } else {
    // console.error('🔽 Failed to strip URL from:', url);
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
