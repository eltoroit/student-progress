import Utils from "c/utils";
import { LightningElement, wire } from "lwc";
import { refreshApex } from "@salesforce/apex";
import getStudents from "@salesforce/apex/Students.getStudents";
import updateStatus from "@salesforce/apex/Students.updateStatus";
import getActiveExercise from "@salesforce/apex/Students.getActiveExercise";
import getActiveDeliveries from "@salesforce/apex/Students.getActiveDeliveries";

export default class StudentsLwc extends LightningElement {
	students = [];
	exercises = [];
	deliveries = [];
	mapDeliveries = {};

	wiredStudents = null;
	wiredExercises = null;
	wiredDeliveries = null;

	selectedStudentId = "";
	selectedExerciseId = "";
	selectedDeliveryId = "";
	selectedExerciseName = "";

	loading = true;

	@wire(getActiveDeliveries)
	wired_GetActiveDeliveries(result) {
		this.wiredDeliveries = result;
		let { data, error } = result;
		if (data) {
			this.deliveries = [];
			this.mapDeliveries = new Map();
			data.forEach((delivery) => {
				this.deliveries.push({
					value: delivery.Id,
					label: delivery.Name
				});
				this.mapDeliveries.set(delivery.Id, delivery);
			});
			this.deliveries.unshift({ value: "", label: "Which class are you attending?" });
			this.doneLoading();
		} else if (error) {
			Utils.showNotification(this, { title: "Error", message: "Error getting deliveries", variant: Utils.variants.error });
			console.log(error);
			this.doneLoading();
		}
	}

	@wire(getStudents)
	wired_GetStudents(result) {
		this.wiredStudents = result;
		let { data, error } = result;
		if (data) {
			this.students = data.map((student) => ({
				value: student.Id,
				label: student.Name
			}));
			this.students.unshift({ value: "", label: "Who are you?" });
			this.doneLoading();
		} else if (error) {
			Utils.showNotification(this, { title: "Error", message: "Error getting students", variant: Utils.variants.error });
			console.log(error);
			this.doneLoading();
		}
	}

	@wire(getActiveExercise, { exerciseId: "$selectedExerciseId" })
	wired_GetActiveExercise(result) {
		let { data, error } = result;
		if (data) {
			this.selectedExerciseName = data?.Name;
			this.doneLoading();
		} else if (error) {
			Utils.showNotification(this, { title: "Error", message: "Error getting exercise", variant: Utils.variants.error });
			console.log(error);
			this.doneLoading();
		}
	}

	get isButtonsDisabled() {
		return !(this.selectedExerciseId !== "" && this.selectedStudentId !== "");
	}

	connectedCallback() {
		this.selectedStudentId = this.getCookie("student");
		setInterval(() => {
			this.onRefreshClick();
			this.doneLoading();
		}, 1e3);
	}

	onDeliveryChange(event) {
		this.selectedDeliverId = event.detail.value;
		this.selectedExerciseId = this.mapDeliveries.get(this.selectedDeliverId).ActiveExercise__c;
	}

	onStudentChange(event) {
		this.selectedStudentId = event.detail.value;
		document.cookie = `student=${this.selectedStudentId}`;
	}

	// onRefreshClick() {
	// 	this.loading = true;
	// 	const promises = [refreshApex(this.wiredExercises), refreshApex(this.wiredStudents)];
	// 	Promise.allSettled(promises)
	// 		.then(() => {
	// 			this.doneLoading();
	// 		})
	// 		.catch((error) => {
	// 			this.doneLoading();
	// 			console.log(error);
	// 			Utils.showNotification(this, { title: "Error", message: "Error refreshing data", variant: Utils.variants.error });
	// 		});
	// }

	onDoneClick() {
		this.updateStatus("DONE");
	}

	onWorkingClick() {
		this.updateStatus("WORKING");
	}

	onLaterClick() {
		this.updateStatus("LATER");
	}

	updateStatus(status) {
		this.loading = true;
		updateStatus({ exerciseId: this.selectedExerciseId, studentId: this.selectedStudentId, status })
			.then(() => {
				Utils.showNotification(this, { title: "Success", message: "Thanks for completing the exercise" });
				this.doneLoading();
			})
			.catch((error) => {
				this.doneLoading();
				console.log(error);
				Utils.showNotification(this, { title: "Error", message: "Error marking as done", variant: Utils.variants.error });
			});
	}

	getCookie(cname) {
		let name = cname + "=";
		let decodedCookie = decodeURIComponent(document.cookie);
		let parts = decodedCookie.split(";");
		for (let i = 0; i < parts.length; i++) {
			let c = parts[i];
			while (c.charAt(0) === " ") {
				c = c.substring(1);
			}
			if (c.indexOf(name) === 0) {
				return c.substring(name.length, c.length);
			}
		}
		return "";
	}

	doneLoading() {
		// setTimeout(() => {
		this.loading = false;
		// }, 1e3);
	}
}
