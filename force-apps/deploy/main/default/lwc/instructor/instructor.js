import { LightningElement, wire } from "lwc";
import getAllExercises from "@salesforce/apex/Students.getAllExercises";

export default class Instructor extends LightningElement {
	exercises = [];
	selectedExercise = null;

	@wire(getAllExercises)
	wired_GetActiveExercises({ data, error }) {
		if (data) {
			this.exercises = data.map((student) => ({
				value: student.Id,
				label: student.Name
			}));
            let activeExercises = this.exercises.filter(exercise => exercise.IsActive__c);
			if (activeExercises.length > 0) {
				this.selectedExercise = activeExercises[0].value;
			}
		} else if (error) {
			console.log(error);
			alert("Error getting exercises"); // eslint-disable-line no-alert
			debugger;
		}
	}
}
