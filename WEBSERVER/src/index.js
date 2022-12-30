import WS from "./webserver.js";
import SF from "./salesforce.js";
import * as dotenv from "dotenv";
dotenv.config();

console.log("--- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---");
console.log("--- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---");
console.log("--- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---");
if (process.env.DYNO) {
	console.log(`Running on Heroku dyno: ${process.env.DYNO}`);
} else {
	console.log(`Running locally`);
}
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
			console.log("Notifying Socket.io", { eventName, data });
			ws.ionotify(eventName, data);
		},
	});
})();
