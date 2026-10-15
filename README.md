# The Unheard Tide

An English-language interactive experience exploring bodily change, external expectations, personal desire, unpaid domestic labour, and care.

This is the approved version, prepared as a static website for GitHub Pages. All scenes, hotspot positions, symbol text, animations, videos, and interactions are preserved.

## Upload and publish

See [中文上传与发布说明](UPLOAD_GUIDE_CN.md) for step-by-step instructions.

1. Extract the ZIP and copy the **contents** of `The_Unheard_Tide_GitHub` to the root of your GitHub repository. `index.html` must be at the repository root.
2. Upload all files, including the complete `assets` directory. GitHub Desktop is convenient for uploading this whole project.
3. In the repository, open **Settings → Pages → Build and deployment**.
4. Set **Source: Deploy from a branch**, select **main** and **/(root)**, and save. Select your actual branch if its name differs.
5. Open the site URL shown by GitHub Pages after deployment succeeds.

No build step, package installation, API key, or backend is required. Relative asset paths support both repository sites and username sites.

## Project files

| File or folder | Purpose |
| --- | --- |
| `index.html` | English page content and interface |
| `style.css` | Layout and visual styling |
| `app.mjs` | Scene navigation, hotspot cards, and video transitions |
| `scenes.mjs` | Five scene definitions, object positions, and paired islands |
| `symbols.mjs` | The 24 symbol titles and descriptions |
| `viewer.mjs`, `turntable.mjs`, `atlas.mjs` | Enlarged geometry, rotation, zoom, and frame loading |
| `transitions.mjs` | Forward and reverse video routes |
| `audio.mjs` | Background music and tactile click feedback |
| `assets/` | All images, video clips, sound, fonts, and frame manifests |

## Current behavior

- Five still scenes: 02 and 03 share one island; 04 and 05 share another.
- Object markers reveal symbols at their original positions.
- Selecting a symbol opens its enlarged geometry with the original English text. Drag to rotate, scroll to zoom, or use the controls.
- Video clips connect scenes.
- Background music is set to 100% in the website. The device and browser also have their own volume controls.
- Short, low tactile clicks replace melodic click sounds. Transition and arrival sound effects are disabled.
- Click or press a key to activate sound. The Sound button controls mute; its setting is remembered in the same browser.

## Local preview

Use a static HTTP server because this project uses JavaScript modules and fetches JSON manifests. Opening `index.html` directly with a `file://` URL may prevent these files from loading.

If Python is installed, run this from the folder containing `index.html`:

```sh
python -m http.server 8000
```

Then visit `http://localhost:8000/`. No server is required from the visitor after the site is hosted by GitHub Pages.

## Official documentation

- [Configure GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Upload files and file limits](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)
- [Clone with GitHub Desktop](https://docs.github.com/en/desktop/adding-and-cloning-repositories/cloning-and-forking-repositories-from-github-desktop)
