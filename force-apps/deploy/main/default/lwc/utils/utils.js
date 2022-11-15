import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class Util {
	static variants = {
		error: "error",
		warning: "warning",
		success: "success",
		info: "info"
	};
	static showNotification(cmp, { title = "", message = "", variant = "success" }) {
		cmp.dispatchEvent(
			new ShowToastEvent({
				title,
				message,
				variant
			})
		);
	}
}
