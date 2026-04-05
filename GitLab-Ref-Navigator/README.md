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
| ⚓ **YAML anchors** | Resolves `&anchor` / `*anchor` for `project` and `ref` values |
| 🌿 **Branch-aware** | Correctly handles refs with `/` (e.g., `rc/0.2454.0`, `feature/my-branch`) |
| ⏳ **Lazy-load support** | Waits for GitLab's code block to render before processing |

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
├── manifest.json        # Extension configuration
├── contentScript.js     # Core logic — parses YAML and creates links
├── background.js        # Service worker (placeholder)
├── popup.html           # Extension popup UI
├── popup.js             # Popup logic
└── README.md            # You are here
```

---

## 🧪 How to Verify It Works

1. Open any `.gitlab-ci.yml` file on GitLab.com.
2. Look for `include` blocks — file names should appear as **red underlined links**.
3. Click a file name — it should open in a **new tab**.
4. Open **DevTools → Console** to see debug logs:
   ```
   [GitLab RefLinks] contentScript.js loaded
   [GitLab RefLinks] Found 23 code lines (div.line)
   [GitLab RefLinks] Anchors found: { modules_version: "rc/0.2454.0", ... }
   [GitLab RefLinks] Linked: common.yml → https://gitlab.com/.../common.yml
   ```

---

## ⚙️ Tech Stack

- **Manifest V3** (Chrome Extensions)
- **Vanilla JavaScript** (no dependencies)
- **Content Script** injection on GitLab.com
- **MutationObserver** for lazy-loaded content

---

## 🗺️ Roadmap

- [ ] Support for `local:` includes
- [ ] Support for `template:` includes
- [ ] Icon and branding
- [ ] Chrome Web Store / Firefox Add-ons publishing
- [ ] Support for self-hosted GitLab instances

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

<p align="center">
  Made with ❤️ for GitLab CI/CD power users
</p>
