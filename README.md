# Lbern

A simple static site for Lbern jewelry. It is plain HTML, CSS and JS, with no build step.

## Adding a photo

1. Put the image in the `images/` folder, for example `images/blue-twist-necklace.jpg`.
2. Open `js/photos.js` and add a line:
   ```js
   { file: "blue-twist-necklace.jpg", category: "necklaces" },
   ```
   Add `featured: true` to also show it in the homepage slideshow.
3. Save, commit and push. The photo then appears on the site.

Categories are created automatically from whatever words you use.

Use .jpg or .png files. Phones often save .HEIC, which Chrome and Firefox can't display. Resize photos to about 2000px on the long side so the site stays fast. On a Mac this command does both:

```sh
sips -s format jpeg -Z 2000 ~/Downloads/IMG_1234.HEIC --out images/IMG_1234.jpg
```

The full-size originals are kept in `originals/`. That folder isn't uploaded to GitHub.

## Editing text

- Brand name and email: top of `js/site.js` (`SITE`)
- About text: `about.html`
- Contact text: `contact.html`
- Colors and fonts: top of `css/style.css` (`:root`)

## Preview locally

```sh
python3 -m http.server
```
Then open http://localhost:8000.

## Publish on GitHub Pages

1. Create a GitHub repo and push these files to the `main` branch.
2. Go to repo **Settings → Pages**, then set Source to "Deploy from a branch", Branch `main`, folder `/ (root)`.
3. The site goes live at `https://<username>.github.io/<repo>/`.
