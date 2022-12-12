import Utils from "c/utils";
import { api, LightningElement, wire } from "lwc";
// import { refreshApex } from "@salesforce/apex";
import updateStatus from "@salesforce/apex/Student.updateStatus";
import getStudentById from "@salesforce/apex/Student.getStudentById";
import getDeliveryById from "@salesforce/apex/Student.getDeliveryById";
import getExercisetById from "@salesforce/apex/Student.getExercisetById";

export default class Student extends LightningElement {
	forceRefresh = 0;
	loading = true;
	student = {};
	errorMessage = "";
	@api studentId = null;

	delivery = {};
	wiredDeliver = null;
	@api deliveryId = null;

	exercise = {};
	exerciseId = null;
	exerciseIsActive = false;

	connectedCallback() {
		setInterval(() => {
			console.log("*** Refresh");
			this.onRefreshClick();
		}, 5e3);
	}

	@wire(getStudentById, { studentId: "$studentId" })
	wired_GetStudentById(result) {
		let { data, error } = result;
		if (data) {
			this.student = data;
		} else if (error) {
			this.student = {};
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
		// 		console.log(error);
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
		updateStatus({ exerciseId: this.exerciseId, studentId: this.studentId, status })
			.then(() => {
				Utils.showNotification(this, { title: "Success", message: "Thanks for completing the exercise" });
				setTimeout(() => {
					this.loading = false;
				}, 1e3);
			})
			.catch((error) => {
				this.loading = false;
				console.log(error);
				Utils.showNotification(this, {
					title: "Error",
					message: "Error marking as done",
					variant: Utils.variants.error
				});
			});
	}
}
