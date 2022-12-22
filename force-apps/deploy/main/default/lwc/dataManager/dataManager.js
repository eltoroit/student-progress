import Utils from "c/utils";
import { api, LightningElement } from "lwc";
import startStopExercise from "@salesforce/apex/Data.startStopExercise";
import getDeliveryProgress from "@salesforce/apex/Data.getDeliveryProgress";
import getActiveDeliveries from "@salesforce/apex/Data.getActiveDeliveries";
import getExerciseProgress from "@salesforce/apex/Data.getExerciseProgress";
import getCoursesPerDelivery from "@salesforce/apex/Data.getCoursesPerDelivery";
import getAllExercisesForCourse from "@salesforce/apex/Data.getAllExercisesForCourse";

export default class DataManager extends LightningElement {
	@api filterKey = null;
	@api filterValue = null;
	oldValues = {};

	@api fetchActiveDeliveries() {
		this.callApex({ obj: "ActiveDeliveries", apexPromise: getActiveDeliveries() });
	}

	@api fetchCoursesPerDelivery({ deliveryId }) {
		this.callApex({ obj: "CoursesPerDelivery", apexPromise: getCoursesPerDelivery({ deliveryId }) });
	}

	@api fetchAllExercisesForCourse({ courseId }) {
		this.callApex({ obj: "AllExercisesForCourse", apexPromise: getAllExercisesForCourse({ courseId }) });
	}

	@api fetchDeliveryProgress({ deliveryId }) {
		this.callApex({ obj: "DeliveryProgress", apexPromise: getDeliveryProgress({ deliveryId }) });
	}

	@api fetchExerciseProgress({ deliveryId, exerciseId }) {
		this.callApex({ obj: "ExerciseProgress", apexPromise: getExerciseProgress({ deliveryId, exerciseId }) });
	}

	@api async doStartStopExercise({ deliveryId, exerciseId, isStart }) {
		await this.callApex({ obj: null, apexPromise: startStopExercise({ deliveryId, exerciseId, isStart }) });
		this.fetchActiveDeliveries();
	}

	onEventReceived(event) {
		const { entityName, recordIds } = event.detail;
		switch (entityName) {
			case "Delivery__c": {
				this.callApex({ obj: "ActiveDeliveries", apexPromise: getActiveDeliveries() });
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

	async callApex({ obj, apexPromise }) {
		let output = null;
		try {
			const data = await apexPromise;
			if (obj) {
				const oldValue = this.oldValues[obj]?.data;
				const newValue = JSON.stringify(data);

				console.log(`*** CallApex | obj: ${obj} | Old: `, oldValue ? JSON.parse(oldValue) : null, " | New: ", JSON.parse(newValue));

				if (oldValue !== newValue) {
					this.dispatchEvent(new CustomEvent("data", { detail: { obj, data } }));
				} else {
					console.log(`*** Request from data event and data was the same... skipping`);
				}

				this.oldValues[obj] = {
					dttm: new Date(),
					data: newValue
				};
			} else {
				console.log(`*** Obj was null`);
			}
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
