import Utils from "c/utils";
import { api, LightningElement, wire } from "lwc";
// import { refreshApex } from "@salesforce/apex";
import updateStatus from "@salesforce/apex/Attendee.updateStatus";
import getAttendeeById from "@salesforce/apex/Attendee.getAttendeeById";
import getDeliveryById from "@salesforce/apex/Attendee.getDeliveryById";
import getExercisetById from "@salesforce/apex/Attendee.getExercisetById";

export default class Attendee extends LightningElement {
	forceRefresh = 0;
	loading = true;
	attendee = {};
	errorMessage = "";
	@api attendeeId = null;

	delivery = {};
	wiredDeliver = null;
	@api deliveryId = null;

	exercise = {};
	exerciseId = null;
	exerciseIsActive = false;

	connectedCallback() {
		// setInterval(() => {
		Utils.log("Refresh");
		this.onRefreshClick();
		// }, 5e3);
	}

	@wire(getAttendeeById, { attendeeId: "$attendeeId" })
	wired_GetAttendeeById(result) {
		let { data, error } = result;
		if (data) {
			this.attendee = data;
		} else if (error) {
			this.attendee = {};
		}
	}

	@wire(getDeliveryById, { deliveryId: "$deliveryId", forceRefresh: "$forceRefresh" })
	wired_GetDeliveryById(result) {
		this.wiredDeliver = result;
		let { data, error } = result;
		if (data) {
			this.delivery = { ...data };
			if (this.delivery) {
				this.delivery.Name = `${data.Name} (${data.Instructor__c})`;
			}
			this.exercise = data.CurrentExercise__r;
			this.exerciseId = data.CurrentExercise__c;
			this.exerciseIsActive = data.CurrentExerciseIsActive__c;
			if (!this.exerciseId) {
				this.exercise = {};
			}
			this.loading = false;
		} else if (error) {
			this.delivery = {};
			this.loading = false;
		}
	}

	@wire(getExercisetById, { exerciseId: "$exerciseId" })
	wired_GetExercisetById(result) {
		let { data, error } = result;
		if (data) {
			this.exercise = data;
			this.loading = false;
		} else if (error) {
			this.exercise = {};
			this.loading = false;
		}
	}

	onRegisterClick() {
		this.dispatchEvent(new CustomEvent("register"));
	}

	onRefreshClick() {
		this.forceRefresh++;
		// refreshApex(this.wiredDeliver)
		// 	.then(() => {
		// 		this.errorMessage = "";
		// 	})
		// 	.catch((error) => {
		// 		Utils.log(error);
		// 		this.errorMessage = `Error refreshing data. ${error.statusText} ${error.body.message}`;
		// 	});
	}

	onDoneClick() {
		this.updateStatus("03-DONE");
	}
	onWorkingClick() {
		this.updateStatus("01-WORKING");
	}
	onLaterClick() {
		this.updateStatus("02-LATER");
	}
	updateStatus(status) {
		this.loading = true;
		updateStatus({ exerciseId: this.exerciseId, attendeeId: this.attendeeId, status })
			.then(() => {
				Utils.showNotification(this, { title: "Success", message: "Thanks for completing the exercise" });
				setTimeout(() => {
					this.loading = false;
				}, 1e3);
			})
			.catch((error) => {
				this.loading = false;
				Utils.log(error);
				Utils.showNotification(this, {
					title: "Error",
					message: "Error marking as done",
					variant: Utils.variants.error
				});
			});
	}
}
