import { io } from "./socket.io.esm.min.js";
// import { io } from "https://cdn.socket.io/4.5.4/socket.io.esm.min.js";

export default class MySocketIO {
	socket;

	constructor() {
		this.socket = io("https://localhost:3001");
		this.connection();
		this.listen();
	}

	connection() {
		this.socket.on("connect", () => {
			const engine = this.socket.io.engine;
			console.log(`Socket.io connected using: | ${engine.transport.name}`); // in most cases, prints "polling"

			engine.once("upgrade", () => {
				// called when the transport is upgraded (i.e. from HTTP long-polling to WebSocket)
				console.log(`Socket.io connection upgrade to: | ${engine.transport.name}`); // in most cases, prints "websocket"
			});

			engine.on("close", (...args) => {
				console.log(`Socket.io connection lost`, args);
			});
		});

		this.socket.io.on("reconnect", (...args) => {
			console.log(`Socket.io connection restablished`, args);
		});
	}

	listen() {
		this.socket.on("ServerData", (data) => {
			console.log(`ServerData`, data);
		});
	}
}
const mySIO = new MySocketIO();
