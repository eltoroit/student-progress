import Utils from "c/utils";
import { api, LightningElement } from "lwc";
import getActiveDeliveries from "@salesforce/apex/Data.getActiveDeliveries";
import getCoursesPerDelivery from "@salesforce/apex/Data.getCoursesPerDelivery";
import getAllExercisesForCourse from "@salesforce/apex/Data.getAllExercisesForCourse";

export default class DataManager extends LightningElement {
	@api filterKey = null;
	@api filterValue = null;
	@api isRefreshing = false;
	oldValues = {};

	@api fetchActiveDeliveries() {
		this._processApexResults({ obj: "ActiveDeliveries", apexCall: getActiveDeliveries() });
	}

	@api fetchCoursesPerDelivery({ deliveryId }) {
		this._processApexResults({ obj: "CoursesPerDelivery", apexCall: getCoursesPerDelivery({ deliveryId }) });
	}

	@api fetchAllExercisesForCourse({ courseId }) {
		this._processApexResults({ obj: "AllExercisesForCourse", apexCall: getAllExercisesForCourse({ courseId }) });
	}

	onEventReceived(event) {
		const { entityName, recordIds } = event.detail;
		switch (entityName) {
			case "Delivery__c": {
				this.fetchActiveDeliveries();
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

	_processApexResults({ obj, apexCall }) {
		apexCall
			.then((data) => {
				const oldValue = this.oldValues[obj]?.data;
				const newValue = JSON.stringify(data);
				if (this.isRefreshing || oldValue !== newValue) {
					this.oldValues[obj] = {
						dttm: new Date(),
						data: newValue
					};
					this.dispatchEvent(new CustomEvent("data", { detail: { obj, data } }));
				} else {
					console.log(`*** Data was the same, skipping`);
				}
			})
			.catch((error) => {
				Utils.showNotification(this, {
					title: "Error Getting Data",
					message: `${obj}: ${JSON.stringify(error)}`,
					variant: Utils.variants.error
				});
			});
	}
}
