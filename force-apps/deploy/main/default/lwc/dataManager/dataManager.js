import Utils from "c/utils";
import { api, LightningElement } from "lwc";
import startStopExercise from "@salesforce/apex/Data.startStopExercise";
import getDeliveryProgress from "@salesforce/apex/Data.getDeliveryProgress";
import getExerciseProgress from "@salesforce/apex/Data.getExerciseProgress";
import updateStudentStatus from "@salesforce/apex/Data.updateStudentStatus";
import validateRegistration from "@salesforce/apex/Data.validateRegistration";
import getCoursesPerDelivery from "@salesforce/apex/Data.getCoursesPerDelivery";
import getAllExercisesForCourse from "@salesforce/apex/Data.getAllExercisesForCourse";
import getActiveDeliveriesWithCourses from "@salesforce/apex/Data.getActiveDeliveriesWithCourses";

export default class DataManager extends LightningElement {
	@api filterKey = null;
	@api filterValue = null;
	oldValues = {};

	@api fetchActiveDeliveriesWithCourses() {
		this.callApex({ obj: "ActiveDeliveriesWithCourses", apexPromise: getActiveDeliveriesWithCourses() });
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
		this.fetchActiveDeliveriesWithCourses();
	}

	@api async doUpdateStudentStatus({ exerciseId, studentId, status }) {
		await this.callApex({ obj: null, apexPromise: updateStudentStatus({ exerciseId, studentId, status }) });
	}

	@api async doValidateRegistration({ deliveryId, studentId }) {
		// eslint-disable-next-line no-return-await
		return await this.callApex({ obj: null, apexPromise: validateRegistration({ deliveryId, studentId }) });
	}

	onEventReceived(event) {
		const { entityName, recordIds } = event.detail;
		Utils.log("DataManager (onEventReceived): ", JSON.parse(JSON.stringify(event.detail)), entityName, recordIds);
		switch (entityName) {
			case "Delivery__c": {
				this.fetchActiveDeliveriesWithCourses();
				break;
			}
			case "Exercise_X_Student__c": {
				// I do not know how to get the data that is required, just bubble up and let the parent decide :-)
				this.dispatchEvent(new CustomEvent("data", { detail: { obj: "Exercise_X_Student__c", data: recordIds } }));
				break;
			}
			default:
				Utils.log(JSON.parse(JSON.stringify(event.detail)), entityName, recordIds);
				debugger;
				break;
		}
	}

	onEventError(event) {
		Utils.showNotification(this, {
			title: "Error Getting Data",
			message: `EmpApi failed to get data: ${JSON.stringify(event.detail)}`,
			variant: Utils.msgVariants.error,
			mode: Utils.msgModes.sticky
		});
		debugger;
	}

	async callApex({ obj, apexPromise }) {
		let output = null;
		try {
			Utils.log(`Call Apex`, obj);
			const data = await apexPromise;
			if (obj) {
				const oldValue = this.oldValues[obj]?.data;
				const newValue = JSON.stringify(data);

				Utils.log(`CallApex | obj: ${obj} | Old: `, oldValue ? JSON.parse(oldValue) : null, " | New: ", JSON.parse(newValue));

				if (oldValue !== newValue) {
					this.dispatchEvent(new CustomEvent("data", { detail: { obj, data } }));
				} else {
					Utils.log(`Request from data event and data was the same... skipping`);
				}

				this.oldValues[obj] = {
					dttm: new Date(),
					data: newValue
				};
			} else {
				Utils.log(`Obj was null`);
			}
			output = data;
		} catch (ex) {
			Utils.log(ex);
			let message = "";
			if (obj) message = `${obj}:`;
			message += `${ex.body.message}`;
			Utils.showNotification(this, {
				title: "Error calling Apex",
				message,
				variant: Utils.msgVariants.error,
				mode: Utils.msgModes.sticky
			});
			throw ex;
		}
		return output;
	}
}
