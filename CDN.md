# Velora S3 package on jsDelivr

These are the same static files exported for the working S3 deployment.
`cdn-manifest.json` records SHA-256 checksums of every file under `site/`.

jsDelivr serves the files; it does not run this as a website. Its HTML URLs
return `text/plain`, so `site/index.html` displays source code. Use S3 or
another HTTPS static website host to run the package, including its proxy
service worker. Do not merge this compiled-assets branch into main.

This branch intentionally has no application build or deployment workflows.
The source code remains on main and the export branch.
