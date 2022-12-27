import WS from "./webserver.js";
import SF from "./salesforce.js";
import * as dotenv from "dotenv";
dotenv.config();

console.log("--- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---");
console.log("--- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---");
console.log("--- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---");
console.log(`Dyno: ${process.env.DYNO}`);
console.log("--- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---");
console.log("--- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---");
console.log("--- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---");

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
