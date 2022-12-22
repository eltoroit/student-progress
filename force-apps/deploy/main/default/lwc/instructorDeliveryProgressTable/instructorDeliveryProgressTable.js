import { api } from "lwc";
import LightningModal from "lightning/modal";

export default class InstructorProgressTable extends LightningModal {
	_studentsData = [];
	columns = [];

	@api
	get studentsData() {
		return this._studentsData;
	}
	set studentsData(value) {
		this.columns = [];
		if (value && value.length > 0) {
			let initialized = false;
			this.columns.push({ label: "Name", fieldName: "name", type: "text" });
			this.columns.push({
				type: "number",
				label: "Points",
				initialWidth: 50,
				fieldName: "points",
				cellAttributes: { alignment: "right" }
			});
			this._studentsData = value.map((student) => {
				let output = {
					Id: student.StudentId,
					name: student.Name,
					points: student.Points
				};
				student.EX.forEach((element) => {
					// output[`EX${element.index}`] = element.ranking;
					output[`EX${element.index}`] = `${element.ranking} ${element.emoji}`;
					// output[`EX${element.index}`] = `${element.ranking} ($${element.points}) ${element.emoji}`;
					if (!initialized) {
						this.columns.push({
							type: "text",
							fixedWidth: 50,
							label: `EX${element.index}`,
							fieldName: `EX${element.index}`,
							cellAttributes: { alignment: "right" }
						});
					}
				});
				initialized = true;

				return output;
			});
		} else {
			this._studentsData = [];
		}
	}

	handleOkay() {
		this.close("okay");
	}
}
