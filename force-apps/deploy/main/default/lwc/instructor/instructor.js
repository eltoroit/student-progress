import Utils from "c/utils";
import { LightningElement, wire } from "lwc";
import { refreshApex } from "@salesforce/apex";
import startStopExercise from "@salesforce/apex/Students.startStopExercise";
import getActiveCxDs from "@salesforce/apex/Students.getActiveCxDs";
import getAllExercisesForCxD from "@salesforce/apex/Students.getAllExercisesForCxD";
import getStudentsProgress from "@salesforce/apex/Students.getStudentsProgress";

const columns = [
	{ label: "Status", fieldName: "status", fixedWidth: 40 },
	{ label: "Name", fieldName: "name" }
];

export default class Instructor extends LightningElement {
	timers = { progress: null, screen: null };
	progress = [];
	loading = true;
	exercises = [];
	deliveries = [];
	columns = columns;
	wiredProgress = null;
	selectedCxD = null;
	selectedExercise = null;
	activeExerciseName = null;
	exerciseTimer = null;
	exerciseStart = null;

	get areButtonsDisabled() {
		return this.selectedExercise === null;
	}

	connectedCallback() {
		this.onRefreshClick();
	}

	@wire(getActiveCxDs)
	wired_GetActiveCxDs({ data, error }) {
		if (data) {
			this.loadCxDs(data);
			this.loading = false;
		} else if (error) {
			Utils.showNotification(this, { title: "Error (Instructor)", message: "Error getting deliveries", variant: Utils.variants.error });
			console.log(error);
			this.loading = false;
		}
	}

	@wire(getAllExercisesForCxD, { CxD: "$selectedCxD" })
	wired_GetAllExercisesForCxD({ data, error }) {
		if (data) {
			if (data.length > 0) {
				this.loadExercises(data);
				this.loading = false;
			}
		} else if (error) {
			Utils.showNotification(this, { title: "Error (Instructor)", message: "Error getting exercises", variant: Utils.variants.error });
			console.log(error);
			this.loading = false;
		}
	}

	@wire(getStudentsProgress, { CxD: "$selectedCxD", exerciseId: "$selectedExercise" })
	wired_GetStudentsProgress(result) {
		this.wiredProgress = result;
		let { data, error } = result;
		if (data) {
			this.progress = [];
			if (!data.TABLE) {
				return;
			}
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

			clearInterval(this.timers.screen);
			this.exerciseTimer = null;
			clearInterval(this.timers.screen);
			if (data.DELIVERY.length === 1) {
				this.exerciseStart = new Date(data.DELIVERY[0].ActivatedDTTM__c);
				this.timers.screen = setInterval(() => {
					this.exerciseTimer = Utils.calculateDuration({ startAt: this.exerciseStart, endAt: new Date() });
					this.exerciseTimer = this.exerciseTimer.seconds.toString();
				}, 5e2);
			}

			this.loading = false;
		} else if (error) {
			Utils.showNotification(this, { title: "Error (Instructor)", message: "Error getting progress", variant: Utils.variants.error });
			console.log(error);
			this.loading = false;
		}
	}

	onDeliveryChange(event) {
		this.selectedCxD = event.detail.value;
	}

	onExerciseChange(event) {
		this.selectedExercise = event.detail.value;
	}

	onNextClick() {
		let index = this.exercises.findIndex((exercise) => exercise.value === this.selectedExercise);
		this.selectedExercise = this.exercises[index + 1].value;
	}

	onRefreshClick() {
		clearInterval(this.timers.progress);
		if (this.wiredProgress) {
			this.timers.progress = setInterval(() => {
				refreshApex(this.wiredProgress);
			}, 1e3);
		}
	}

	onStartClick() {
		this.exerciseStateChange(true);
	}

	onStopClick() {
		this.exerciseStateChange(false);
	}

	exerciseStateChange(isStart) {
		startStopExercise({ CxD: this.selectedCxD, exerciseId: this.selectedExercise, isStart })
			.then((data) => {
				this.exerciseStart = data.ActivatedDTTM__c;
				this.activeExerciseName = data.ActiveExercise__r?.Name;
			})
			.catch((err) => {
				console.log(err);
				debugger;
			});
	}

	loadCxDs(data) {
		this.deliveries = data.map((CxD) => ({
			value: `${CxD.Course__c}|${CxD.Delivery__c}`,
			label: `${CxD.Delivery__r.Name} (${CxD.Course__r.Name})`
		}));
		if (data.length > 0) {
			this.selectedCxD = this.deliveries[0].value;
			this.selectedExercise = data[0].Delivery__r.ActiveExercise__c;
			this.activeExerciseName = data[0].Delivery__r.ActiveExercise__r.Name;
		}
	}

	loadExercises(data) {
		this.exercises = data.map((student) => ({
			value: student.Id,
			label: student.Name
		}));
	}
}
