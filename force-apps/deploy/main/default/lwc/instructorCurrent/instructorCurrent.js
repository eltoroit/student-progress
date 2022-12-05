import Utils from "c/utils";
import { LightningElement, wire } from "lwc";
import { refreshApex } from "@salesforce/apex";
import getActiveCxDs from "@salesforce/apex/Instructor.getActiveCxDs";
import getAllExercisesForCxD from "@salesforce/apex/Instructor.getAllExercisesForCxD";
import getStudentsProgress from "@salesforce/apex/Instructor.getStudentsProgress";
import startStopExercise from "@salesforce/apex/Instructor.startStopExercise";

const columns = [
	{ label: "Status", fieldName: "status", fixedWidth: 40 },
	{ label: "Name", fieldName: "name" }
];

export default class InstructorCurrent extends LightningElement {
	// Control
	loading = true;
	exerciseTimer = null;
	exerciseStart = null;
	timers = { progress: null, screen: null };

	// Lists
	exercises = [];
	deliveries = [];
	activeExercise = {};

	wiredActiveCxDs = null;
	wiredStudentsProgress = null;
	wiredAllExercisesForCxD = null;

	_selectedExerciseId = "";
	_selectedCourseDeliveryId = "";

	// Table
	progress = [];
	columns = columns;

	get selectedExerciseId() {
		let output = "";
		if (this._selectedExerciseId) {
			output = this._selectedExerciseId;
		}
		return output;
	}
	set selectedExerciseId(value) {
		if (!value) value = "";
		this._selectedExerciseId = value;
	}
	get selectedCourseDeliveryId() {
		let output = "";
		if (this._selectedCourseDeliveryId) {
			output = this._selectedCourseDeliveryId;
		}
		return output;
	}
	set selectedCourseDeliveryId(value) {
		if (!value) value = "";
		this._selectedCourseDeliveryId = value;
	}

	get ui() {
		const exActive = this.activeExercise.Id;
		const exSelected = this.selectedExerciseId;
		const isCxD = this.selectedCourseDeliveryId;
		const exercises = {
			max: this.exercises.length - 1,
			selected: this.exercises.findIndex((option) => option.value === this.selectedExerciseId),
			active: this.exercises.findIndex((option) => option.value === this.activeExercise.Id)
		};

		const ui = {};
		ui.btnCurrent = {
			isVisible: isCxD,
			isDisabled: !isCxD || exActive === exSelected
		};
		ui.btnNext = {
			isVisible: isCxD,
			isDisabled: !exSelected || exActive || exercises.selected === exercises.max
		};
		ui.btnStart = {
			isVisible: isCxD,
			isDisabled: !exSelected || exActive
		};
		ui.btnStop = {
			isVisible: isCxD,
			isDisabled: !exSelected || !exActive || exActive !== exSelected
		};
		ui.btnRefresh = {
			isVisible: true,
			isDisabled: false
		};

		ui.pnlDeliveriesSelector = true;
		ui.pnlExercisesSelector = isCxD;
		ui.pnlActiveExerciseData = exActive;
		ui.pnlStudents = exSelected;

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
	wired_GetActiveCxDs(result) {
		this.wiredActiveCxDs = result;
		let { data, error } = result;
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
	wired_GetAllExercisesForCxD(result) {
		this.wiredAllExercisesForCxD = result;
		let { data, error } = result;
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
		this.wiredStudentsProgress = result;
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

			// This timer is to update the clock, not to get the data
			clearInterval(this.timers.screen);
			this.timers.screen = null;
			this.exerciseTimer = null;
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
		// This clock is to get the data
		clearInterval(this.timers.progress);
		this.timers.progress = setInterval(async () => {
			await refreshApex(this.wiredActiveCxDs);
			await refreshApex(this.wiredAllExercisesForCxD);
			await refreshApex(this.wiredStudentsProgress);
		}, 1e3);
	}

	onStartClick() {
		this.exerciseStateChange(true);
	}

	onStopClick() {
		this.exerciseStateChange(false);
	}

	exerciseStateChange(isStart) {
		this.loading = true;
		setTimeout(() => {
			startStopExercise({ CxD: this.selectedCourseDeliveryId, exerciseId: this.selectedExerciseId, isStart })
				.then((data) => {
					this.exerciseStart = data.ActivatedDTTM__c;

					let ae = data.ActiveExercise__r;
					this.activeExercise = ae ? ae : {};
					this.loading = false;
				})
				.catch((err) => {
					this.loading = false;
					console.log(err);
					debugger;
				});
		}, 0);
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

			if (data[0].Delivery__r.ActiveExercise__c) {
				this.selectedExerciseId = data[0].Delivery__r.ActiveExercise__c;
				let ae = data[0].Delivery__r.ActiveExercise__r;
				this.activeExercise = ae ? ae : {};
			} else {
				if (!this.selectedExerciseId) {
					this.selectedExerciseId = data[0].Delivery__r.ActiveExercise__c;
				}

				if (!this.activeExercise.Id) {
					let ae = data[0].Delivery__r.ActiveExercise__r;
					this.activeExercise = ae ? ae : {};
				}
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
