import { LightningElement, wire } from "lwc";
import Utils from "c/utils";
import getAllExercises from "@salesforce/apex/Students.getAllExercises";
import activateExercise from "@salesforce/apex/Students.activateExercise";

export default class Instructor extends LightningElement {
	exercises = [];
	selectedExercise = null;

	@wire(getAllExercises)
	wired_GetActiveExercises({ data, error }) {
		if (data) {
			this.loadExercises(data);
		} else if (error) {
			Utils.showNotification(this, { title: "Error", message: "Error getting exercises", variant: Utils.variants.error });
			console.log(error);
			debugger;
		}
	}

	handleExerciseChange(event) {
		this.selectedExercise = event.detail.value;
	}

	onActivateNext() {
		let index = this.exercises.findIndex(exercise => exercise.value === this.selectedExercise);
		alert(index);
		this.activateExerciseJS(this.exercises[index+1].value);

	}

	onActivateClick() {
		this.activateExerciseJS(this.selectedExercise);
	}

	loadExercises(data) {
		this.exercises = data.map((student) => ({
			value: student.Id,
			label: student.Name
		}));
		let activeExercises = data.filter((exercise) => exercise.IsActive__c);
		if (activeExercises.length > 0) {
			this.selectedExercise = activeExercises[0].Id;
		}
	}

	activateExerciseJS(Id) {
		activateExercise({ Id })
		.then((data) => {
			this.loadExercises(data);
			const activeExercise = data.filter((exercise) => exercise.IsActive__c)[0];
			Utils.showNotification(this, { title: "Exercise marked as active", message: activeExercise.Name });
		})
		.catch((error) => {
			Utils.showNotification(this, { title: "Error", message: "Error activating exercises", variant: Utils.variants.error });
			console.log(error);
			debugger;
		});
	}
}
