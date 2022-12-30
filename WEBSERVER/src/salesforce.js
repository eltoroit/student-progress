import jsforce from "jsforce";

export default class Salesforce {
	conn;
	streamingApi = {
		pending: {},
		replayId: -1, // https://developer.salesforce.com/docs/atlas.en-us.api_streaming.meta/api_streaming/using_streaming_api_durability.htm?q=replayid
		channelName: process.env.channelName,
	};

	async soapLogin() {
		this.conn = new jsforce.Connection({
			loginUrl: "https://test.salesforce.com",
		});
		await this._login({ type: "SOAP" });
	}

	async oauthUNPWLogin() {
		this.conn = new jsforce.Connection({
			oauth2: {
				loginUrl: "https://test.salesforce.com",
				clientId: process.env.consumerKey,
				clientSecret: process.env.consumerSecret,
				redirectUri: process.env.redirectUri,
			},
		});
		await this._login({ type: "OAUTH UNPW" });
	}

	async subscribe({ callback }) {
		try {
			const replayExts = [new jsforce.StreamingExtension.Replay(this.streamingApi.channelName, this.streamingApi.replayId)];
			const fayeClient = this.conn.streaming.createClient(replayExts);
			const subscription = await fayeClient.subscribe(this.streamingApi.channelName, (eventData) => {
				this._processNewEventData({ eventData, callback });
			});
		} catch (ex) {
			console.error(ex);
			debugger;
		}
	}

	_login({ type }) {
		return new Promise((resolve, reject) => {
			this.conn.login(process.env.username, process.env.password, (err, userInfo) => {
				if (err) {
					console.error(err);
					reject(err);
				} else {
					console.log(`${type} | _sessionType | ${this.conn._sessionType}`);
					console.log(`${type} | accessToken | ${this.conn.accessToken}`);
					console.log(`${type} | instanceUrl | ${this.conn.instanceUrl}`);
					console.log(`${type} | User Id | ${userInfo.id}`);
					console.log(`${type} | Org Id | ${userInfo.organizationId}`);
					resolve();
				}
			});
		});
	}

	_processNewEventData({ eventData, callback }) {
		const payload = eventData.payload;
		console.log("Received event from Salesforce", payload);

		const parsedData = {};
		parsedData.entityName = payload.EntityName__c;
		parsedData.deliveryId = payload.Delivery__c;
		parsedData.recordCount = payload.Records__c;
		parsedData.key = `${parsedData.entityName}|${parsedData.deliveryId}`;

		if (this.streamingApi.pending[parsedData.key]) {
			this.streamingApi.pending[parsedData.key].count += parsedData.recordCount;
		} else {
			this.streamingApi.pending[parsedData.key] = {
				clock: null,
				count: parsedData.recordCount,
			};
		}
		clearTimeout(this.streamingApi.pending[parsedData.key].clock);
		this.streamingApi.pending[parsedData.key].clock = setTimeout(() => {
			const keyParts = parsedData.key.split("|");
			callback({
				eventName: "ServerData",
				data: {
					entityName: keyParts[0],
					deliveryId: keyParts[1],
					count: this.streamingApi.pending[parsedData.key].count,
				},
			});
			delete this.streamingApi.pending[parsedData.key];
		}, 5e2);
	}
}
