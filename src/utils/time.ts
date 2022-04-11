/** @public */
export function msToTime(ms: number) {
	const seconds = parseInt((ms / 1000).toFixed(1));
	const minutes = parseInt((ms / (1000 * 60)).toFixed(1));
	const hours = parseInt((ms / (1000 * 60 * 60)).toFixed(1));
	const days = parseInt((ms / (1000 * 60 * 60 * 24)).toFixed(1));

	if (seconds == 0) return Math.ceil(ms) + "ms";
	else if (seconds < 60) return seconds + "s";
	else if (minutes < 60) return minutes + "m";
	else if (hours < 24) return hours + "h";
	else return days + "d";
}
