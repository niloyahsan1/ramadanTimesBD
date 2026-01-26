document.addEventListener("DOMContentLoaded", function () {
	/* ===== DARK MODE TOGGLE ===== */
	const darkBtn = document.getElementById("darkToggle");

	darkBtn.addEventListener("click", () => {
		document.body.classList.toggle("dark");
		darkBtn.innerText = document.body.classList.contains("dark")
			? "☀ Light"
			: "🌙 Dark";
	});

	const city = "Dhaka";
	const country = "Bangladesh";
	const now = new Date();
	const month = now.getMonth() + 1;
	const year = now.getFullYear();

	/* ===== helpers ===== */
	function cleanTime(t) {
		return t.split(" ")[0];
	}

	// 24h → 12h
	function to12(t) {
		let [h, m] = t.split(":");
		h = parseInt(h, 10);
		let ap = h >= 12 ? "PM" : "AM";
		h = h % 12 || 12;
		return `${h}:${m} ${ap}`;
	}

	// English → Bangla digits
	function toBangla(num) {
		const map = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
		return num
			.toString()
			.split("")
			.map((d) => map[d] ?? d)
			.join("");
	}

	// format countdown in Bangla
	function formatBanglaTime(h, m, s) {
		return `${toBangla(h)} ঘন্টা ${toBangla(m)} মিনিট ${toBangla(s)} সেকেন্ড`;
	}

	// format date and month in Bangla
	function formatBanglaDate(dateStr) {
		// dateStr is like "18-02-2026"
		const [dd, mm, yyyy] = dateStr.split("-");
		const dateObj = new Date(`${yyyy}-${mm}-${dd}`);

		return dateObj.toLocaleDateString("bn-BD", {
			day: "numeric",
			month: "long",
		});
	}

	// ===== SHOW TODAY DATE (BANGLA) =====
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

	/* ===== fetch calendar ===== */
	fetch(
		`https://api.aladhan.com/v1/calendarByCity?city=${city}&country=${country}&method=1&school=1&month=${month}&year=${year}`,
	)
		.then((r) => r.json())
		.then((d) => {
			/* ===== MONTHLY TABLE ===== */
			let html = "";
			d.data.forEach((day, i) => {
				let stage, cls, badge;
				if (i < 10) {
					stage = "রহমাহ";
					cls = "stage-rahmah";
					badge = "rahmah";
				} else if (i < 20) {
					stage = "মাগফিরাহ";
					cls = "stage-maghfirah";
					badge = "maghfirah";
				} else {
					stage = "নাজাত";
					cls = "stage-nijat";
					badge = "nijat";
				}

				html += `
      <tr class="${cls}">
		<td>${toBangla(i + 1)}</td>
        <td>${formatBanglaDate(day.date.gregorian.date)}</td>
        <td>${toBangla(to12(cleanTime(day.timings.Fajr)))}</td>
        <td>${toBangla(to12(cleanTime(day.timings.Maghrib)))}</td>
        <td><span class="badge ${badge}">${stage}</span></td>
      </tr>
    `;
			});

			document.getElementById("tableBody").innerHTML = html;

			/* ===== TODAY LOGIC ===== */
			const todayIndex = new Date().getDate() - 1;
			const today = d.data[todayIndex].timings;

			const fajr = cleanTime(today.Fajr);
			const maghrib = cleanTime(today.Maghrib);

			document.getElementById("sehriToday").innerText = toBangla(
				to12(fajr),
			);
			document.getElementById("iftarToday").innerText = toBangla(
				to12(maghrib),
			);

			function updateCountdown() {
				const now = new Date();

				// Sehri target (Fajr)
				const [fh, fm] = fajr.split(":");
				const sehriTime = new Date();
				sehriTime.setHours(fh, fm, 0, 0);

				// Iftar target (Maghrib)
				const [mh, mm] = maghrib.split(":");
				const iftarTime = new Date();
				iftarTime.setHours(mh, mm, 0, 0);

				let target, label;

				// Night → Sehri countdown
				if (now < sehriTime) {
					target = sehriTime;
					label = "সেহরির বাকি সময়";
				}

				// Day → Iftar countdown
				else if (now < iftarTime) {
					target = iftarTime;
					label = "ইফতারের বাকি সময়";
				}

				// After iftar
				else {
					document.getElementById("countdown").innerText =
						"ইফতার সময় হয়েছে 🌙";
					return;
				}

				const diff = target - now;
				const h = Math.floor(diff / 3600000);
				const m = Math.floor((diff % 3600000) / 60000);
				const s = Math.floor((diff % 60000) / 1000);

				document.getElementById("countdown").innerText =
					`${label} \n ${formatBanglaTime(h, m, s)}`;
			}

			updateCountdown();
			setInterval(updateCountdown, 1000);
		});
});
