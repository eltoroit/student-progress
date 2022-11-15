import { LightningElement, wire } from "lwc";
import Utils from "c/utils";
import getStudents from "@salesforce/apex/Students.getStudents";
import getActiveExercises from "@salesforce/apex/Students.getActiveExercises";

export default class StudentsLwc extends LightningElement {
	students = [];
	exercises = [];
	selectedStudent = null;
	selectedExercise = null;
	
	@wire(getStudents)
	wired_GetStudents({ data, error }) {
		if (data) {
			this.students = data.map((student) => ({
				value: student.Id,
				label: student.Name
			}));
		} else if (error) {
			Utils.showNotification(this, { title: "Error", message: "Error getting students", variant: Utils.variants.error });
			console.log(error);
			debugger;
		}
	}

    @wire(getActiveExercises)
	wired_GetActiveExercises({ data, error }) {
		if (data) {
			this.exercises = data.map((student) => ({
				value: student.Id,
				label: student.Name
			}));
            if (this.exercises.length > 0) {
                this.selectedExercise = this.exercises[0].value;
            }
		} else if (error) {
			Utils.showNotification(this, { title: "Error", message: "Error getting exercises", variant: Utils.variants.error });
			console.log(error);
			debugger;
		}
	}

	connectedCallback() {
		this.selectedStudent = this.getCookie("student");
	}

	onExerciseChange(event) {
        this.selectedExercise = event.detail.value;
    }

	onStudentChange(event) {
		this.selectedStudent = event.detail.value;
		document.cookie = `student=${this.selectedStudent}`;
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
}
