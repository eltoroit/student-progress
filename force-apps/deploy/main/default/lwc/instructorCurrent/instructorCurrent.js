import Utils from "c/utils";
import { LightningElement, wire } from "lwc";
import { refreshApex } from "@salesforce/apex";
import getActiveCxDs from "@salesforce/apex/Instructor.getActiveCxDs";
import startStopExercise from "@salesforce/apex/Instructor.startStopExercise";
import updateStudentStatus from "@salesforce/apex/Instructor.updateStudentStatus";
import getStudentsProgress from "@salesforce/apex/Instructor.getStudentsProgress";
import getAllExercisesForCxD from "@salesforce/apex/Instructor.getAllExercisesForCxD";

const actions = [
	{ label: "I'm done", name: "Status|DONE" },
	{ label: "I'm working", name: "Status|WORKING" },
	{ label: "I'll finish later", name: "Status|LATER" }
];

const columns = [
	{ label: "Status", fieldName: "status", fixedWidth: 40 },
	{ label: "Name", fieldName: "name" },
	{
		type: "action",
		typeAttributes: { rowActions: actions }
	}
];

export default class InstructorCurrent extends LightningElement {
	// Control
	loading = true;
	errorMessage = "";
	activeExerciseTimer = null;
	activeExerciseStartAt = null;
	timers = { progress: null, screen: null };

	// Lists
	exercises = [];
	deliveries = [];
	activeExercise = {}; // The exercise the students are working on
	currentExercise = {}; // The exercise currently being selected (displayed)
	currentCourseDelivery = {}; // The CxD being selected
	currentCourseDeliveryKey = "";

	wiredActiveCxDs = null;
	wiredStudentsProgress = null;
	wiredAllExercisesForCxD = null;

	// Table
	progress = [];
	columns = columns;

	get ui() {
		const exCurrent = this.currentExercise;
		const currentCxD = this.currentCourseDeliveryKey;
		const exIsActive = this.activeExercise?.Id === this.currentExercise?.Id;
		const exercises = {
			max: this.exercises.length - 1,
			activeIdx: this.exercises.findIndex((option) => option.value === this.activeExercise?.Id),
			currentIdx: this.exercises.findIndex((option) => option.value === exCurrent.Id)
		};

		const ui = {};
		ui.btnCurrent = {
			isVisible: currentCxD,
			isDisabled: !currentCxD || exIsActive
		};
		ui.btnNext = {
			isVisible: currentCxD,
			isDisabled: !exCurrent.Id || exIsActive || exercises.currentIdx === exercises.max
		};
		ui.btnStart = {
			isVisible: currentCxD,
			isDisabled: !exCurrent.Id || exIsActive
		};
		ui.btnStop = {
			isVisible: currentCxD,
			isDisabled: !exCurrent.Id || !exIsActive
		};
		ui.btnRefresh = {
			isVisible: true,
			isDisabled: false
		};

		ui.pnlDeliveriesSelector = true;
		ui.pnlExercisesSelector = currentCxD;
		ui.pnlActiveExerciseData = exIsActive;
		ui.pnlStudents = exCurrent.Id;

		return ui;
	}

	get currentExerciseId() {
		return this.currentExercise?.Id ? this.currentExercise.Id : "";
	}

	connectedCallback() {
		// debugger;
		console.log("*** *** *** Connected Callback (read cookies)");

		let Id = Utils.getCookie({ key: "currentExerciseId" });
		if (Id) {
			this.currentExercise = { Id };
		}

		let key = Utils.getCookie({ key: "currentCourseDeliveryKey" });
		if (key) {
			this.currentCourseDeliveryKey = key;
			this.dispatchEvent(new CustomEvent("change", { detail: { CxD: this.currentCourseDeliveryKey } }));
		}
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

	@wire(getAllExercisesForCxD, { CxD: "$currentCourseDeliveryKey" })
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

	@wire(getStudentsProgress, { CxD: "$currentCourseDeliveryKey", exerciseId: "$currentExerciseId" })
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
					studentId: student.Id,
					name: student.Name,
					status: ""
				};
				if (student.IsInstructor__c) {
					row.name += ` 🧑‍🏫`;
				}
				if (student.Exercises_X_Students__r?.length > 0) {
					const rowData = student.Exercises_X_Students__r[0];
					row.exsId = rowData?.Id;
					row.status = Utils.getEmoji({ status: rowData?.Status__c });
				}
				return row;
			});

			// This timer is to update the clock, not to get the data
			clearInterval(this.timers.screen);
			this.timers.screen = null;
			this.activeExerciseTimer = null;
			if (data.DELIVERY) {
				const startAt = new Date(data.DELIVERY.CurrentExerciseStart__c);
				this.activeExerciseStartAt = startAt;
				this.timers.screen = setInterval(() => {
					try {
						this.activeExerciseTimer = Utils.calculateDuration({ startAt, endAt: new Date() });
						this.activeExerciseTimer = this.activeExerciseTimer.seconds.toString();
					} catch (ex) {
						Utils.showNotification(this, {
							title: "Error (Instructor)",
							message: "Error updating timer",
							variant: Utils.variants.error
						});
						console.log(error);
					}
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

	onCourseDeliveryChange(event) {
		const key = event.target.value;
		this.currentCourseDeliveryKey = key;
		const option = this.deliveries.find((CxD) => CxD.value === key);
		this.currentCourseDelivery = option.CxD;
		Utils.setCookie({ key: "currentCourseDeliveryKey", value: this.currentCourseDeliveryKey });
		this.dispatchEvent(new CustomEvent("change", { detail: { CxD: this.currentCourseDeliveryKey } }));
	}

	onExerciseChange(event) {
		const Id = event.target.value;
		const option = this.exercises.find((exercise) => exercise.value === Id);
		this.currentExercise = option.exercise;
		Utils.setCookie({ key: "currentExerciseId", value: this.currentExercise.Id });
	}

	onNextClick() {
		const index = this.exercises.findIndex((exercise) => exercise.value === this.currentExercise.Id);
		const record = this.exercises[index + 1];
		this.currentExercise = {
			Id: record.value,
			Name: record.label
		};
	}

	onCurrentClick() {
		const index = this.exercises.findIndex((exercise) => exercise.value === this.activeExercise.Id);
		const record = this.exercises[index];
		this.currentExercise = {
			Id: record.value,
			Name: record.label
		};
	}

	async onRefreshClick() {
		// This clock is to get the data
		clearInterval(this.timers.progress);
		this.timers.progress = setInterval(async () => {
			try {
				await refreshApex(this.wiredActiveCxDs);
				await refreshApex(this.wiredAllExercisesForCxD);
				await refreshApex(this.wiredStudentsProgress);
				this.errorMessage = "";
			} catch (error) {
				this.errorMessage = `Error refreshing data. ${error.statusText} ${error.body.message}`;
			}
		}, 1e3);
	}

	onRowAction(event) {
		const row = event.detail.row;
		const actionName = event.detail.action.name;
		const actionNameParts = actionName.split("|");
		const actionNameCommand = actionNameParts[0];
		const actionValue = actionNameParts[1];

		switch (actionNameCommand) {
			case "Status":
				updateStudentStatus({
					ExS: row.exsId,
					studentId: row.studentId,
					exerciseId: this.currentExerciseId,
					status: actionValue
				})
					.then(() => {})
					.catch((error) => {
						console.log(error);
						debugger;
					});
				break;
			default: {
				debugger;
			}
		}
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
			startStopExercise({ CxD: this.currentCourseDeliveryKey, exerciseId: this.currentExercise.Id, isStart })
				.then((data) => {
					if (data.CurrentExerciseIsActive__c) {
						this.activeExercise = data.CurrentExercise__r;
					} else {
						this.activeExercise = {};
					}
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
			CxD,
			value: `${CxD.Course__c}|${CxD.Delivery__c}`,
			label: `${CxD.Delivery__r.Name} (${CxD.Course__r.Name})`
		}));
		this.deliveries.unshift({ value: "", label: "Which class are you delivering?" });
		if (data.length > 0) {
			const option = this.deliveries.find((CxD) => CxD.value === this.currentCourseDeliveryKey);
			this.currentCourseDelivery = option.CxD;
			this.currentCourseDeliveryKey = null;
			setTimeout(() => {
				// Preselect the current active exercise, put a timeout in case the exercises load before the CxD
				this.currentCourseDeliveryKey = option.value;
				this.activeExercise = this.currentCourseDelivery?.Delivery__r?.CurrentExercise__r;
				this.currentExercise = this.activeExercise;
			}, 5e2);
		}
	}

	loadExercises(data) {
		this.exercises = data.map((exercise) => {
			let expectedDuration = exercise.ExpectedDuration__c ? ` (${exercise.ExpectedDuration__c})` : "";
			return {
				exercise,
				value: exercise.Id,
				label: `${exercise.Name} ${expectedDuration}`
			};
		});
		if (data.length > 0) {
			this.activeExercise = data.find((exercise) => exercise.Id === this.activeExercise.Id);
			this.currentExercise = data.find((exercise) => exercise.Id === this.currentExercise.Id);
		}
		this.exercises.unshift({ value: "", label: "Which exercise are you working on?" });
	}
}
