// contentScript.js
// This script runs on GitLab.com and makes include file references in any YAML file clickable

console.log('[GitLab RefLinks] contentScript.js loaded');

function isGitlabYamlPage() {
  return (
    window.location.hostname.endsWith('gitlab.com') &&
    /\/blob\/.+\.ya?ml$/.test(window.location.pathname)
  );
}

function getCurrentRepoInfo() {
  // Extract project and ref from the current page URL
  // URL format: https://gitlab.com/<project>/-/blob/<ref>/<filepath>
  // Ref can contain "/" (e.g., rc/0.2454.0, feature/my-branch)
  // Strategy: find the file name from the page, then extract ref as everything between blob/ and /<filename>
  const path = window.location.pathname;
  const blobMatch = path.match(/^\/(.+?)\/-\/blob\/(.+)$/);
  if (!blobMatch) return null;

  const project = blobMatch[1];
  const refAndFile = blobMatch[2]; // e.g., "rc/0.2454.0/common.yml"

  // The file name is the last segment that matches a file (contains a dot)
  // Find the actual file name from the page title or breadcrumb
  const fileNameEl = document.querySelector('[data-testid="file-title-content"]');
  let fileName = null;
  if (fileNameEl) {
    fileName = fileNameEl.textContent.trim();
  }

  if (fileName && refAndFile.endsWith(fileName)) {
    // ref = everything before the file name
    const ref = refAndFile.slice(0, refAndFile.length - fileName.length - 1); // -1 for the "/"
    return { project, ref };
  }

  // Fallback: assume file name is the last path segment
  const lastSlash = refAndFile.lastIndexOf('/');
  if (lastSlash > 0) {
    return { project, ref: refAndFile.substring(0, lastSlash) };
  }

  return null;
}

function makeIncludesClickable() {
  const codeLines = Array.from(document.querySelectorAll('div.line[lang="yaml"], div.line[id^="LC"]'));
  console.log(`[GitLab RefLinks] Found ${codeLines.length} code lines (div.line)`);

  if (!codeLines.length) return false;

  // Get current repo info for simple includes (files in same repo)
  const currentRepo = getCurrentRepoInfo();
  console.log('[GitLab RefLinks] Current repo:', currentRepo);

  // First pass: collect YAML anchors (&anchor_name value)
  const anchors = {};
  codeLines.forEach((line) => {
    const text = line.textContent;
    const anchorMatch = text.match(/:\s*&(\w+)\s+(.+)/);
    if (anchorMatch) {
      anchors[anchorMatch[1]] = anchorMatch[2].trim();
    }
  });
  console.log('[GitLab RefLinks] Anchors found:', anchors);

  // Second pass: process include blocks
  let currentProject = null;
  let currentRef = null;
  let inFileList = false;       // inside a file: list (under project/ref)
  let inSimpleInclude = false;  // inside a simple include list (just file names)
  let inIncludeBlock = false;   // we've seen "include:"

  codeLines.forEach((line) => {
    const text = line.textContent;

    // Detect "include:" line
    if (/^\s*include:\s*$/.test(text)) {
      inIncludeBlock = true;
      inSimpleInclude = true;
      inFileList = false;
      currentProject = null;
      currentRef = null;
      return;
    }

    // If we hit a top-level key (no indentation, not a list item), exit include block
    if (inIncludeBlock && /^[a-zA-Z]/.test(text) && !/^\s*-/.test(text) && !text.startsWith(' ')) {
      inIncludeBlock = false;
      inSimpleInclude = false;
      inFileList = false;
      currentProject = null;
      currentRef = null;
      return;
    }

    if (!inIncludeBlock) return;

    // Match project: "path" or project: *anchor
    const projectMatch = text.match(/project:\s*(?:"([^"]+)"|(\*\w+))/);
    if (projectMatch) {
      inSimpleInclude = false; // no longer simple includes
      if (projectMatch[1]) {
        currentProject = projectMatch[1];
      } else if (projectMatch[2]) {
        const anchorName = projectMatch[2].substring(1);
        currentProject = anchors[anchorName] || null;
      }
      currentRef = null;
      inFileList = false;
      return;
    }

    // Match ref: value or ref: *anchor
    const refMatch = text.match(/ref:\s*(?:"?([\w\-\.\/]+)"?|(\*\w+))/);
    if (refMatch) {
      if (refMatch[1]) {
        currentRef = refMatch[1];
      } else if (refMatch[2]) {
        const anchorName = refMatch[2].substring(1);
        currentRef = anchors[anchorName] || null;
      }
      return;
    }

    // Match file: as a single value or start of a list
    const fileSingleMatch = text.match(/file:\s+"?([^\s"]+\.ya?ml)"?/);
    const fileListStart = text.match(/^\s*file:\s*$/);

    if (fileSingleMatch && currentProject && currentRef) {
      inFileList = false;
      linkFileName(line, fileSingleMatch[1], currentProject, currentRef);
      return;
    } else if (fileListStart) {
      inFileList = true;
      inSimpleInclude = false;
      return;
    }

    // Match list items: - "filename.yml" or - 'filename.yml' or - filename.yml
    const fileListItem = text.match(/^\s*-\s+["']?([^\s"']+\.ya?ml)["']?/);

    if (inFileList && fileListItem && currentProject && currentRef) {
      // List item under file: (with project/ref)
      linkFileName(line, fileListItem[1], currentProject, currentRef);
    } else if (inSimpleInclude && fileListItem && currentRepo) {
      // Simple include list item (same repo/branch)
      linkFileName(line, fileListItem[1], currentRepo.project, currentRepo.ref);
    } else if (inFileList && !fileListItem && !/^\s*$/.test(text) && !/^\s*-/.test(text)) {
      inFileList = false;
    }
  });

  return true;
}

function linkFileName(line, fileName, project, ref) {
  const url = `https://gitlab.com/${project}/-/blob/${ref}/${fileName}`;

  // Try to find a span containing just the file name
  const spans = Array.from(line.querySelectorAll('span'));
  let linked = false;
  spans.forEach((span) => {
    const spanText = span.textContent.trim().replace(/^["']|["']$/g, '');
    if (spanText === fileName && !span.querySelector('a')) {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.style.cssText = 'color:#ff6b6b;text-decoration:underline;cursor:pointer;font-weight:bold;';
      a.textContent = span.textContent;
      span.textContent = '';
      span.appendChild(a);
      linked = true;
    }
  });

  // Fallback: replace in innerHTML
  if (!linked) {
    const escaped = fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    line.innerHTML = line.innerHTML.replace(
      new RegExp(`(?<!<[^>]*)${escaped}(?![^<]*>)`),
      `<a href="${url}" target="_blank" style="color:#ff6b6b;text-decoration:underline;cursor:pointer;font-weight:bold;">${fileName}</a>`
    );
  }

  console.log(`[GitLab RefLinks] Linked: ${fileName} → ${url}`);
}

function waitForCodeAndRun() {
  if (!isGitlabYamlPage()) return;

  // Try immediately
  if (makeIncludesClickable()) return;

  // If code block not yet loaded, observe DOM changes
  console.log('[GitLab RefLinks] Code block not found yet, waiting...');
  let timeoutId = null;

  const observer = new MutationObserver((mutations, obs) => {
    if (makeIncludesClickable()) {
      console.log('[GitLab RefLinks] Code block found after waiting');
      obs.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Safety timeout: stop observing after 15 seconds
  timeoutId = setTimeout(() => {
    observer.disconnect();
    console.log('[GitLab RefLinks] Timed out waiting for code block');
  }, 15000);
}

waitForCodeAndRun();
