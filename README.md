# Velora on S3

This package hosts the actual Velora interface, app pages, proxy JavaScript,
and service worker on S3. It does not load the desktop through a Cloudflare
iframe. The existing browser/proxy implementations and settings are reused.

## Build

From the repository, run:

```sh
bun install --frozen-lockfile
npm run export:s3
```

The output is `build/velora-s3.zip`. Extract it before uploading.
The regular `npm run build` still produces the Cloudflare Worker.

## Upload

Use a bucket you already own with public read access configured for its website
files. From the extracted package, with the AWS CLI signed into your account:

```sh
bash upload-s3.sh velorastudy
```

This uploads the complete `site` folder and creates exact object keys such as
`/slate`, `/api`, and `/settings`, with the correct HTML content type. S3 does
not automatically rewrite those URLs. Merely uploading `index.html` will leave
the apps and browser broken. The script does not delete other bucket objects
or change bucket permissions.

Then open:

```text
https://velorastudy.s3.us-east-2.amazonaws.com/index.html
```

Use HTTPS. The HTTP S3 website endpoint cannot run the required service worker.
The `os.html`, `slate.html`, and `api.html` filenames also work when opened
directly. The package must be hosted at the bucket root, not inside a subfolder.

## Dependencies and limits

- Web browsing still needs the configured external Wisp WebSocket relay. S3
  cannot host that relay. The default servers and custom-server settings are
  unchanged.
- Registering a custom domain through `/api/byod` needs Cloudflare's server
  and credentials; the S3 version explains this rather than submitting to S3.
- Games and Pyrite are optional assets missing from the current repository
  (`static/books/gmes.json` and `static/pyrite/index.html`). Add the licensed
  app assets to those folders before exporting to include them. The manifest
  reports these omissions. The hosted site currently returns 404 for them too.
- The existing HTML/SVG wrapper downloads remain available and still depend
  on the hosted Velora site. This ZIP is the standalone hosting package.
- Network filtering and third-party availability depend on the network and
  remote services. Hosting locally on S3 does not guarantee access.

To preview the exported object routes locally:

```sh
node scripts/preview-s3.mjs
```

Open `http://localhost:5197/index.html`. Localhost supports service workers;
ordinary HTTP hosts do not.
