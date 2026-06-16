// ==========================================
// 1. ส่วนตั้งค่าส่วนกลาง (ใช้ URL เดียวกัน)
// ==========================================
const googleScriptUrl = "https://script.google.com/macros/s/AKfycbw_Y_AyRP5ATF1lV5QMPgBEGogC_T7jN91NHrXwecT3GXFzM8WzPYBwgcAmOmEjlR6G/exec";
 
// ==========================================
// 2. โค้ดสำหรับหน้าแรก (index.html) - ส่งข้อมูลคอมมิชชั่น
// ==========================================
function sendDataToGoogleScript(nameData, emailData) {
    const payload = {
        action: "submitCommission",
        name: nameData,
        email: emailData
    };
 
    fetch(googleScriptUrl, {
        method: 'POST',
        mode: 'cors',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "success") {
            window.location.href = "Status.html";
        } else {
            alert("เกิดข้อผิดพลาด: " + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้");
    });
}
 
// ==========================================
// 3. โค้ดสำหรับหน้าตรวจสอบสถานะ (Status.html) - ดึงข้อมูลคิวงาน
// ==========================================
 
function calcWaitDays(fromDate, toDateStr, holidays) {
    var to  = new Date(toDateStr);
    var cur = new Date(fromDate);
    if (cur >= to) return 0;
    var count = 0;
    cur.setDate(cur.getDate() + 1);
    while (cur <= to) {
        var s = cur.toISOString().split("T")[0];
        if (!holidays.includes(s)) count++;
        cur.setDate(cur.getDate() + 1);
    }
    return count;
}
 
function formatThaiDate(dateStr) {
    var d = new Date(dateStr);
    return d.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
}
 
// โหลดข้อมูลคิวและระดับความยุ่งอัตโนมัติ
window.addEventListener('DOMContentLoaded', function() {
 
    // --- ดึงระดับความยุ่ง ---
    var busyData = {
        1: { label: 'ปกติ',      sub: 'รับคิวได้ตามปกติค่ะ',                dot: '#1D9E75' },
        2: { label: 'ยุ่ง',       sub: 'คิวเริ่มเยอะ อาจใช้เวลานานขึ้น',    dot: '#BA7517' },
        3: { label: 'เดือด',      sub: 'คิวเกือบเต็ม กำลังพิจารณาปิดรับ',   dot: '#993C1D' },
        4: { label: 'เดือดมาก',   sub: 'ปิดรับคิวชั่วคราว โปรดติดตามประกาศ', dot: '#A32D2D' }
    };
 
    function renderBusyLevel(level) {
        var n = parseInt(level) || 1;
        var d = busyData[n] || busyData[1];
        [1, 2, 3, 4].forEach(function(i) {
            var el = document.getElementById('bs' + i);
            if (!el) return;
            el.className = 'busy-seg bs' + i + (i === n ? ' active' : i < n ? ' passed' : '');
        });
        var labelEl = document.getElementById('busy-label');
        var subEl   = document.getElementById('busy-sub');
        var dotEl   = document.getElementById('busy-dot');
        if (labelEl) labelEl.textContent = d.label;
        if (subEl)   subEl.textContent   = d.sub;
        if (dotEl)   dotEl.style.background = d.dot;
    }
 
    if (document.getElementById('busy-label')) {
        fetch(googleScriptUrl + "?action=getBusyLevel", { redirect: "follow" })
            .then(function(r) { return r.json(); })
            .then(function(data) { renderBusyLevel(data.level); })
            .catch(function() { renderBusyLevel(1); });
    }
 
    // --- ดึงข้อมูลคิว ---
    if (document.getElementById("queue-loading")) {
        fetch(googleScriptUrl + "?action=getQueueInfo", { redirect: "follow" })
            .then(response => response.json())
            .then(function(info) {
                document.getElementById("queue-loading").style.display = "none";
                document.getElementById("queue-content").style.display = "block";
 
                document.getElementById("q-normal").textContent = info.commissionCount + " / " + info.maxCommissionQueue;
                document.getElementById("q-custom").textContent = info.customCount + " คิว";
                document.getElementById("q-due").textContent    = info.lastDueDate;
 
                var slotsWrap = document.getElementById("q-slots-wrap");
                var slotsEl   = document.getElementById("q-slots");
                var slotsBadge = document.getElementById("q-slots-badge");
 
                if (info.slotsLeft <= 0) {
                    document.getElementById("queue-banner").classList.add("full");
                    slotsWrap.innerHTML = "🔴 ขณะนี้คิวเต็มแล้วค่ะ";
                    slotsWrap.className = "slots-full";
                } else {
                    if (slotsEl) slotsEl.textContent = info.slotsLeft;
                    if (slotsBadge) {
                        slotsBadge.className = 'slots-badge ok';
                        slotsBadge.querySelector('span:first-child').textContent = '🟢';
                    }
                }
 
                var holidays    = info.holidays || [];
                var dates       = info.activeQueueDates || [];
                var today       = new Date();
                var todayStr    = today.toISOString().split("T")[0];
                var futureDates = dates.filter(function(d) { return d >= todayStr; });
                var startStr    = futureDates.length > 0 ? futureDates[futureDates.length - 1] : todayStr;
                var waitDays    = calcWaitDays(today, startStr, holidays);
 
                document.getElementById("q-before-count").textContent = futureDates.length;
                document.getElementById("q-wait-days").textContent    = waitDays > 0 ? "~" + waitDays + " วันทำการ" : "ได้งานทันที";
                document.getElementById("q-start-date").textContent   = waitDays > 0 ? formatThaiDate(startStr) : "เริ่มได้เลย";
                document.getElementById("q-wait-wrap").style.display  = "block";
            })
            .catch(function(err) {
                document.getElementById("queue-loading").textContent = "ไม่สามารถโหลดข้อมูลคิวได้ (เกิดข้อผิดพลาดของระบบ)";
                console.error(err);
            });
    }
});
 
// ฟังก์ชันค้นหาสถานะคิวงานผ่านอีเมล
function searchStatus() {
    var searchKey  = document.getElementById("searchKey").value.trim();
    var resultSide = document.getElementById("result-zone-side");
    var btn        = document.getElementById("searchBtn");
 
    if (!searchKey) {
        resultSide.innerHTML = '<div class="error-box">⚠️ กรุณากรอกอีเมลด้วยนะคะ</div>';
        resultSide.style.display = "block";
        return;
    }
 
    btn.disabled    = true;
    btn.textContent = "กำลังค้นหา...";
    resultSide.style.display = "none";
 
    fetch(googleScriptUrl, {
        method: "POST",
        mode: "cors",
        redirect: "follow",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "checkCustomerStatus", key: searchKey })
    })
    .then(response => response.json())
    .then(function(res) {
        btn.disabled    = false;
        btn.textContent = "✦ ค้นหาสถานะงาน ✦";
        resultSide.style.display = "block";
 
        if (res.success) {
            var steps = ["รอยืนยัน", "ตกลงรับงาน", "ส่งภาพร่าง", "ชำระเงินแล้ว", "ส่งงานแล้ว"];
            var stepColors = {
                "รอยืนยัน":     "#EC5C77",
                "ตกลงรับงาน":   "#66BCD1",
                "ส่งภาพร่าง":   "#F0C16F",
                "ชำระเงินแล้ว": "#B2DF6A",
                "ส่งงานแล้ว":   "#DF9682"
            };
 
            var html = '';
            res.orders.forEach(function(order) {
                var currentIdx  = steps.indexOf(order.status);
                var trackerHtml = '<div class="mini-tracker">';
 
                steps.forEach(function(step, i) {
                    var isDone    = i < currentIdx;
                    var isCurrent = i === currentIdx;
                    var dotStyle  = isDone
                        ? 'background:' + stepColors[step] + '; color:#fff;'
                        : isCurrent
                            ? 'background:' + stepColors[step] + '; color:#fff; box-shadow:0 0 0 3px ' + stepColors[step] + '33;'
                            : 'background:#e5e7eb; color:#aaa;';
                    var dotIcon   = isDone ? '✓' : (i + 1);
                    var lineStyle = isDone ? 'background:' + stepColors[step] + ';' : 'background:#e5e7eb;';
 
                    trackerHtml += '<div class="mini-step">';
                    trackerHtml +=   '<div class="mini-dot" style="' + dotStyle + '">' + dotIcon + '</div>';
                    trackerHtml +=   '<div class="mini-step-label' + (isCurrent ? ' active' : '') + '">' + step + '</div>';
                    trackerHtml += '</div>';
                    if (i < steps.length - 1) {
                        trackerHtml += '<div class="mini-line" style="' + lineStyle + '"></div>';
                    }
                });
                trackerHtml += '</div>';
 
                html +=
                    '<div class="order-item">' +
                        '<div class="order-title">' + order.jobType.replace(' (', '<br>(') + '</div>' +
                        '<div class="order-date">วันที่สั่งซื้อ: ' + order.date + '</div>' +
                        '<div class="order-date" style="margin-bottom:10px;">ชื่อ: คุณ ' + order.name + '</div>' +
                        trackerHtml +
                        '<div class="queue-info">' +
                            '🔶 ลำดับคิว: <strong>' + order.queueNumber + '</strong>' +
                            '<br>📅 กำหนดเสร็จ: <strong>' + order.dueDate + '</strong>' +
                        '</div>' +
                    '</div>';
            });
            resultSide.innerHTML = html;
        } else {
            resultSide.innerHTML = '<div class="error-box">⚠️ ' + res.message + '</div>';
        }
    })
    .catch(function(err) {
        btn.disabled    = false;
        btn.textContent = "✦ ค้นหาสถานะงาน ✦";
        resultSide.style.display = "block";
        resultSide.innerHTML = '<div class="error-box">⚠️ เกิดข้อผิดพลาดของระบบในการดึงข้อมูล</div>';
        console.error(err);
    });
}
