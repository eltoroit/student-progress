import Utils from "c/utils";
import { api, LightningElement, wire } from "lwc";
import { refreshApex } from "@salesforce/apex";
import getClassReport from "@salesforce/apex/Instructor.getClassReport";

export default class ClassProgress extends LightningElement {
	@api selectedCourseDeliveryId = "";

	table = [];
	students = [];
	exercises = [];
	loading = false;

	wiredGetClassReport = null;
	@wire(getClassReport, { CxD: "$selectedCourseDeliveryId" })
	wired_getClassReport(result) {
		this.wiredGetClassReport = result;
		debugger;
		let { data, error } = result;
		if (data) {
			const mapStudents = {};
			this.exercises = data.EXERCISES.map((ex) => ({ Id: ex.Id, Name: ex.Name }));
			this.students = data.STUDENTS.map((student) => {
				const output = { Id: student.Id, Name: student.Name, Points: 0, mExS: {} };
				mapStudents[student.Id] = output;
				return output;
			});
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
			this.table = this.students.map((student) => {
				const output = {
					StudentId: student.Id,
					Name: student.Name,
					Points: student.Points
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
			this.loading = false;
			debugger;
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
}
