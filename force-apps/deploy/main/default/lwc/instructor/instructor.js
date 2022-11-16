import Utils from "c/utils";
import { LightningElement, wire } from "lwc";
import { refreshApex } from "@salesforce/apex";
import getAllExercises from "@salesforce/apex/Students.getAllExercises";
import activateExercise from "@salesforce/apex/Students.activateExercise";
import getStudentsProgress from "@salesforce/apex/Students.getStudentsProgress";

const columns = [
	{ label: "Status", fieldName: "status", fixedWidth: 40 },
	{ label: "Name", fieldName: "name" }
];

export default class Instructor extends LightningElement {
	timers = { progress: null, screen: null };
	progress = [];
	exercises = [];
	loading = true;
	columns = columns;
	wiredProgress = null;
	selectedExercise = null;
	activeExerciseName = null;
	exerciseEnd = null;
	exerciseTimer = null;
	exerciseStart = null;

	@wire(getAllExercises)
	wired_GetAllExercises({ data, error }) {
		if (data) {
			this.loadExercises(data);
			this.loading = false;
		} else if (error) {
			Utils.showNotification(this, { title: "Error (Instructor)", message: "Error getting exercises", variant: Utils.variants.error });
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
				if (student.Exercises_X_Students__r?.length > 0) {
					const status = student.Exercises_X_Students__r[0]?.Status__c;
					switch (status) {
						case "DONE": {
							row.status = "✅";
							break;
						}
						case "WORKING": {
							row.status = "👩‍💻";
							break;
						}
						case "LATER": {
							row.status = "🕒";
							break;
						}

						default:
							break;
					}
				}
				return row;
			});
			if (data.EXERCISES.length === 1) {
				const exercise = data.EXERCISES[0];
				this.exerciseStart = new Date(exercise.Start__c);
				this.exerciseEnd = new Date(exercise.End__c);
				clearInterval(this.timers.screen);
				this.timers.screen = setInterval(() => {
					if (exercise.IsActive__c) {
						this.exerciseTimer = Utils.calculateDuration({ startAt: exercise.Start__c, endAt: new Date() });
					} else {
						this.exerciseTimer = Utils.calculateDuration({ startAt: exercise.Start__c, endAt: exercise.End__c });
					}
					this.exerciseTimer = this.exerciseTimer.seconds.toString();
				}, 5e2);
			} else if (this.selectedExercise) {
				Utils.showNotification(this, {
					title: "Error (Instructor)",
					message: "Error getting exercise when fetching progress",
					variant: Utils.variants.error
				});
			}
			this.loading = false;
		} else if (error) {
			Utils.showNotification(this, { title: "Error (Instructor)", message: "Error getting progress", variant: Utils.variants.error });
			console.log(error);
			this.loading = false;
		}
	}

	onRestartTimerClick() {
		this.activateExerciseJS(this.selectedExercise);
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
		this.onRefreshClick();
	}

	onRefreshClick() {
		clearInterval(this.timers.progress);
		this.timers.progress = setInterval(() => {
			refreshApex(this.wiredProgress);
		}, 1e3);
	}

	loadExercises(data) {
		this.exercises = data.map((student) => ({
			value: student.Id,
			label: student.Name
		}));
		let activeExercises = data.filter((exercise) => exercise.IsActive__c);
		if (activeExercises.length < 1) {
			Utils.showNotification(this, { title: "Error (Instructor)", message: "Not active exercises found", variant: Utils.variants.error });
		} else if (activeExercises.length > 1) {
			Utils.showNotification(this, { title: "Error (Instructor)", message: "Multiple active exercises found", variant: Utils.variants.error });
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
				Utils.showNotification(this, { title: "Success", message: `Exercise marked as active: ${activeExercise.Name}` });
			})
			.catch((error) => {
				Utils.showNotification(this, { title: "Error (Instructor)", message: "Error activating exercises", variant: Utils.variants.error });
				console.log(error);
			});
	}
}
