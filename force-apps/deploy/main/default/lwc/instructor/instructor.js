import { LightningElement } from "lwc";

export default class Instructor extends LightningElement {
	selectedCourseDeliveryId = "";

	onChangedCxD(event) {
		this.selectedCourseDeliveryId = event.detail.CxD;
	}
}
