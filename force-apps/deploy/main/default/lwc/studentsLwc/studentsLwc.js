import Utils from "c/utils";
import { LightningElement, wire } from "lwc";
import { refreshApex } from "@salesforce/apex";
import getStudents from "@salesforce/apex/Students.getStudents";
import updateStatus from "@salesforce/apex/Students.updateStatus";
import getActiveExercises from "@salesforce/apex/Students.getActiveExercises";

export default class StudentsLwc extends LightningElement {
	students = [];
	exercises = [];
	wiredStudents = null;
	wiredExercises = null;
	selectedStudent = "";
	selectedExercise = "";
	loading = true;

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

	@wire(getActiveExercises)
	wired_GetActiveExercises(result) {
		this.wiredExercises = result;
		let { data, error } = result;
		if (data) {
			this.exercises = data.map((student) => ({
				value: student.Id,
				label: student.Name
			}));
			if (this.exercises.length > 0) {
				this.selectedExercise = this.exercises[0].value;
			}
			this.doneLoading();
		} else if (error) {
			Utils.showNotification(this, { title: "Error", message: "Error getting exercises", variant: Utils.variants.error });
			console.log(error);
			this.doneLoading();
		}
	}

	get isButtonsDisabled() {
		return !((this.selectedExercise !== "") && (this.selectedStudent !== ""));
	}

	connectedCallback() {
		this.selectedStudent = this.getCookie("student");
		setInterval(() => {
			this.onRefreshClick();
			this.doneLoading();
		}, 1e3);
	}

	onExerciseChange(event) {
		this.selectedExercise = event.detail.value;
	}

	onStudentChange(event) {
		this.selectedStudent = event.detail.value;
		document.cookie = `student=${this.selectedStudent}`;
	}

	onRefreshClick() {
		this.loading = true;
		const promises = [refreshApex(this.wiredExercises), refreshApex(this.wiredStudents)];
		Promise.allSettled(promises)
			.then(() => {
				this.doneLoading();
			})
			.catch((error) => {
				this.doneLoading();
				console.log(error);
				Utils.showNotification(this, { title: "Error", message: "Error refreshing data", variant: Utils.variants.error });
			});
	}

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
		updateStatus({ exerciseId: this.selectedExercise, studentId: this.selectedStudent, status })
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
