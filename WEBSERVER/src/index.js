import WS from "./webserver.js";
import SF from "./salesforce.js";
import * as dotenv from "dotenv";
dotenv.config();

const ws = new WS();
ws.createServer();

(async () => {
	const sf = new SF();
	// await sf.soapLogin();
	await sf.oauthUNPWLogin();
	sf.subscribe({
		callback: (eventName, data) => {
			ws.ionotify(eventName, data);
		},
	});
})();
