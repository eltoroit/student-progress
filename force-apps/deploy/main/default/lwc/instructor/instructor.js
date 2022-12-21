import { LightningElement } from "lwc";

export default class Instructor extends LightningElement {
	currentCourseDeliveryKey = "";

	onChangedCxD(event) {
		this.currentCourseDeliveryKey = event.detail.CxD;
	}

	onData(event) {
		const { obj, data } = event.detail;
		switch (obj) {
			case "ActiveDeliveries": {
				console.log(`*** obj: ${obj}`, JSON.parse(JSON.stringify(data)));
				break;
			}
			default: {
				debugger;
				break;
			}
		}
	}
}
