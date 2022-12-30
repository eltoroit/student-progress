import { LightningElement } from "lwc";

export default class Instructor extends LightningElement {
	deliveryData = [];
	showQR = true;
	urlAttendees = "https://sfdc.co/thAttendeeReporting";

	get urlAttendeesWithSpaces() {
		return Array.from(this.urlAttendees).join(" ");
	}

	onDeliveryData(event) {
		this.deliveryData = event.detail;
	}

	onQrRefresh() {
		this.showQR = false;
		setTimeout(() => {
			this.showQR = true;
		}, 1e3);
	}
}
