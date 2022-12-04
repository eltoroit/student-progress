import { api, LightningElement } from "lwc";

export default class Image extends LightningElement {
	@api url;
	@api maxWidth;
	@api maxHeight;

	get style() {
		let output = "";
		if (this.maxWidth) {
			output += `width:${typeof this.maxWidth === "number" ? `${this.maxWidth}px` : this.maxWidth};`;
            output += `max-width:${typeof this.maxWidth === "number" ? `${this.maxWidth}px` : this.maxWidth};`;
		}
		if (this.maxHeight) {
            output += `height:${typeof this.maxHeight === "number" ? `${this.maxHeight}px` : this.maxHeight};`;
            output += `max-height:${typeof this.maxHeight === "number" ? `${this.maxHeight}px` : this.maxHeight};`;
		}
		return output;
	}
}
