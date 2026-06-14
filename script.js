// ==========================================
// 1. ส่วนตั้งค่าส่วนกลาง (ใช้ URL เดียวกัน)
// ==========================================
const googleScriptUrl = "https://script.google.com/macros/s/AKfycbxBvbXELIDEVe_VkmedB7TN-YQDpiGKiOlGR4dFSPT6TOVMgjJ6O3FeD0dWV7kxX2tPOA/exec";


// ==========================================
// 2. โค้ดสำหรับหน้าแรก (index.html) - ส่งข้อมูลคอมมิชชั่น
// ==========================================
function sendDataToGoogleScript(nameData, emailData) {
    const payload = {
        action: "submitCommission", // ใส่เพิ่มเพื่อบอกกูเกิลว่านี่คือการส่งข้อมูลใหม่
        name: nameData,
        email: emailData
    };

    fetch(googleScriptUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'text/plain',
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if(data.status === "success") {
            // เมื่อบันทึกสำเร็จ สั่งย้ายไปหน้าตรวจสอบสถานะทันที
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

// ฟังก์ชันคำนวณวันเวลารอ (ย้ายมาจากในแท็กสคริปต์เดิม)
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

// ฟังก์ชันแปลงรูปแบบวันที่แบบไทย
function formatThaiDate(dateStr) {
  var d = new Date(dateStr);
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
}

// ฟังก์ชันเปิดป๊อปอัพแสดงขั้นตอนการทำงาน
function showStatusModal(btn) {
  var currentStatus = btn.getAttribute("data-status");
  var steps = [
    { key: "รอยืนยัน",     desc: "ได้รับงานแล้ว รอการติดต่อจากนักวาด" },
    { key: "ตกลงรับงาน",   desc: "ยืนยันรับงานแล้ว โปรดรอภาพร่าง" },
    { key: "ส่งภาพร่าง",   desc: "ส่งภาพร่างให้ตรวจสอบ" },
    { key: "ชำระเงินแล้ว", desc: "ได้รับการชำระเงินแล้ว" },
    { key: "ส่งงานแล้ว",   desc: "ส่งงานเสร็จสมบูรณ์" }
  ];

  var currentIdx = steps.findIndex(function(s) { return s.key === currentStatus; });
  var html = '<div style="display:flex; flex-direction:column;">';

  steps.forEach(function(step, i) {
    var isDone    = i < currentIdx;
    var isCurrent = i === currentIdx;
    var isLast    = i === steps.length - 1;

    var circleStyle = isDone
      ? 'background:#22c55e; color:#fff;'
      : isCurrent
        ? 'background:#f97316; color:#fff; box-shadow:0 0 0 4px #fed7aa;'
        : 'background:#e5e7eb; color:#aaa;';

    var labelStyle = isCurrent
      ? 'color:#f97316; font-weight:700;'
      : isDone ? 'color:#333; font-weight:600;' : 'color:#aaa; font-weight:600;';

    var descStyle = (isDone || isCurrent) ? 'color:#aaa;' : 'color:#ccc;';
    var icon      = isDone ? '✓' : isCurrent ? '●' : (i + 1);

    html +=
      '<div class="modal-step-row">' +
        '<div class="modal-step-col">' +
          '<div class="modal-step-circle" style="' + circleStyle + '">' + icon + '</div>' +
          (!isLast ? '<div class="modal-step-line"></div>' : '') +
        '</div>' +
        '<div style="padding-top:4px;">' +
          '<div style="font-size:14px; ' + labelStyle + '">' +
            step.key + (isCurrent ? ' ← กำลังดำเนินการ' : '') +
          '</div>' +
          '<div style="font-size:12px; ' + descStyle + '">' + step.desc + '</div>' +
        '</div>' +
      '</div>';
  });

  html += '</div>';
  document.getElementById("modalSteps").innerHTML = html;
  document.getElementById("statusModal").style.display = "flex";
}

// สั่งให้โหลดข้อมูลคิวอัตโนมัติ "เฉพาะตอนเปิดหน้า Status.html"
window.addEventListener('DOMContentLoaded', (event) => {
  // ตรวจสอบว่าถ้าหน้าเว็บปัจจุบันคือหน้า Status.html ถึงจะเริ่มดึงข้อมูลคิวจากกูเกิล
  if (document.getElementById("queue-loading")) {
    fetch(googleScriptUrl + "?action=getQueueInfo")
      .then(response => response.json())
      .then(function(info) {
        document.getElementById("queue-loading").style.display = "none";
        document.getElementById("queue-content").style.display = "block";

        document.getElementById("q-normal").textContent = info.commissionCount + " / " + info.maxCommissionQueue;
        document.getElementById("q-custom").textContent = info.customCount + " คิว";
        document.getElementById("q-due").textContent    = info.lastDueDate;

        var slotsWrap = document.getElementById("q-slots-wrap");
        var slotsEl   = document.getElementById("q-slots");

        if (info.slotsLeft <= 0) {
          document.getElementById("queue-banner").classList.add("full");
          slotsWrap.innerHTML = "🔴 ขณะนี้คิวเต็มแล้วค่ะ";
          slotsWrap.className = "slots-full";
        } else {
          slotsEl.textContent = info.slotsLeft;
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

// ฟังก์ชันค้นหาสถานะคิวงานผ่านอีเมล (สำหรับหน้า Status.html)
function searchStatus() {
  var searchKey   = document.getElementById("searchKey").value.trim();
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

  // ยิงคำสั่ง POST ไปค้นหาที่กูเกิลสคริปต์
  fetch(googleScriptUrl, {
    method: "POST",
    mode: "cors",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ action: "checkCustomerStatus", key: searchKey })
  })
  .then(response => response.json())
  .then(function(res) {
    btn.disabled    = false;
    btn.textContent = "✦ ค้นหาสถานะงาน ✦";
    resultSide.style.display = "block";

    if (res.success) {
      var html = '';
      res.orders.forEach(function(order) {
        html +=
          '<div class="order-item">' +
            '<div class="order-title">' + order.jobType.replace(' (', '<br>(') + '</div>' +
            '<div class="order-date">วันที่สั่งซื้อ: ' + order.date + '</div>' +
            '<div class="order-date" style="margin-bottom:10px;">ชื่อ: คุณ ' + order.name + '</div>' +
            '<div>สถานะงาน: <span class="status-badge" data-status="' + order.status + '">' + order.status + '</span></div>' +
            '<div class="queue-info">' +
              '🔶 ลำดับคิว: <strong>' + order.queueNumber + '</strong>' +
              '<br>📅 กำหนดเสร็จ: <strong>' + order.dueDate + '</strong>' +
            '</div>' +
            '<button type="button" class="see-steps-btn" onclick="showStatusModal(this)" data-status="' + order.status + '">ดูสถานะปัจจุบัน →</button>' +
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
