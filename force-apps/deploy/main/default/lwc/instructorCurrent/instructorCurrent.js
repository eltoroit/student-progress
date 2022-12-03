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

export default class InstructorCurrent extends LightningElement {
	// Control
	loading = true;
	wiredProgress = null;
	exerciseTimer = null;
	exerciseStart = null;
	timers = { progress: null, screen: null };

	// Lists
	exercises = [];
	deliveries = [];
	activeExercise = {};
	selectedExerciseId = "";
	selectedCourseDeliveryId = "";

	// Table
	progress = [];
	columns = columns;

	get ui() {
		const ui = {};
		ui.btnCurrent = {
			isVisible: true,
			isDisabled: true
		};
		ui.btnNext = {
			isVisible: true,
			isDisabled: true
		};
		ui.start = {
			isVisible: true,
			isDisabled: true
		};
		ui.btnStop = {
			isVisible: true,
			isDisabled: true
		};
		ui.btnRefresh = {
			isVisible: true,
			isDisabled: true
		};

		ui.pnlDeliveriesSelector = true;
		ui.pnlExercisesSelector = this.selectedCourseDeliveryId;
		ui.pnlActiveExerciseData = this.activeExercise.Id;
		ui.pnlStudents = this.activeExercise.Id;

		return ui;
	}

	connectedCallback() {
		// debugger;
		console.log("*** *** *** Connected Callback");
		this.selectedExerciseId = Utils.getCookie({ key: "selectedExerciseId" });
		this.selectedCourseDeliveryId = Utils.getCookie({ key: "selectedCourseDeliveryId" });
		this.onRefreshClick();
	}

	@wire(getActiveCxDs)
	wired_GetActiveCxDs({ data, error }) {
		if (data) {
			this.loadCxDs(data);
			this.loading = false;
		} else if (error) {
			Utils.showNotification(this, {
				title: "Error (Instructor)",
				message: "Error getting deliveries",
				variant: Utils.variants.error
			});
			console.log(error);
			this.loading = false;
		}
	}

	@wire(getAllExercisesForCxD, { CxD: "$selectedCourseDeliveryId" })
	wired_GetAllExercisesForCxD({ data, error }) {
		if (data) {
			if (data.length > 0) {
				this.loadExercises(data);
				this.loading = false;
			}
		} else if (error) {
			Utils.showNotification(this, {
				title: "Error (Instructor)",
				message: "Error getting exercises",
				variant: Utils.variants.error
			});
			console.log(error);
			this.loading = false;
		}
	}

	@wire(getStudentsProgress, { CxD: "$selectedCourseDeliveryId", exerciseId: "$selectedExerciseId" })
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
			Utils.showNotification(this, {
				title: "Error (Instructor)",
				message: "Error getting progress",
				variant: Utils.variants.error
			});
			console.log(error);
			this.loading = false;
		}
	}

	onDeliveryChange(event) {
		this.selectedCourseDeliveryId = event.detail.value;
		Utils.setCookie({ key: "selectedCourseDeliveryId", value: this.selectedCourseDeliveryId });
	}

	onExerciseChange(event) {
		this.selectedExerciseId = event.detail.value;
		Utils.setCookie({ key: "selectedExerciseId", value: this.selectedExerciseId });
	}

	onNextClick() {
		let index = this.exercises.findIndex((exercise) => exercise.value === this.selectedExerciseId);
		this.selectedExerciseId = this.exercises[index + 1].value;
	}

	onCurrentClick() {
		this.selectedExerciseId = this.activeExercise.Id;
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
		startStopExercise({ CxD: this.selectedCourseDeliveryId, exerciseId: this.selectedExerciseId, isStart })
			.then((data) => {
				this.exerciseStart = data.ActivatedDTTM__c;

				let ae = data.ActiveExercise__r;
				this.activeExercise = ae ? ae : {};
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
		this.deliveries.unshift({ value: "", label: "Which class are you delivering?" });
		if (data.length > 0) {
			if (!this.selectedCourseDeliveryId) {
				this.selectedCourseDeliveryId = this.deliveries[0].value;
			}

			if (!this.selectedExerciseId) {
				this.selectedExerciseId = data[0].Delivery__r.ActiveExercise__c;
			}

			if (!this.activeExercise.Id) {
				let ae = data[0].Delivery__r.ActiveExercise__r;
				this.activeExercise = ae ? ae : {};
			}
		}
	}

	loadExercises(data) {
		this.exercises = data.map((student) => ({
			value: student.Id,
			label: student.Name
		}));
		this.exercises.unshift({ value: "", label: "Which exercise are you working on?" });
	}
}
