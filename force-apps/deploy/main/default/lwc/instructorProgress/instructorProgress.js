// Chart - Review this...
// https://salesforcelabs.github.io/LightningWebChartJS/docs/api/chart.html

import Utils from "c/utils";
// import { refreshApex } from "@salesforce/apex";
import { api, LightningElement, wire } from "lwc";
import chartjs from "@salesforce/resourceUrl/Chartjs";
import { loadScript } from "lightning/platformResourceLoader";
import getClassReport from "@salesforce/apex/Instructor.getClassReport";

export default class ClassProgress extends LightningElement {
	@api selectedCourseDeliveryId = "";

	students = [];
	exercises = [];
	loading = false;
	tableAllData = [];
	wiredGetClassReport = null;

	_ctxChart = null;
	_chartjsInitialized = false;

	@wire(getClassReport, { CxD: "$selectedCourseDeliveryId" })
	wired_getClassReport(result) {
		this.wiredGetClassReport = result;
		let { data, error } = result;
		if (data) {
			const mapStudents = {};
			this.exercises = data.EXERCISES.map((ex) => ({ Id: ex.Id, Name: ex.Name }));
			this.students = data.STUDENTS.map((student) => {
				const output = {
					Id: student.Id,
					Name: student.Name,
					IsInstructor: student.IsInstructor__c,
					Points: 0,
					mExS: {}
				};
				mapStudents[student.Id] = output;
				return output;
			});
			// Calculate points
			data.EXERCISES.forEach((ex) => {
				let points = this.students.length;
				ex.Exercises_X_Students__r.forEach((ExS, index) => {
					const newExS = {
						ExerciseId: ExS.Exercise__c,
						StudentId: ExS.Student__c,
						Points: 0,
						Ranking: 0,
						Status: ExS.Status__c,
						DTTM: new Date(ExS.LastModifiedDate)
					};
					if (ExS.Status__c === "DONE") {
						newExS.Ranking = index + 1;
						newExS.Points = points--;
					}
					const student = mapStudents[ExS.Student__c];
					student.Points += newExS.Points;
					student.mExS[ExS.Exercise__c] = newExS;
				});
			});
			// Build the output data
			this.tableAllData = this.students.map((student) => {
				const output = {
					StudentId: student.Id,
					Name: student.Name,
					Points: student.Points,
					IsInstructor: student.IsInstructor
				};
				this.exercises.forEach((ex, index) => {
					const ExS = student.mExS[ex.Id];
					const paddedIndex = `${index}`.padStart(3, "0");
					if (ExS) {
						output[`EX_${paddedIndex}_Ranking`] = ExS.Ranking;
						output[`EX_${paddedIndex}_Points`] = ExS.Points;
						output[`EX_${paddedIndex}_Status`] = ExS.Status;
					} else {
						output[`EX_${paddedIndex}_Ranking`] = 0;
						output[`EX_${paddedIndex}_Points`] = 0;
						output[`EX_${paddedIndex}_Status`] = "?";
					}
				});
				return output;
			});
			// Only the students
			this.tableAllData = this.tableAllData.filter((row) => !row.IsInstructor);
			this.makeChart();
			this.loading = false;
		} else if (error) {
			Utils.showNotification(this, {
				title: "Error (Instructor)",
				message: "Error getting class report",
				variant: Utils.variants.error
			});
			console.log(error);
			this.loading = false;
		}
	}

	renderedCallback() {
		if (this._chartjsInitialized) {
			return;
		}
		this._chartjsInitialized = true;
		loadScript(this, chartjs)
			.then((...data) => {
				console.log(data);
				debugger;
			})
			.catch((error) => {
				console.log(error);
				debugger;
			});
		this._ctxChart = this.template.querySelector("canvas.certBarChart").getContext("2d");
	}

	makeChart() {
		// Make chart data
		this.tableAllData = this.tableAllData.sort((a, b) => (a.Points < b.Points ? -1 : 1));
		const labels = this.tableAllData.map((row) => row.Name);
		const data = this.tableAllData.map((row) => row.Points);
		const options = {
			type: "bar",
			data: {
				labels,
				datasets: [
					{
						backgroundColor: "#639dff",
						data
					}
				]
			},
			options: {
				responsive: true,
				legend: { display: false },
				title: { display: false },
				animation: {
					animateScale: true
				}
			}
		};
		// eslint-disable-next-line no-new
		new window.Chart(this._ctxChart, options);
	}
}
