import Utils from "c/utils";
import { api, LightningElement } from "lwc";
import srStudents from "@salesforce/resourceUrl/Students";
import { loadScript } from "lightning/platformResourceLoader";

export default class WebsocketManager extends LightningElement {
	socket;
	initialized = false;

	async connectedCallback() {
		try {
			debugger;
			// await loadScript(this, `${srStudents}/socket.io.esm.min.js`);
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
		this.socket.on("connect", () => {
			const engine = this.socket.io.engine;
			Utils.logger.log(`Socket.io | connected using: | ${engine.transport.name}`); // in most cases, prints "polling"

			engine.once("upgrade", () => {
				// called when the transport is upgraded (i.e. from HTTP long-polling to WebSocket)
				Utils.logger.log(`Socket.io | connection upgrade to: | ${engine.transport.name}`); // in most cases, prints "websocket"
			});

			engine.on("close", (...args) => {
				Utils.logger.log(`Socket.io | connection lost`, args);
			});
		});

		this.socket.io.on("reconnect", (...args) => {
			Utils.logger.log(`Socket.io | connection restablished`, args);
		});
	}

	listen() {
		this.socket.on("ServerData", (data) => {
			Utils.logger.log(`Socket.io | ServerData`, data);
		});
	}
}
