import { LightningElement } from "lwc";

export default class Instructor extends LightningElement {
	currentCourseDeliveryKey = "";

	onChangedCxD(event) {
		this.currentCourseDeliveryKey = event.detail.CxD;
	}
}
