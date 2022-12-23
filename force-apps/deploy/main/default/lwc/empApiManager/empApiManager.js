import Utils from "c/utils";
import { api, LightningElement } from "lwc";
import { subscribe, unsubscribe, onError, setDebugFlag, isEmpEnabled } from "lightning/empApi";

export default class EmpApiManager extends LightningElement {
	@api filterKey;
	@api filterValue;
	empApi = {
		pending: {},
		replayId: -1,
		subscription: {},
		channelName: "/data/StudentEvents__chn"
	};

	connectedCallback() {
		if (isEmpEnabled) {
			setDebugFlag(true);
			subscribe(this.empApi.channelName, this.empApi.replayId, (eventData) => {
				this._processNewEventData({ eventData: JSON.parse(JSON.stringify(eventData)) });
			}).then((response) => {
				if (response.channel === this.empApi.channelName && response.replayId === this.empApi.replayId) {
					this.empApi.subscription = response;
				} else {
					Utils.showNotification(this, {
						title: "Error Subscribing",
						message: `EmpApi subscription: ${JSON.stringify(response)}`,
						variant: Utils.msgVariants.error,
						mode: Utils.msgModes.sticky
					});
				}
			});
			onError((error) => {
				const message = `EmpApi connection failed: ${JSON.stringify(error)}`;
				Utils.showNotification(this, {
					title: "Error Connecting",
					message,
					variant: Utils.msgVariants.error,
					mode: Utils.msgModes.sticky
				});
				console.error(message);
				debugger;
			});
		} else {
			Utils.showNotification(this, {
				title: "Error Streaming API",
				message: `EmpApi not available`,
				variant: Utils.msgVariants.error,
				mode: Utils.msgModes.sticky
			});
		}
	}

	disconnectedCallback() {
		unsubscribe(this.empApi.subscription, (response) => {
			// Response is true for successful unsubscribe
			Utils.log(`unsubscribe() response: ${JSON.stringify(response)}`);
			debugger;
		});
	}

	_processNewEventData({ eventData }) {
		const payload = eventData.data.payload;
		const key = `${payload.ChangeEventHeader.commitNumber}|${payload.ChangeEventHeader.entityName}`;
		// Utils.log(`New Data (pending): ${key}`, payload);
		if (payload[this.filterKey]) {
			// Payload has filter field
			if (payload[this.filterKey] !== this.filterValue) {
				// Payload filter field has a different value
				// Utils.log(`Skip, key field is different value: ${key}`, payload);
				return;
			}
			// Utils.log(`Key field is expected value: ${key}`, payload);
		} else {
			// Utils.log(`No key field: ${key}`, payload);
		}
		if (this.empApi.pending[key]) {
			payload.ChangeEventHeader.recordIds.forEach((recordId) => this.empApi.pending[key].recordIds.add(recordId));
		} else {
			this.empApi.pending[key] = {
				clock: null,
				recordIds: new Set(payload.ChangeEventHeader.recordIds)
			};
		}
		clearTimeout(this.empApi.pending[key].clock);
		this.empApi.pending[key].clock = setTimeout(() => {
			const entityName = key.split("|")[1];
			const recordIds = this.empApi.pending[key].recordIds;
			Utils.log(`EmpApi (timer): Notify new data: ${entityName}`, recordIds);
			this.dispatchEvent(
				new CustomEvent("received", {
					detail: {
						entityName,
						recordIds: Array.from(recordIds)
					}
				})
			);
			delete this.empApi.pending[key];
		}, 5e2);
	}
}
