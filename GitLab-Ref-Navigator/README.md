# 🔗 GitLab Ref Navigator

> **v1.0.0** — A browser extension that makes `include` file references in GitLab CI YAML files clickable.

---

## 🚀 What It Does

When viewing `.yml` or `.yaml` files on **GitLab.com**, this extension automatically detects `include` blocks in your CI/CD configuration and turns the referenced file names into **clickable links** that open in a new tab.

No more copy-pasting project paths and hunting for files — just **click and navigate**.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔗 **Clickable file references** | File names in `include` blocks become links |
| 📁 **Simple includes** | `- 'image_versions.yml'` → links to the file in the same repo & branch |
| 📦 **Cross-project includes** | `project:` + `ref:` + `file:` → links to the exact file in the referenced repo |
| 📋 **File lists** | Supports `file:` as a list with multiple entries |
| 📂 **Local includes** | `local: 'pipelines/common.yml'` → links to the file in the same repo & branch |
| ⚓ **YAML anchors** | Resolves `&anchor` / `*anchor` for `project` and `ref` values |
| 🌿 **Branch-aware** | Correctly handles refs with `/` (e.g., `rc/0.2454.0`, `feature/my-branch`) |
| 📝 **Unquoted values** | Supports `project: myorg/repo` without quotes |
| ⏳ **Lazy-load support** | Waits for GitLab's code block to render before processing |
| 🔄 **SPA navigation** | Auto-detects page changes without needing a manual reload |
| 📄 **Large file support** | Debounced observer handles files with `include:` at the bottom |

---

## 📸 Supported YAML Formats

### Simple includes (same repo & branch)
```yaml
include:
  - 'image_versions.yml'
  - 'azure_auth.yml'
```
→ Links to files in the **current project and branch**.

### Cross-project includes
```yaml
include:
  - project: "myorg/devops/pipelines"
    ref: master
    file: pipeline_build_app.yml
```
→ Links to the file in the **specified project and branch**.

### File lists with YAML anchors
```yaml
variables:
  SCRIPTS_BRANCH: &modules_version rc/0.2454.0
  MODULES_PROJECT: &modules_project myorg/devops/pipeline-modules

include:
  - project: *modules_project
    ref: *modules_version
    file:
      - "common.yml"
      - "pipelines_sync.yml"
      - "_version.yml"
```
→ Resolves anchors and links **each file** to the correct project and branch.

### Local includes (same repo & branch)
```yaml
include:
  - local: 'pipelines/jobs/terraform.yml'
  - local: 'pipelines/common.yml'
```
→ Links to files in the **current project and branch**, using the full path from the project root.

### Unquoted project values
```yaml
include:
  - project: myorg/devops/seed/app
    ref: main
    file:
      - pipelines/main.yml
```
→ Works with or without quotes around `project`, `ref`, and `file` values.

---

## 🛠️ Installation

### Chrome / Edge / Brave (Manual)

1. Clone or download this repository.
2. Open your browser and navigate to:
   - **Chrome**: `chrome://extensions/`
   - **Edge**: `edge://extensions/`
   - **Brave**: `brave://extensions/`
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked**.
5. Select the `GitLab-Ref-Navigator` folder (the one containing `manifest.json`).
6. Navigate to any `.yml` or `.yaml` file on GitLab.com — file references will be clickable!

---

## 📂 Project Structure

```
├── manifest.json        # Extension configuration (Manifest V3)
├── contentScript.js     # Core logic — parses YAML and creates clickable links
└── README.md            # Documentation
```

### How It Works Under the Hood

```
┌─────────────────────────────────────────────────────────┐
│  GitLab.com - .gitlab-ci.yml file view                  │
│                                                         │
│  1. Content script is injected (document_idle)          │
│  2. MutationObserver waits for code block to render     │
│  3. Parses YAML anchors (&anchor / *anchor)             │
│  4. Scans each line for include patterns:               │
│     • project: + ref: + file:                           │
│     • local: 'path/to/file.yml'                         │
│     • - 'simple_include.yml'                            │
│  5. Wraps file names in <a> tags with correct URLs      │
│  6. Watches for SPA navigation & re-runs automatically  │
└─────────────────────────────────────────────────────────┘
```

### Key Files Explained

#### `manifest.json`
Defines the extension metadata and configuration:
- **`content_scripts`** — Injects `contentScript.js` on all `https://gitlab.com/*` pages at `document_idle`.
- **`host_permissions`** — Grants access to GitLab.com only.
- No `background.js` or `popup.html` needed — the extension is fully content-script driven.

#### `contentScript.js`
The core logic, broken into these functions:

| Function | Purpose |
|---|---|
| `isGitlabYamlPage()` | Checks if the current page is a `.yml` / `.yaml` file on GitLab |
| `getCurrentRepoInfo()` | Extracts the current project path and branch/tag from the page URL and DOM |
| `makeIncludesClickable()` | Parses YAML lines, resolves anchors, and identifies `include` entries |
| `linkFileName()` | Wraps a file name in a clickable `<a>` tag pointing to the correct GitLab URL |
| `waitForCodeAndRun()` | Uses `MutationObserver` with debounce to wait for lazy-loaded code blocks |
| URL change detection | Watches for SPA navigation (Turbo/PJAX) and `popstate` events to re-run automatically |

---

## 🧑‍💻 Developer Guide

### Prerequisites
- A Chromium-based browser (Chrome, Edge, Brave)
- Basic knowledge of JavaScript and Chrome Extensions (Manifest V3)

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/VinayTalla20/Browser-Extensions.git
   cd Browser-Extensions/GitLab-Ref-Navigator
   ```

2. **Load the extension:**
   - Open `chrome://extensions/` (or `edge://extensions/`)
   - Enable **Developer mode**
   - Click **Load unpacked** → select the `GitLab-Ref-Navigator` folder

3. **Make changes:**
   - Edit `contentScript.js` in your editor
   - Go to `chrome://extensions/` and click the **reload** button (↻) on the extension
   - Refresh the GitLab page to test your changes

4. **Debug:**
   - Open DevTools on any GitLab YAML page → **Console** tab
   - All logs are prefixed with `[GitLab RefLinks]` for easy filtering
   - Use the **Elements** tab to inspect the DOM structure of GitLab's code viewer

### Adding a New Include Format

To support a new `include` pattern (e.g., `template:`), follow these steps:

1. **Open a GitLab page** with the new format and inspect the DOM to understand the HTML structure.

2. **Add a regex match** in `makeIncludesClickable()` inside the `codeLines.forEach()` loop:
   ```js
   // Match template: 'Jobs/Build.gitlab-ci.yml'
   const templateMatch = text.match(/template:\s*["']?([^\s"']+\.ya?ml)["']?/);
   if (templateMatch) {
     // template includes use a GitLab-hosted URL
     const tmplUrl = `https://gitlab.com/gitlab-org/gitlab/-/blob/master/lib/gitlab/ci/templates/${templateMatch[1]}`;
     linkFileName(line, templateMatch[1], 'gitlab-org/gitlab', 'master');
     return;
   }
   ```

3. **Reload the extension** and test on a GitLab page with the new format.

### Architecture Decisions

| Decision | Reason |
|---|---|
| **No `background.js`** | The extension only needs to act on page content — no browser-level events needed |
| **No `popup.html`** | The extension works automatically — no user interaction required |
| **No dependencies** | Pure vanilla JS keeps the extension lightweight and fast |
| **`MutationObserver`** | GitLab lazy-loads code blocks via JavaScript; we must wait for the DOM to update |
| **Debounced processing** | Prevents excessive re-runs on large files; waits for DOM to stabilize |
| **URL change detection** | GitLab uses Turbo/PJAX for SPA navigation; we watch for URL changes to re-run |
| **Content script only** | Simplest architecture — one file does everything |
| **`document_idle`** | Runs after the page has finished loading, reducing interference with GitLab's own scripts |

### Extending to Self-Hosted GitLab

To support self-hosted GitLab instances, you would need to:

1. Add a `background.js` service worker to dynamically register content scripts:
   ```js
   // background.js
   chrome.scripting.registerContentScripts([{
     id: 'gitlab-custom',
     matches: ['https://gitlab.mycompany.com/*'],
     js: ['contentScript.js'],
     runAt: 'document_idle'
   }]);
   ```

2. Add `"scripting"` and `"storage"` to `permissions` in `manifest.json`.

3. Add a popup or options page where users can configure their GitLab instance URL.

4. Update `host_permissions` to include the custom domain, or use the `"activeTab"` permission.

---

## 🧪 How to Verify It Works

1. Open any `.gitlab-ci.yml` file on GitLab.com.
2. Look for `include` blocks — file names should appear as **red underlined links**.
3. Click a file name — it should open in a **new tab**.
4. Open **DevTools → Console** to see debug logs:
   ```
   [GitLab RefLinks] contentScript.js loaded
   [GitLab RefLinks] Found 23 lines, linked 3 files
   [GitLab RefLinks] Linked: common.yml → https://gitlab.com/.../common.yml
   [GitLab RefLinks] Done! Linked 3 files
   [GitLab RefLinks] URL changed, re-running...
   ```

---

## ⚙️ Tech Stack

- **Manifest V3** (Chrome Extensions)
- **Vanilla JavaScript** (no dependencies)
- **Content Script** injection on GitLab.com
- **MutationObserver** for lazy-loaded content

---

## 🗺️ Roadmap

- [x] Cross-project includes (`project` + `ref` + `file`)
- [x] Simple includes (`- 'file.yml'`)
- [x] Local includes (`local: 'path/to/file.yml'`)
- [x] YAML anchor resolution (`&anchor` / `*anchor`)
- [x] File lists under `file:`
- [x] Branch names with `/` (e.g., `feature/my-branch`, `rc/0.2454.0`)
- [x] Unquoted / single-quoted / double-quoted values
- [x] SPA navigation support (no manual reload needed)
- [x] Large file support with debounced observer
- [ ] Support for `template:` includes
- [ ] Icon and branding
- [ ] Chrome Web Store / Firefox Add-ons publishing
- [ ] Support for self-hosted GitLab instances

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create a branch** (`git checkout -b feature/my-feature`)
3. **Make your changes** and test locally
4. **Commit** (`git commit -m 'feat: add my feature'`)
5. **Push** (`git push origin feature/my-feature`)
6. **Open a Pull Request**

### Ideas for Contributions
- 🎨 Design an extension icon
- 🏢 Add support for self-hosted GitLab instances
- 📦 Add support for `template:` includes
- 🧪 Add automated tests
- 🌐 Publish to Chrome Web Store / Firefox Add-ons
- 📖 Improve documentation

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

<p align="center">
  Made with ❤️ for GitLab CI/CD power users
</p>
