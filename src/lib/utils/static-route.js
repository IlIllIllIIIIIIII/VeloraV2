export function staticRoute(pathname) {
	if (pathname === '/index.html' || pathname === '/index.htm') return '/';
	if (pathname.endsWith('/index.html')) return pathname.slice(0, -11) || '/';
	if (pathname.endsWith('.html')) return pathname.slice(0, -5);
	return pathname;
}
