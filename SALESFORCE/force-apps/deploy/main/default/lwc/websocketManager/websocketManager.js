import Utils from "c/utils";
import { LightningElement } from "lwc";
import srAttendees from "@salesforce/resourceUrl/Attendees";
import { loadScript } from "lightning/platformResourceLoader";

export default class WebsocketManager extends LightningElement {
	socket;
	initialized = false;

	async connectedCallback() {
		try {
			await loadScript(this, `${srAttendees}/socket.io.min.js`);
			this.socket = window.io("https://th-attendee-reporting-bug.herokuapp.com"); /// This should be read from some config settings (MDT?)
			this.connection();
			this.listen();
			this.initialized = true;
		} catch (ex) {
			Utils.logger.error(ex);
			this.dispatchEvent(
				new CustomEvent("iostatus", { bubbles: true, composed: true, detail: { message: "Can't initialize Socket.io", color: "red" } })
			);
			debugger;
		}
	}

	connection() {
		let message;
		this.socket.on("connect", () => {
			const engine = this.socket.io.engine;
			// In most cases, prints "polling"
			message = `Socket.io | Connected using ${engine.transport.name}`;
			this.dispatchEvent(new CustomEvent("iostatus", { bubbles: true, composed: true, detail: { message, color: "yellow" } }));

			engine.once("upgrade", () => {
				// called when the transport is upgraded (i.e. from HTTP long-polling to WebSocket), in most cases, prints "websocket"
				message = `Socket.io | Connection upgraded to ${engine.transport.name}`;
				this.dispatchEvent(new CustomEvent("iostatus", { bubbles: true, composed: true, detail: { message, color: "green" } }));
			});

			engine.on("close", (...args) => {
				message = `Socket.io | Connection lost`;
				Utils.logger.log(message, args);
				this.dispatchEvent(new CustomEvent("iostatus", { bubbles: true, composed: true, detail: { message, color: "red" } }));
			});
		});

		this.socket.io.on("error", (error) => {
			message = `Socket.io | Unable to connect | ${error}`;
			Utils.logger.log(message, error);
			this.dispatchEvent(new CustomEvent("iostatus", { bubbles: true, composed: true, detail: { message, color: "red" } }));
		});

		this.socket.io.on("reconnect", (...args) => {
			message = `Socket.io | Connection restablished`;
			Utils.logger.log(message, args);
			this.dispatchEvent(new CustomEvent("iostatus", { bubbles: true, composed: true, detail: { message, color: "green" } }));
		});
	}

	listen() {
		this.socket.on("ServerData", (detail) => {
			Utils.logger.log(`Socket.io | ServerData`, detail);
			this.dispatchEvent(new CustomEvent("received", { detail }));
		});
	}
}
