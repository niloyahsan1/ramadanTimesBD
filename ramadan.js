document.addEventListener("DOMContentLoaded", function () {
	/* -------- DARK MODE TOGGLE -------- */
	const darkBtn = document.getElementById("darkToggle");
	const themeIcon = document.getElementById("themeIcon");

	darkBtn.addEventListener("click", () => {
		document.body.classList.toggle("dark");

		themeIcon.innerHTML = document.body.classList.contains("dark")
			? `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
					<path d="M12 6a6 6 0 100 12 6 6 0 000-12zM12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
			   </svg>`
			: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
					<path d="M21 12.79A9 9 0 0 1 11.21 3c0-.34.02-.67.05-1A9 9 0 1 0 22 13.74c-.33.03-.66.05-1 .05z"/>
			   </svg>`;
	});

	/* -------- LIVE TIME -------- */
	function updateCurrentTime() {
		const now = new Date();
		document.getElementById("currentTime").innerText =
			now.toLocaleTimeString("bn-BD");
	}
	updateCurrentTime();
	setInterval(updateCurrentTime, 1000);

	const city = "Dhaka";
	const country = "Bangladesh";

	/* -------- HELPERS -------- */
	function cleanTime(t) {
		return t.split(" ")[0];
	}

	function to12(t) {
		let [h, m] = t.split(":");
		h = parseInt(h, 10);
		let ap = h >= 12 ? "PM" : "AM";
		h = h % 12 || 12;
		return `${h}:${m} ${ap}`;
	}

	function toBangla(num) {
		const map = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
		return num
			.toString()
			.split("")
			.map((d) => map[d] ?? d)
			.join("");
	}

	function formatBanglaTime(h, m, s) {
		return `${toBangla(h)} ঘন্টা ${toBangla(m)} মিনিট ${toBangla(s)} সেকেন্ড`;
	}

	function formatBanglaDate(dateStr) {
		const [dd, mm, yyyy] = dateStr.split("-");
		const dateObj = new Date(`${yyyy}-${mm}-${dd}`);
		return dateObj.toLocaleDateString("bn-BD", {
			day: "numeric",
			month: "long",
		});
	}

	/* -------- SHOW TODAY DATE -------- */
	const todayDateText = new Date().toLocaleDateString("bn-BD", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});
	document.getElementById("todayDate").innerText = todayDateText;

	/* -------- RAMADAN RANGE -------- */
	const RAMADAN_START = new Date("2026-02-19");
	const RAMADAN_END = new Date("2026-03-20");

	/* -------- FETCH FEB + MAR 2026 -------- */
	Promise.all([
		fetch(
			`https://api.aladhan.com/v1/calendarByCity?city=${city}&country=${country}&method=1&school=1&month=2&year=2026`,
		).then((r) => r.json()),
		fetch(
			`https://api.aladhan.com/v1/calendarByCity?city=${city}&country=${country}&method=1&school=1&month=3&year=2026`,
		).then((r) => r.json()),
	]).then(([feb, mar]) => {
		const allDays = [...feb.data, ...mar.data];

		const ramadanDays = allDays.filter((d) => {
			const date = new Date(
				d.date.gregorian.date.split("-").reverse().join("-"),
			);
			return date >= RAMADAN_START && date <= RAMADAN_END;
		});

		/* -------- TABLE -------- */
		let html = "";

		const today = new Date();
		const todayFormatted = today
			.toLocaleDateString("en-GB")
			.replace(/\//g, "-");

		ramadanDays.forEach((day, i) => {
			let cls =
				i < 10
					? "stage-rahmah"
					: i < 20
						? "stage-maghfirah"
						: "stage-nijat";

			const isToday = day.date.gregorian.date === todayFormatted;

			html += `
				<tr class="${cls} ${isToday ? "today-row" : ""}">
					<td>${toBangla(i + 1)}</td>
					<td>${formatBanglaDate(day.date.gregorian.date)}</td>
					<td>${toBangla(to12(cleanTime(day.timings.Fajr)))}</td>
					<td>${toBangla(to12(cleanTime(day.timings.Maghrib)))}</td>
				</tr>
			`;
		});

		document.getElementById("tableBody").innerHTML = html;

		/* -------- COUNTDOWN -------- */
		const todayData = ramadanDays.find(
			(d) => d.date.gregorian.date === todayFormatted,
		);

		if (!todayData) {
			document.getElementById("countdown").innerText = "রমজান চলমান নয়";
			return;
		}

		const fajr = cleanTime(todayData.timings.Fajr);
		const maghrib = cleanTime(todayData.timings.Maghrib);

		document.getElementById("sehriToday").innerText = toBangla(to12(fajr));

		document.getElementById("iftarToday").innerText = toBangla(
			to12(maghrib),
		);

		function updateCountdown() {
			const now = new Date();

			const [fh, fm] = fajr.split(":");
			const sehri = new Date();
			sehri.setHours(fh, fm, 0, 0);

			const [mh, mm] = maghrib.split(":");
			const iftar = new Date();
			iftar.setHours(mh, mm, 0, 0);

			let target, label;

			if (now < sehri) {
				target = sehri;
				label = "সেহরির বাকি সময়";
			} else if (now < iftar) {
				target = iftar;
				label = "ইফতারের বাকি সময়";
			} else {
				document.getElementById("countdown").innerText =
					"ইফতারের সময় হয়েছে 🌙";
				return;
			}

			const diff = target - now;
			const h = Math.floor(diff / 3600000);
			const m = Math.floor((diff % 3600000) / 60000);
			const s = Math.floor((diff % 60000) / 1000);

			document.getElementById("countdown").innerText =
				`${label}\n${formatBanglaTime(h, m, s)}`;
		}

		updateCountdown();
		setInterval(updateCountdown, 1000);
	});
});
