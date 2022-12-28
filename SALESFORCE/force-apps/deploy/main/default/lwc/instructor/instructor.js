import { LightningElement } from "lwc";

export default class Instructor extends LightningElement {
	deliveryData = [];
	showQR = true;

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
