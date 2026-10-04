#!/usr/bin/env bash
set -euo pipefail
if [[ $# != 1 || ! "$1" =~ ^[a-z0-9][a-z0-9.-]+[a-z0-9]$ ]]; then
  echo "Usage: bash upload-s3.sh YOUR_BUCKET_NAME" >&2
  exit 1
fi
package_dir="$(cd -- "$(dirname -- "$0")" && pwd)"
bucket_url="s3://$1"
aws s3 sync "$package_dir/site/" "$bucket_url/" --cache-control no-cache
# Ensure JavaScript modules and WASM get browser-compatible MIME types.
aws s3 cp "$package_dir/site/" "$bucket_url/" --recursive --exclude '*' --include '*.mjs' --content-type application/javascript --cache-control no-cache
aws s3 cp "$package_dir/site/" "$bucket_url/" --recursive --exclude '*' --include '*.wasm' --content-type application/wasm --cache-control no-cache
aws s3 cp "$package_dir/site/index.html" "$bucket_url/api" --content-type text/html --cache-control no-cache
aws s3 cp "$package_dir/site/index.html" "$bucket_url/apps" --content-type text/html --cache-control no-cache
aws s3 cp "$package_dir/site/index.html" "$bucket_url/books" --content-type text/html --cache-control no-cache
aws s3 cp "$package_dir/site/index.html" "$bucket_url/byod" --content-type text/html --cache-control no-cache
aws s3 cp "$package_dir/site/index.html" "$bucket_url/changelog" --content-type text/html --cache-control no-cache
aws s3 cp "$package_dir/site/index.html" "$bucket_url/contrast" --content-type text/html --cache-control no-cache
aws s3 cp "$package_dir/site/index.html" "$bucket_url/download" --content-type text/html --cache-control no-cache
aws s3 cp "$package_dir/site/index.html" "$bucket_url/lethe" --content-type text/html --cache-control no-cache
aws s3 cp "$package_dir/site/index.html" "$bucket_url/os" --content-type text/html --cache-control no-cache
aws s3 cp "$package_dir/site/index.html" "$bucket_url/settings" --content-type text/html --cache-control no-cache
aws s3 cp "$package_dir/site/index.html" "$bucket_url/slate" --content-type text/html --cache-control no-cache
aws s3 cp "$package_dir/site/index.html" "$bucket_url/test" --content-type text/html --cache-control no-cache
echo "Uploaded. Open your bucket's HTTPS object URL ending in /index.html."
