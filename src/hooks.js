import { staticRoute } from './lib/utils/static-route.js';

// S3 serves exact object keys rather than rewriting HTML filenames to routes.
export function reroute({ url }) {
	if (import.meta.env.VITE_VELORA_S3 === '1') return staticRoute(url.pathname);
}
