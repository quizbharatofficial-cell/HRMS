document.addEventListener(
  "DOMContentLoaded",
  loadDashboard
);

function loadDashboard() {

  const employees =
    HRMS.get("employees");

  const attendance =
    HRMS.get("attendance");

  const payroll =
    HRMS.get("payroll");

  const today =
    localToday();

  const month =
    today.slice(0, 7);

  const active =
    employees.filter(emp =>
      !emp.status ||
      emp.status === "Active"
    );

  const todayRecords =
    attendance.filter(item =>
      item.date === today
    );

  const status = value =>
    String(value || "")
      .trim()
      .toUpperCase();

  const present =
    todayRecords.filter(item =>
      status(item.status) === "P"
    ).length;

  const absent =
    todayRecords.filter(item =>
      status(item.status) === "A"
    ).length;

  const leave =
    todayRecords.filter(item =>
      ["EL","CL","SL"]
        .includes(status(item.status))
    ).length;

  const wo =
    todayRecords.filter(item =>
      status(item.status) === "WO"
    ).length;

  const holiday =
    todayRecords.filter(item =>
      status(item.status) ===
      "HOLIDAY"
    ).length;

  const late =
    todayRecords.filter(item =>
      item.late === true
    ).length;

  const ot =
    todayRecords.reduce(
      (sum, item) =>
        sum +
        Math.max(
          0,
          Number(item.otHours) || 0
        ),
      0
    );

  const monthPayroll =
    payroll.filter(item =>
      item.month === month
    );

  const generatedIds =
    new Set(
      monthPayroll.map(item =>
        item.employeeId
      )
    );

  const pending =
    active.filter(emp =>
      !generatedIds.has(emp.id)
    ).length;

  setValue(
    "totalEmployees",
    active.length
  );

  setValue(
    "presentCount",
    present
  );

  setValue(
    "absentCount",
    absent
  );

  setValue(
    "leaveCount",
    leave
  );

  setValue(
    "woCount",
    wo
  );

  setValue(
    "holidayCount",
    holiday
  );

  setValue(
    "lateCount",
    late
  );

  setValue(
    "otCount",
    number(ot)
  );

  setValue(
    "payrollGenerated",
    generatedIds.size
  );

  setValue(
    "payrollPending",
    pending
  );
}

function localToday() {

  const date = new Date();

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function setValue(id, value) {

  const element =
    document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function number(value) {

  return Number(value || 0)
    .toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 2
      }
    );
}
