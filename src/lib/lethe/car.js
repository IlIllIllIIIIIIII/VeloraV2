export function getWispUrl(custom) {
  return custom || 'wss://velora-wisp-861579890383.us-central1.run.app/lively/';
}

export function createConnection() {
	return new window.BareMux.BareMuxConnection('/charon/worker.js');
}

export async function setCar(connection, car, custom) {
	const wispUrl = getWispUrl(custom);

	switch (car) {
		case 'epoxy':
			await connection.setTransport('/reflux/index.mjs', [
				{ base: '/libbybutslightlyworse/index.mjs', wisp: wispUrl }
			]);
			break;
		case 'libcurl':
			await connection.setTransport('/reflux/index.mjs', [
				{ base: '/libby/index.mjs', wisp: wispUrl }
			]);
			break;
		case 'libcurlRaw':
			await connection.setTransport('/libby/index.mjs', [
				{ base: '/libby/index.mjs', wisp: wispUrl }
			]);
			break;
	}
}
