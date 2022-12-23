import Utils from "c/utils";
import { api, LightningElement } from "lwc";
import startStopExercise from "@salesforce/apex/Data.startStopExercise";
import getDeliveryProgress from "@salesforce/apex/Data.getDeliveryProgress";
import getExerciseProgress from "@salesforce/apex/Data.getExerciseProgress";
import updateStudentStatus from "@salesforce/apex/Data.updateStudentStatus";
import validateStudentRegistration from "@salesforce/apex/Data.validateStudentRegistration";
import getCoursesPerDelivery from "@salesforce/apex/Data.getCoursesPerDelivery";
import getAllExercisesForCourse from "@salesforce/apex/Data.getAllExercisesForCourse";
import getActiveDeliveriesWithCourses from "@salesforce/apex/Data.getActiveDeliveriesWithCourses";

export default class ApexManager extends LightningElement {
	@api filterKey = null;
	@api filterValue = null;
	oldValues = {};

	@api fetchActiveDeliveriesWithCourses() {
		this.callApex({ obj: "ActiveDeliveriesWithCourses", apexPromise: getActiveDeliveriesWithCourses() });
	}

	@api fetchCoursesPerDelivery({ deliveryId }) {
		if (deliveryId) {
			this.callApex({ obj: "CoursesPerDelivery", apexPromise: getCoursesPerDelivery({ deliveryId }) });
		}
	}

	@api fetchAllExercisesForCourse({ courseId }) {
		if (courseId) {
			this.callApex({ obj: "AllExercisesForCourse", apexPromise: getAllExercisesForCourse({ courseId }) });
		}
	}

	@api fetchDeliveryProgress({ deliveryId }) {
		if (deliveryId) {
			this.callApex({ obj: "DeliveryProgress", apexPromise: getDeliveryProgress({ deliveryId }) });
		}
	}

	@api fetchExerciseProgress({ deliveryId, exerciseId }) {
		if (deliveryId && exerciseId) {
			this.callApex({ obj: "ExerciseProgress", apexPromise: getExerciseProgress({ deliveryId, exerciseId }) });
		}
	}

	@api async doStartStopExercise({ deliveryId, exerciseId, isStart }) {
		if (deliveryId && exerciseId) {
			await this.callApex({ obj: null, apexPromise: startStopExercise({ deliveryId, exerciseId, isStart }) });
			this.fetchActiveDeliveriesWithCourses();
		}
	}

	@api async doUpdateStudentStatus({ exerciseId, studentId, status }) {
		if (exerciseId && studentId) {
			await this.callApex({ obj: null, apexPromise: updateStudentStatus({ exerciseId, studentId, status }) });
		} else {
			throw new Error("Exercise and studentId are required");
		}
	}

	@api async doValidateStudentRegistration({ deliveryId, studentId }) {
		let output = null;
		if (deliveryId && studentId) {
			// eslint-disable-next-line no-return-await
			output = await this.callApex({ obj: null, apexPromise: validateStudentRegistration({ deliveryId, studentId }) });
		} else {
			throw new Error("Delivery and studentId are required");
		}
		return output;
	}

	onEventReceived(event) {
		const { entityName, recordIds } = event.detail;
		Utils.logger.log("OnEventReceived: ", JSON.parse(JSON.stringify(event.detail)), entityName, recordIds);
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
				Utils.logger.log(JSON.parse(JSON.stringify(event.detail)), entityName, recordIds);
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
			Utils.logger.log(`Call Apex`, obj);
			const data = await apexPromise;
			if (obj) {
				const oldValue = this.oldValues[obj]?.data;
				const newValue = JSON.stringify(data);

				Utils.logger.log(`CallApex | obj: ${obj} | Old: `, oldValue ? JSON.parse(oldValue) : null, " | New: ", JSON.parse(newValue));

				if (oldValue !== newValue) {
					this.dispatchEvent(new CustomEvent("data", { detail: { obj, data } }));
				} else {
					Utils.logger.log(`Request from data event and data was the same... skipping`);
				}

				this.oldValues[obj] = {
					dttm: new Date(),
					data: newValue
				};
			} else {
				Utils.logger.log(`Obj was null`);
			}
			output = data;
		} catch (ex) {
			Utils.logger.log(ex);
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
