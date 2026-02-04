const { exec } = require('child_process');

function runAppleScript(script) {
  return new Promise((resolve, reject) => {
    const process = exec('osascript', (error, stdout, stderr) => {
      if (error) {
        reject(stderr || error);
      } else {
        resolve(stdout.trim());
      }
    });
    process.stdin.write(script);
    process.stdin.end();
  });
}

async function getFrontmostApp() {
  const script = `
    tell application "System Events"
      set frontApp to name of first application process whose frontmost is true
    end tell
    return frontApp
  `;
  try {
    return await runAppleScript(script);
  } catch {
    return '';
  }
}

async function getChromeTabInfo() {
  const script = `
    tell application "Google Chrome"
      if running then
        try
          set theTab to active tab of front window
          return (URL of theTab) & "|||" & (title of theTab)
        on error
          return ""
        end try
      else
        return ""
      end if
    end tell
  `;
  const result = await runAppleScript(script).catch(() => '');
  if (!result) return null;
  const [url, title] = result.split('|||');
  if (!url) return null;
  return { url, title: title || '' };
}

async function getSafariTabInfo() {
  const script = `
    tell application "Safari"
      if running then
        try
          set theTab to current tab of front window
          return (URL of theTab) & "|||" & (name of theTab)
        on error
          return ""
        end try
      else
        return ""
      end if
    end tell
  `;
  const result = await runAppleScript(script).catch(() => '');
  if (!result) return null;
  const [url, title] = result.split('|||');
  if (!url) return null;
  return { url, title: title || '' };
}

async function getBrowserTabInfo(frontApp) {
  if (frontApp === 'Google Chrome') {
    return getChromeTabInfo();
  }
  if (frontApp === 'Safari') {
    return getSafariTabInfo();
  }
  return null;
}

module.exports = {
  getFrontmostApp,
  getBrowserTabInfo
};
