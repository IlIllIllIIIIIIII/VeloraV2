import { registerProxyWorker } from './serviceworker.js';
import { loadScript } from './loader';
import { getWispUrl } from './car';
import { codec } from './codec.js';

let controller;

function makeTransport(car, custom) {
	const wisp = getWispUrl(custom);
	if (car === 'epoxy') {
		const Epoxy = window.EpoxyTransport.default ?? window.EpoxyTransport;
		return new Epoxy({ wisp });
	}

	const Libcurl =
		window.LibcurlTransport.LibcurlClient ??
		window.LibcurlTransport.default ??
		window.LibcurlTransport;
	return new Libcurl({ wisp });
}

export async function createPrismController(car = 'libcurl', customWisp) {
	if (controller) return controller;
	await loadScript('/prism/prism.js');
	await loadScript('/prism/prism.api.js');
	await loadScript(car === 'epoxy' ? '/prism/libbyworse.js' : '/prism/libby.js');
	const transport = makeTransport(car, customWisp);
	await transport.init();
	const sw = await registerProxyWorker();
	const { Controller, config } = window.$scramjetController;
	config.scramjetPath = '/prism/prism.js';
	config.injectPath = '/prism/prism.inject.js';
	config.wasmPath = '/prism/prism.wasm';
	config.codec.encode = codec.encode;
	config.codec.decode = codec.decode;
	controller = new Controller({ serviceworker: sw, transport });
	await controller.wait();
	return controller;
}
export async function setPrismTransport(car, customWisp) {
	if (!controller) return;
	await loadScript(car === 'epoxy' ? '/prism/libbyworse.js' : '/prism/libby.js');
	const transport = makeTransport(car, customWisp);
	await transport.init();
	controller.setTransport(transport);
}

export function getPrismController() {
	return controller;
}
