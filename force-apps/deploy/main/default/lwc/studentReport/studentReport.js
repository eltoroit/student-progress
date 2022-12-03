import Utils from "c/utils";
import { api, LightningElement, wire } from "lwc";
// import { refreshApex } from "@salesforce/apex";
// import getStudents from "@salesforce/apex/Students.getStudents";
// import updateStatus from "@salesforce/apex/Students.updateStatus";
import getStudentById from "@salesforce/apex/Student.getStudentById";
import getDeliveryById from "@salesforce/apex/Student.getDeliveryById";
import getExercisetById from "@salesforce/apex/Student.getExercisetById";
// import getActiveDeliveries from "@salesforce/apex/Students.getActiveDeliveries";

export default class Student extends LightningElement {
	loading = true;
	student = {};
	wiredStudent = null;
	@api studentId = null;

	delivery = {};
	wiredDelivery = null;
	@api deliveryId = null;

	exercise = {};
	exerciseId = null;
	wiredExercise = null;

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
		let { data, error } = result;
		if (data) {
			this.delivery = data;
			this.exerciseId = data.ActiveExercise__c;
		} else if (error) {
			this.delivery = {};
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
		}
	}

	onRegisterClick() {
		this.dispatchEvent(new CustomEvent("register"));
	}

	// get isButtonsDisabled() {
	// 	return !(this.selectedExerciseId !== "" && this.selectedStudentId !== "");
	// }
	// connectedCallback() {
	// 	this.selectedStudentId = this.getCookie("student");
	// 	setInterval(() => {
	// 		this.onRefreshClick();
	// 		this.doneLoading();
	// 	}, 1e3);
	// }
	// onDeliveryChange(event) {
	// 	this.selectedDeliverId = event.detail.value;
	// 	this.selectedExerciseId = this.mapDeliveries.get(this.selectedDeliverId).ActiveExercise__c;
	// }
	// onStudentChange(event) {
	// 	this.selectedStudentId = event.detail.value;
	// 	document.cookie = `student=${this.selectedStudentId}`;
	// }
	// // onRefreshClick() {
	// // 	this.loading = true;
	// // 	const promises = [refreshApex(this.wiredExercises), refreshApex(this.wiredStudents)];
	// // 	Promise.allSettled(promises)
	// // 		.then(() => {
	// // 			this.doneLoading();
	// // 		})
	// // 		.catch((error) => {
	// // 			this.doneLoading();
	// // 			console.log(error);
	// // 			Utils.showNotification(this, { title: "Error", message: "Error refreshing data", variant: Utils.variants.error });
	// // 		});
	// // }
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
	// getCookie(cname) {
	// 	let name = cname + "=";
	// 	let decodedCookie = decodeURIComponent(document.cookie);
	// 	let parts = decodedCookie.split(";");
	// 	for (let i = 0; i < parts.length; i++) {
	// 		let c = parts[i];
	// 		while (c.charAt(0) === " ") {
	// 			c = c.substring(1);
	// 		}
	// 		if (c.indexOf(name) === 0) {
	// 			return c.substring(name.length, c.length);
	// 		}
	// 	}
	// 	return "";
	// }

	//
}
