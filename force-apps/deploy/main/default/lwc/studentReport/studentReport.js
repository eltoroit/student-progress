import { api, LightningElement, wire } from "lwc";
import { refreshApex } from "@salesforce/apex";
// import getStudents from "@salesforce/apex/Students.getStudents";
// import updateStatus from "@salesforce/apex/Students.updateStatus";
import getStudentById from "@salesforce/apex/Student.getStudentById";
import getDeliveryById from "@salesforce/apex/Student.getDeliveryById";
import getExercisetById from "@salesforce/apex/Student.getExercisetById";
// import getActiveDeliveries from "@salesforce/apex/Students.getActiveDeliveries";

export default class Student extends LightningElement {
	loading = true;
	student = {};
	@api studentId = null;

	delivery = {};
	wiredDeliver = null;
	@api deliveryId = null;

	exercise = {};
	exerciseId = null;

	connectedCallback() {
		// setInterval(() => {
		// 	this.onRefreshClick();
		// }, 1e3);
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

	@wire(getDeliveryById, { deliveryId: "$deliveryId" })
	wired_GetDeliveryById(result) {
		this.wiredDeliver = result;
		let { data, error } = result;
		if (data) {
			this.delivery = {...data};
			if (this.delivery) {
				this.delivery.Name = `${data.Name} (${data.Instructor__c})`;
			}
			this.exerciseId = data.ActiveExercise__c;
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
		refreshApex(this.wiredDeliver);
	}

	// onDoneClick() {
	// 	this.updateStatus("DONE");
	// }
	// onWorkingClick() {
	// 	this.updateStatus("WORKING");
	// }
	// onLaterClick() {
	// 	this.updateStatus("LATER");
	// }
	// updateStatus(status) {
	// 	this.loading = true;
	// 	updateStatus({ exerciseId: this.selectedExerciseId, studentId: this.selectedStudentId, status })
	// 		.then(() => {
	// 			Utils.showNotification(this, { title: "Success", message: "Thanks for completing the exercise" });
	// 			this.doneLoading();
	// 		})
	// 		.catch((error) => {
	// 			this.doneLoading();
	// 			console.log(error);
	// 			Utils.showNotification(this, {
	// 				title: "Error",
	// 				message: "Error marking as done",
	// 				variant: Utils.variants.error
	// 			});
	// 		});
	// }
}
