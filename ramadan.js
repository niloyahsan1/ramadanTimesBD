document.addEventListener("DOMContentLoaded", function () {
	const city = "Dhaka";
	const country = "Bangladesh";

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

	// ===== Ramadan 2026 dates =====
	const RAMADAN_START = new Date("2026-02-18");
	const RAMADAN_END = new Date("2026-03-19");

	/* ===== fetch Feb + Mar 2026 ===== */
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

		/* ===== TABLE ===== */
		let html = "";
		ramadanDays.forEach((day, i) => {
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
          <td>রমজান – ${toBangla(i + 1)}</td>
          <td>${formatBanglaDate(day.date.gregorian.date)}</td>
          <td>${toBangla(to12(cleanTime(day.timings.Fajr)))}</td>
          <td>${toBangla(to12(cleanTime(day.timings.Maghrib)))}</td>
          <td><span class="badge ${badge}">${stage}</span></td>
        </tr>
      `;
		});

		document.getElementById("tableBody").innerHTML = html;

		/* ===== TODAY COUNTDOWN (ONLY IF RAMADAN DAY) ===== */
		const today = new Date();
		const todayKey = today
			.toLocaleDateString("en-GB")
			.split("/")
			.reverse()
			.join("-");

		const todayData = ramadanDays.find(
			(d) => d.date.gregorian.date === todayKey,
		);

		if (!todayData) {
			document.getElementById("countdown").innerText = "রমজান চলমান নয়";
			return;
		}

		const fajr = cleanTime(todayData.timings.Fajr);
		const maghrib = cleanTime(todayData.timings.Maghrib);

		document.getElementById("sehriToday").innerText = toBangla(to12(fajr));
		document.getElementById("iftarToday").innerText = toBangla(to12(maghrib));

		function updateCountdown() {
			const now = new Date();

			// Sehri target (Fajr)
			const [fh, fm] = fajr.split(":");
			const sehri = new Date();
			sehri.setHours(fh, fm, 0, 0);

			// Iftar target (Maghrib)
			const [mh, mm] = maghrib.split(":");
			const iftar = new Date();
			iftar.setHours(mh, mm, 0, 0);

			let target, label;

			// Night → Sehri countdown
			if (now < sehri) {
				target = sehri;
				label = "সেহরির বাকি সময়";
			}

			// Day → Iftar countdown
			else if (now < iftar) {
				target = iftar;
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
