import Utils from "c/utils";
import { api, LightningElement } from "lwc";
import getDeliveryProgress from "@salesforce/apex/Data.getDeliveryProgress";
import getActiveDeliveries from "@salesforce/apex/Data.getActiveDeliveries";
import getCoursesPerDelivery from "@salesforce/apex/Data.getCoursesPerDelivery";
import getAllExercisesForCourse from "@salesforce/apex/Data.getAllExercisesForCourse";

export default class DataManager extends LightningElement {
	@api filterKey = null;
	@api filterValue = null;
	oldValues = {};

	@api fetchActiveDeliveries() {
		this.callApex({ obj: "ActiveDeliveries", apexPromise: getActiveDeliveries(), isforceEvent: true });
	}

	@api fetchCoursesPerDelivery({ deliveryId }) {
		this.callApex({ obj: "CoursesPerDelivery", apexPromise: getCoursesPerDelivery({ deliveryId }), isforceEvent: true });
	}

	@api fetchAllExercisesForCourse({ courseId }) {
		this.callApex({ obj: "AllExercisesForCourse", apexPromise: getAllExercisesForCourse({ courseId }), isforceEvent: true });
	}

	@api async retrieveDeliveryProgress({ deliveryId }) {
		let output = await this.callApex({ obj: "DeliveryProgress", apexPromise: getDeliveryProgress({ deliveryId }), isforceEvent: false });
		return output;
	}

	onEventReceived(event) {
		const isDispatchEvent = true;
		const { entityName, recordIds } = event.detail;
		switch (entityName) {
			case "Delivery__c": {
				this.callApex({ obj: "ActiveDeliveries", apexPromise: getActiveDeliveries(), isDispatchEvent });
				break;
			}
			default:
				console.log("***", JSON.parse(JSON.stringify(event.detail)), entityName, recordIds);
				debugger;
				break;
		}
	}

	onEventError(event) {
		Utils.showNotification(this, {
			title: "Error Getting Data",
			message: `EmpApi failed to get data: ${JSON.stringify(event.detail)}`,
			variant: Utils.variants.error
		});
		debugger;
	}

	async callApex({ obj, apexPromise, isforceEvent = false, isDispatchEvent = false }) {
		let output = null;
		try {
			const data = await apexPromise;
			const oldValue = this.oldValues[obj]?.data;
			const newValue = JSON.stringify(data);

			console.log(
				`*** CallApex | obj: ${obj} | isforceEvent: ${isforceEvent} | isDispatchEvent: ${isDispatchEvent}`,
				"Old | ", oldValue ? JSON.parse(oldValue) : null,
				"New | ", JSON.parse(newValue)
			);

			if (isforceEvent || isDispatchEvent) {
				if (isforceEvent || oldValue !== newValue) {
					this.dispatchEvent(new CustomEvent("data", { detail: { obj, data } }));
				} else {
					console.log(`*** Request from data event and data was the same... skipping`);
				}
			}
			this.oldValues[obj] = {
				dttm: new Date(),
				data: newValue
			};
			output = data;
		} catch (ex) {
			Utils.showNotification(this, {
				title: "Error Getting Data",
				message: `${obj}: ${JSON.stringify(ex)}`,
				variant: Utils.variants.error
			});
		}
		return output;
	}
}
