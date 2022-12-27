import Utils from "c/utils";
import { LightningElement } from "lwc";
import srStudents from "@salesforce/resourceUrl/Students";
import { loadScript } from "lightning/platformResourceLoader";

export default class WebsocketManager extends LightningElement {
	socket;
	initialized = false;

	async connectedCallback() {
		try {
			await loadScript(this, `${srStudents}/socket.io.min.js`);
			this.socket = window.io("https://localhost:3001");
			this.connection();
			this.listen();
			this.initialized = true;
		} catch (ex) {
			Utils.logger.error(ex);
			// eslint-disable-next-line no-alert
			alert("Can't initialize Socket.io");
			debugger;
		}
	}

	connection() {
		let message;
		this.socket.on("connect", () => {
			const engine = this.socket.io.engine;
			// In most cases, prints "polling"
			message = `Socket.io | Connected using [${engine.transport.name}]`;
			this.dispatchEvent(new CustomEvent("connection", { detail: { message, type: "INFO" } }));

			engine.once("upgrade", () => {
				// called when the transport is upgraded (i.e. from HTTP long-polling to WebSocket), in most cases, prints "websocket"
				message = `Socket.io | Connection upgrade to [${engine.transport.name}]`;
				this.dispatchEvent(new CustomEvent("connection", { detail: { message, type: "INFO" } }));
			});

			engine.on("close", (...args) => {
				message = `Socket.io | Connection lost`;
				Utils.logger.log(message, args);
				this.dispatchEvent(new CustomEvent("connection", { detail: { message, type: "ERROR" } }));
			});
		});

		this.socket.io.on("reconnect", (...args) => {
			message = `Socket.io | Connection restablished`;
			Utils.logger.log(message, args);
			this.dispatchEvent(new CustomEvent("connection", { detail: { message, type: "RECONNECT" } }));
		});
	}

	listen() {
		this.socket.on("ServerData", (detail) => {
			Utils.logger.log(`Socket.io | ServerData`, detail);
			this.dispatchEvent(new CustomEvent("received", { detail }));
		});
	}
}
