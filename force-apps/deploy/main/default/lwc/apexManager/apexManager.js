import Utils from "c/utils";
import { api, LightningElement } from "lwc";

import getActiveDeliveries from "@salesforce/apex/Data.getActiveDeliveries";
import getDeliveryProgress from "@salesforce/apex/Data.getDeliveryProgress";
import getExerciseProgress from "@salesforce/apex/Data.getExerciseProgress";
import getCoursesPerDelivery from "@salesforce/apex/Data.getCoursesPerDelivery";
import getStudentsForDelivery from "@salesforce/apex/Data.getStudentsForDelivery";
import getAllExercisesForCourse from "@salesforce/apex/Data.getAllExercisesForCourse";
import getStudentDataByStudentId from "@salesforce/apex/Data.getStudentDataByStudentId";
import getActiveDeliveriesWithCourses from "@salesforce/apex/Data.getActiveDeliveriesWithCourses";

import registerStudent from "@salesforce/apex/Data.registerStudent";
import startStopExercise from "@salesforce/apex/Data.startStopExercise";
import updateStudentStatus from "@salesforce/apex/Data.updateStudentStatus";
import validateStudentRegistration from "@salesforce/apex/Data.validateStudentRegistration";

export default class ApexManager extends LightningElement {
	@api filterKey = null;
	@api filterValue = null;
	oldValues = {};

	//#region FETCH
	@api fetchActiveDeliveries() {
		this.callApex({ obj: "ActiveDeliveries", apexPromise: getActiveDeliveries(), forceEvent: true });
	}

	@api fetchActiveDeliveriesWithCourses() {
		this.callApex({ obj: "ActiveDeliveriesWithCourses", apexPromise: getActiveDeliveriesWithCourses(), forceEvent: true });
	}

	@api fetchCoursesPerDelivery({ deliveryId }) {
		if (deliveryId) {
			this.callApex({ obj: "CoursesPerDelivery", apexPromise: getCoursesPerDelivery({ deliveryId }), forceEvent: true });
		}
	}

	@api fetchAllExercisesForCourse({ courseId }) {
		if (courseId) {
			this.callApex({ obj: "AllExercisesForCourse", apexPromise: getAllExercisesForCourse({ courseId }), forceEvent: true });
		}
	}

	@api fetchDeliveryProgress({ deliveryId }) {
		if (deliveryId) {
			this.callApex({ obj: "DeliveryProgress", apexPromise: getDeliveryProgress({ deliveryId }), forceEvent: true });
		}
	}

	@api fetchExerciseProgress({ deliveryId, exerciseId }) {
		if (deliveryId && exerciseId) {
			this.callApex({ obj: "ExerciseProgress", apexPromise: getExerciseProgress({ deliveryId, exerciseId }), forceEvent: true });
		}
	}

	@api fetchStudentsForDelivery({ deliveryId }) {
		if (deliveryId) {
			this.callApex({ obj: "StudentsForDelivery", apexPromise: getStudentsForDelivery({ deliveryId }), forceEvent: true });
		}
	}

	@api fetchStudentDataByStudentId({ studentId }) {
		if (studentId) {
			this.callApex({ obj: "StudentDataByStudentId", apexPromise: getStudentDataByStudentId({ studentId }), forceEvent: true });
		}
	}
	//#endregion

	//#region ACTIONS
	@api async doStartStopExercise({ deliveryId, exerciseId, isStart }) {
		if (deliveryId && exerciseId) {
			await this.callApex({ obj: null, apexPromise: startStopExercise({ deliveryId, exerciseId, isStart }), forceEvent: true });
			this.fetchActiveDeliveriesWithCourses();
		}
	}

	@api async doUpdateStudentStatus({ exerciseId, studentId, status }) {
		if (exerciseId && studentId) {
			await this.callApex({ obj: null, apexPromise: updateStudentStatus({ exerciseId, studentId, status }), forceEvent: true });
		} else {
			throw new Error("Exercise and studentId are required");
		}
	}

	@api async doValidateStudentRegistration({ deliveryId, studentId }) {
		let output = null;
		if (deliveryId && studentId) {
			try {
				output = await this.callApex({ obj: null, apexPromise: validateStudentRegistration({ deliveryId, studentId }), forceEvent: true });
			} catch (ex) {
				output = null;
			}
		}
		return output;
	}

	@api async doRegisterStudent({ deliveryId, student }) {
		let output = null;
		if (deliveryId && student) {
			try {
				output = await this.callApex({ obj: null, apexPromise: registerStudent({ deliveryId, student }), forceEvent: true });
			} catch (ex) {
				output = null;
			}
		}
		return output;
	}
	//#endregion

	onEventReceived(event) {
		const { entityName, recordIds } = event.detail;
		Utils.logger.log("OnEventReceived: ", JSON.parse(JSON.stringify(event.detail)), entityName, recordIds);
		switch (entityName) {
			case "Delivery__c":
			case "Student__c":
			case "Exercise_X_Student__c": {
				this.dispatchEvent(new CustomEvent("data", { detail: { obj: entityName, data: recordIds } }));
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

	async callApex({ obj, apexPromise, forceEvent = false }) {
		let output = null;
		try {
			Utils.logger.log(`Call Apex`, obj);
			const data = await apexPromise;
			if (obj) {
				const oldValue = this.oldValues[obj]?.data;
				const newValue = JSON.stringify(data);

				Utils.logger.log(`CallApex | obj: ${obj} | Old: `, oldValue ? JSON.parse(oldValue) : null, " | New: ", JSON.parse(newValue));

				if (forceEvent || oldValue !== newValue) {
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
