import Utils from "c/utils";
import { LightningElement, wire } from "lwc";
import { refreshApex } from "@salesforce/apex";
import getAllExercises from "@salesforce/apex/Students.getAllExercises";
import activateExercise from "@salesforce/apex/Students.activateExercise";
import getStudentsProgress from "@salesforce/apex/Students.getStudentsProgress";

const columns = [
	{ label: "Name", fieldName: "name" },
	{ label: "Status", fieldName: "status" }
];

export default class Instructor extends LightningElement {
	timer = null;
	progress = [];
	exercises = [];
	loading = true;
	columns = columns;
	wiredProgress = null;
	selectedExercise = null;
	activeExerciseName = "";
	exerciseTimer = "";

	@wire(getAllExercises)
	wired_GetAllExercises({ data, error }) {
		if (data) {
			this.loadExercises(data);
			this.loading = false;
		} else if (error) {
			Utils.showNotification(this, { title: "Error", message: "Error getting exercises", variant: Utils.variants.error });
			console.log(error);
			this.loading = false;
		}
	}

	@wire(getStudentsProgress, { exerciseId: "$selectedExercise" })
	wired_GetStudentsProgress(result) {
		this.wiredProgress = result;
		let { data, error } = result;
		if (data) {
			this.progress = [];
			this.progress = data.TABLE.map((student) => {
				const row = {
					name: student.Name,
					status: ""
				};
				if (student.Exercises_X_Students__r) {
					row.status = "✅";
				}
				return row;
			});
			this.loading = false;
		} else if (error) {
			Utils.showNotification(this, { title: "Error", message: "Error getting progress", variant: Utils.variants.error });
			console.log(error);
			this.loading = false;
		}
	}

	onExerciseChange(event) {
		this.selectedExercise = event.detail.value;
	}

	onActivateNext() {
		let index = this.exercises.findIndex((exercise) => exercise.value === this.selectedExercise);
		this.activateExerciseJS(this.exercises[index + 1].value);
	}

	onActivateClick() {
		this.activateExerciseJS(this.selectedExercise);
	}

	connectedCallback() {
		// eslint-disable-next-line @lwc/lwc/no-async-operation
		this.timer = setInterval(() => {
			this.onRefreshClick();
		}, 5e3);
	}

	onRefreshClick() {
		this.loading = true;
		refreshApex(this.wiredProgress);
	}

	loadExercises(data) {
		this.exercises = data.map((student) => ({
			value: student.Id,
			label: student.Name
		}));
		let activeExercises = data.filter((exercise) => exercise.IsActive__c);
		if (activeExercises.length < 1) {
			Utils.showNotification(this, { title: "Error", message: "Not active exercises found", variant: Utils.variants.error });
		} else if (activeExercises.length > 1) {
			Utils.showNotification(this, { title: "Error", message: "Multiple active exercises found", variant: Utils.variants.error });
		}
		if (activeExercises.length > 0) {
			this.activeExerciseName = activeExercises[0].Name;
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
			});
	}
}
