import Utils from "c/utils";
import { api, LightningElement } from "lwc";

import AssignOrgNumbers from "@salesforce/apex/Data.AssignOrgNumbers";
import pickRandomAttendee from "@salesforce/apex/Data.pickRandomAttendee";
import getActiveDeliveries from "@salesforce/apex/Data.getActiveDeliveries";
import getDeliveryProgress from "@salesforce/apex/Data.getDeliveryProgress";
import getExerciseProgress from "@salesforce/apex/Data.getExerciseProgress";
import getCoursesPerDelivery from "@salesforce/apex/Data.getCoursesPerDelivery";
import getAttendeesForDelivery from "@salesforce/apex/Data.getAttendeesForDelivery";
import getAllExercisesForCourse from "@salesforce/apex/Data.getAllExercisesForCourse";
import getAttendeeDataByAttendeeId from "@salesforce/apex/Data.getAttendeeDataByAttendeeId";
import getActiveDeliveriesWithCourses from "@salesforce/apex/Data.getActiveDeliveriesWithCourses";

import registerAttendee from "@salesforce/apex/Data.registerAttendee";
import startStopExercise from "@salesforce/apex/Data.startStopExercise";
import updateAttendeeStatus from "@salesforce/apex/Data.updateAttendeeStatus";
import validateAttendeeRegistration from "@salesforce/apex/Data.validateAttendeeRegistration";

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

	@api fetchAttendeesForDelivery({ deliveryId }) {
		if (deliveryId) {
			this.callApex({ obj: "AttendeesForDelivery", apexPromise: getAttendeesForDelivery({ deliveryId }), forceEvent: true });
		}
	}

	@api fetchAttendeeDataByAttendeeId({ attendeeId }) {
		if (attendeeId) {
			this.callApex({ obj: "AttendeeDataByAttendeeId", apexPromise: getAttendeeDataByAttendeeId({ attendeeId }), forceEvent: true });
		}
	}
	//#endregion

	//#region ACTIONS
	@api async doStartStopExercise({ deliveryId, exerciseId, isStart }) {
		if (deliveryId && exerciseId) {
			await this.callApex({ obj: null, apexPromise: startStopExercise({ deliveryId, exerciseId, isStart }), forceEvent: false });
			this.fetchActiveDeliveriesWithCourses();
		}
	}

	@api async doUpdateAttendeeStatus({ exerciseId, attendeeId, status }) {
		if (exerciseId && attendeeId) {
			await this.callApex({ obj: null, apexPromise: updateAttendeeStatus({ exerciseId, attendeeId, status }), forceEvent: false });
		} else {
			throw new Error("Exercise and attendeeId are required");
		}
	}

	@api async doValidateAttendeeRegistration({ deliveryId, attendeeId }) {
		let output = null;
		if (deliveryId && attendeeId) {
			try {
				output = await this.callApex({ obj: null, apexPromise: validateAttendeeRegistration({ deliveryId, attendeeId }), forceEvent: false });
			} catch (ex) {
				output = null;
			}
		}
		return output;
	}

	@api async doRegisterAttendee({ deliveryId, attendee }) {
		let output = null;
		if (deliveryId && attendee) {
			try {
				output = await this.callApex({ obj: null, apexPromise: registerAttendee({ deliveryId, attendee }), forceEvent: false });
			} catch (ex) {
				output = null;
			}
		}
		return output;
	}

	@api async doPickRandomAttendee({ deliveryId }) {
		let output = null;
		if (deliveryId) {
			try {
				output = await this.callApex({ obj: null, apexPromise: pickRandomAttendee({ deliveryId }), forceEvent: false });
			} catch (ex) {
				output = null;
			}
		}
		return output;
	}

	@api async doAssignOrgNumbers({ deliveryId, courseId }) {
		if (deliveryId && courseId) {
			await this.callApex({ obj: null, apexPromise: AssignOrgNumbers({ deliveryId, courseId, isReset: false }), forceEvent: false });
		}
	}
	@api async doResetOrgNumbers({ deliveryId, courseId }) {
		if (deliveryId && courseId) {
			await this.callApex({ obj: null, apexPromise: AssignOrgNumbers({ deliveryId, courseId, isReset: true }), forceEvent: false });
		}
	}

	//#endregion

	onEventReceived(event) {
		const { entityName, deliveryId, count } = event.detail;
		switch (entityName) {
			case "EXERCISE":
			case "Delivery__c":
			case "Attendee__c":
			case "Exercise_X_Attendee__c": {
				this.dispatchEvent(
					new CustomEvent("data", {
						detail: {
							obj: entityName,
							data: deliveryId,
							count
						}
					})
				);
				break;
			}
			default:
				Utils.logger.log(JSON.parse(JSON.stringify(event.detail)), event.detail);
				debugger;
				break;
		}
	}

	async callApex({ obj, apexPromise, forceEvent = false }) {
		let output = null;
		try {
			// Utils.logger.log(`Call Apex`, obj);
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
