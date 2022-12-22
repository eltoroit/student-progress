import { LightningElement } from "lwc";

export default class Instructor extends LightningElement {
	deliveryData = [];

	onDeliveryData(event) {
		this.deliveryData = event.detail;
	}
}
