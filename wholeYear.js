document.addEventListener("DOMContentLoaded", function () {
	/* --------------- DARK MODE TOGGLE --------------- */
	const darkBtn = document.getElementById("darkToggle");
	const themeIcon = document.getElementById("themeIcon");

	darkBtn.addEventListener("click", () => {
		document.body.classList.toggle("dark");

		if (document.body.classList.contains("dark")) {
			// Sun icon
			themeIcon.innerHTML = `
			<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
				<path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.8 1.42-1.42zm10.45 0l1.42 1.42 1.79-1.8-1.41-1.41-1.8 1.79zM12 4V1h-1v3h1zm0 19v-3h-1v3h1zm8-11h3v-1h-3v1zM1 12h3v-1H1v1zm15.24 6.16l1.8 1.79 1.41-1.41-1.79-1.8-1.42 1.42zM4.22 18.36l-1.79 1.8 1.41 1.41 1.8-1.79-1.42-1.42zM12 6a6 6 0 100 12 6 6 0 000-12z"/>
			</svg>
		`;
		} else {
			// Moon icon
			themeIcon.innerHTML = `
			<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
				<path d="M21 12.79A9 9 0 0 1 11.21 3c0-.34.02-.67.05-1A9 9 0 1 0 22 13.74c-.33.03-.66.05-1 .05z"/>
			</svg>
		`;
		}
	});

	/* --------------- LIVE CURRENT TIME --------------- */
	function updateCurrentTime() {
		const now = new Date();

		const time = now.toLocaleTimeString("bn-BD", {
			hour: "numeric",
			minute: "numeric",
			second: "numeric",
		});

		document.getElementById("currentTime").innerText = time;
	}

	updateCurrentTime();
	setInterval(updateCurrentTime, 1000);

	const city = "Dhaka";
	const country = "Bangladesh";
	const now = new Date();
	const month = now.getMonth() + 1;
	const year = now.getFullYear();

	/* --------------- HELPERS --------------- */
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

	/* --------------- SHOW TODAY DATE --------------- */
	const todayDateText = new Date().toLocaleDateString("bn-BD", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	const todayDateEl = document.getElementById("todayDate");
	if (todayDateEl) {
		todayDateEl.innerText = todayDateText;
	}

	/* --------------- FETCH CALENDAR --------------- */
	fetch(
		`https://api.aladhan.com/v1/calendarByCity?city=${city}&country=${country}&method=1&school=1&month=${month}&year=${year}`,
	)
		.then((r) => r.json())
		.then((d) => {
			/* --------------- MONTHLY TABLE --------------- */
			let html = "";

			const todayDateNumber = new Date().getDate();

			d.data.forEach((day, i) => {
				let cls;

				if (i < 10) cls = "stage-rahmah";
				else if (i < 20) cls = "stage-maghfirah";
				else cls = "stage-nijat";

				// Check if this is today
				const isToday = i + 1 === todayDateNumber;

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

			/* --------------- TODAY LOGIC --------------- */
			const todayIndex = todayDateNumber - 1;
			const todayData = d.data[todayIndex].timings;

			const fajr = cleanTime(todayData.Fajr);
			const maghrib = cleanTime(todayData.Maghrib);

			document.getElementById("sehriToday").innerText = toBangla(
				to12(fajr),
			);

			document.getElementById("iftarToday").innerText = toBangla(
				to12(maghrib),
			);

			function updateCountdown() {
				const now = new Date();

				const [fh, fm] = fajr.split(":");
				const sehriTime = new Date();
				sehriTime.setHours(fh, fm, 0, 0);

				const [mh, mm] = maghrib.split(":");
				const iftarTime = new Date();
				iftarTime.setHours(mh, mm, 0, 0);

				let target, label;

				if (now < sehriTime) {
					target = sehriTime;
					label = "সেহরির বাকি সময়";
				} else if (now < iftarTime) {
					target = iftarTime;
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
