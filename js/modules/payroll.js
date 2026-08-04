document.addEventListener("DOMContentLoaded", () => {

  const PAYROLL_KEY = "self_hrms_payroll";
  const EMPLOYEE_KEY = "self_hrms_employees";
  const ATTENDANCE_KEY = "self_hrms_attendance";

  const $ = id => document.getElementById(id);

  const form = $("payrollForm");
  const recordId = $("recordId");
  const payrollMonth = $("payrollMonth");
  const employee = $("employee");
  const monthlySalary = $("monthlySalary");
  const salaryDivisor = $("salaryDivisor");

  const presentDays = $("presentDays");
  const halfDays = $("halfDays");
  const paidLeave = $("paidLeave");
  const unpaidLeave = $("unpaidLeave");
  const absentDays = $("absentDays");
  const weeklyOff = $("weeklyOff");
  const holidayDays = $("holidayDays");
  const paidDays = $("paidDays");

  const otHours = $("otHours");
  const otRate = $("otRate");
  const otAmount = $("otAmount");

  const perDaySalary = $("perDaySalary");
  const attendanceSalary = $("attendanceSalary");
  const otherEarnings = $("otherEarnings");
  const bonus = $("bonus");
  const grossEarnings = $("grossEarnings");

  const pfDeduction = $("pfDeduction");
  const esiDeduction = $("esiDeduction");
  const advanceDeduction = $("advanceDeduction");
  const otherDeduction = $("otherDeduction");
  const totalDeduction = $("totalDeduction");

  const netSalary = $("netSalary");
  const payrollStatus = $("payrollStatus");
  const remarks = $("remarks");

  const calculateBtn = $("calculateBtn");
  const saveBtn = $("saveBtn");
  const cancelBtn = $("cancelBtn");
  const message = $("message");
  const search = $("payrollSearch");
  const table = $("payrollTable");


  function getData(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  }


  function saveData(data) {
    localStorage.setItem(
      PAYROLL_KEY,
      JSON.stringify(data)
    );
  }


  function uid() {
    if (crypto?.randomUUID) {
      return crypto.randomUUID();
    }

    return Date.now().toString(36) +
      Math.random().toString(36).slice(2);
  }


  function num(value) {
    return Number(value) || 0;
  }


  function money(value) {
    return Math.round(
      (num(value) + Number.EPSILON) * 100
    ) / 100;
  }


  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  function getEmployees() {
    let data = getData(EMPLOYEE_KEY);

    if (!data.length) {
      data = getData("employees");
    }

    return data;
  }


  function getEmployee(id) {
    return getEmployees().find(
      item => String(item.id) === String(id)
    );
  }


  function employeeName(id) {
    const item = getEmployee(id);

    if (!item) return "-";

    return `${item.code || ""} - ${item.name || ""}`;
  }


  function loadEmployees(selected = "") {

    employee.innerHTML =
      '<option value="">Select Employee</option>';

    getEmployees()
      .filter(item => item.status !== "Inactive")
      .forEach(item => {

        const option =
          document.createElement("option");

        option.value = item.id;

        option.textContent =
          `${item.code || ""} - ${item.name || ""}`;

        employee.appendChild(option);
      });

    employee.value = selected;
  }


  function setCurrentMonth() {

    const now = new Date();

    payrollMonth.value =
      `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}`;
  }


  function clearSummary() {

    [
      presentDays,
      halfDays,
      paidLeave,
      unpaidLeave,
      absentDays,
      weeklyOff,
      holidayDays,
      paidDays,
      otHours,
      otAmount,
      perDaySalary,
      attendanceSalary,
      grossEarnings,
      totalDeduction,
      netSalary
    ].forEach(field => {
      field.value = "0";
    });
  }


  function loadEmployeeSalary() {

    const item =
      getEmployee(employee.value);

    monthlySalary.value =
      item ? num(item.monthlySalary) : 0;

    clearSummary();
  }


  function attendanceSummary() {

    const month = payrollMonth.value;
    const employeeId = employee.value;

    const summary = {
      P: 0,
      A: 0,
      HD: 0,
      PL: 0,
      UL: 0,
      WO: 0,
      H: 0,
      OT: 0
    };


    if (!month || !employeeId) {
      return summary;
    }


    getData(ATTENDANCE_KEY)
      .filter(item =>
        String(item.employee) ===
          String(employeeId) &&
        String(item.date || "").startsWith(month)
      )
      .forEach(item => {

        if (
          Object.prototype.hasOwnProperty.call(
            summary,
            item.status
          )
        ) {
          summary[item.status] += 1;
        }

        /*
          OT comes directly from the manually
          entered Attendance OT Hours.
        */
        summary.OT += num(item.otHours);
      });


    return summary;
  }


  function calculatePayroll() {

    if (!payrollMonth.value) {
      message.textContent =
        "Please select Payroll Month.";
      return false;
    }

    if (!employee.value) {
      message.textContent =
        "Please select Employee.";
      return false;
    }


    const divisor =
      num(salaryDivisor.value);

    if (divisor <= 0) {
      message.textContent =
        "Salary Divisor must be greater than zero.";
      return false;
    }


    const salary =
      num(monthlySalary.value);

    const summary =
      attendanceSummary();


    presentDays.value = summary.P;
    halfDays.value = summary.HD;
    paidLeave.value = summary.PL;
    unpaidLeave.value = summary.UL;
    absentDays.value = summary.A;
    weeklyOff.value = summary.WO;
    holidayDays.value = summary.H;

    otHours.value =
      money(summary.OT);


    /*
      Payroll rule:
      P  = 1 paid day
      HD = 0.5 paid day
      PL = 1 paid day
      WO = 1 paid day
      H  = 1 paid day

      A and UL are not paid.
    */
    const payableDays =
      summary.P +
      (summary.HD * 0.5) +
      summary.PL +
      summary.WO +
      summary.H;


    paidDays.value =
      money(payableDays);


    const dayRate =
      salary / divisor;

    perDaySalary.value =
      money(dayRate);


    /*
      Salary is capped at the configured
      monthly salary so excess paid days
      cannot increase base monthly salary.
    */
    const baseAttendanceSalary =
      Math.min(
        salary,
        dayRate * payableDays
      );


    attendanceSalary.value =
      money(baseAttendanceSalary);


    const calculatedOT =
      summary.OT * num(otRate.value);

    otAmount.value =
      money(calculatedOT);


    const gross =
      baseAttendanceSalary +
      calculatedOT +
      num(otherEarnings.value) +
      num(bonus.value);


    grossEarnings.value =
      money(gross);


    const deductions =
      num(pfDeduction.value) +
      num(esiDeduction.value) +
      num(advanceDeduction.value) +
      num(otherDeduction.value);


    totalDeduction.value =
      money(deductions);


    netSalary.value =
      money(
        Math.max(0, gross - deductions)
      );


    message.textContent =
      "Payroll calculated successfully.";

    return true;
  }


  function resetForm() {

    form.reset();

    recordId.value = "";

    setCurrentMonth();

    salaryDivisor.value = "26";

    otRate.value = "0";
    otherEarnings.value = "0";
    bonus.value = "0";

    pfDeduction.value = "0";
    esiDeduction.value = "0";
    advanceDeduction.value = "0";
    otherDeduction.value = "0";

    payrollStatus.value = "Draft";

    monthlySalary.value = "0";

    clearSummary();

    loadEmployees();

    saveBtn.textContent =
      "Save Payroll";

    message.textContent = "";
  }


  function renderPayroll() {

    const query =
      search.value.trim().toLowerCase();

    const records =
      getData(PAYROLL_KEY)
        .filter(item => {

          return [
            item.month,
            employeeName(item.employee),
            item.status
          ]
            .join(" ")
            .toLowerCase()
            .includes(query);
        })
        .sort(
          (a, b) =>
            String(b.month)
              .localeCompare(String(a.month))
        );


    table.innerHTML = "";


    if (!records.length) {

      table.innerHTML = `
        <tr>
          <td colspan="9" style="text-align:center;">
            No payroll records found.
          </td>
        </tr>
      `;

      return;
    }


    records.forEach(item => {

      const row =
        document.createElement("tr");

      row.innerHTML = `

        <td>${escapeHTML(item.month)}</td>

        <td>
          ${escapeHTML(
            employeeName(item.employee)
          )}
        </td>

        <td>${escapeHTML(item.paidDays)}</td>

        <td>${escapeHTML(item.otHours)}</td>

        <td>${escapeHTML(item.grossEarnings)}</td>

        <td>${escapeHTML(item.totalDeduction)}</td>

        <td>${escapeHTML(item.netSalary)}</td>

        <td>${escapeHTML(item.status)}</td>

        <td>

          <button
            type="button"
            class="btn btn-secondary"
            data-action="edit"
            data-id="${escapeHTML(item.id)}"
          >
            Edit
          </button>

          <button
            type="button"
            class="btn btn-danger"
            data-action="delete"
            data-id="${escapeHTML(item.id)}"
          >
            Delete
          </button>

        </td>
      `;

      table.appendChild(row);
    });
  }


  calculateBtn.addEventListener(
    "click",
    calculatePayroll
  );


  employee.addEventListener(
    "change",
    loadEmployeeSalary
  );


  payrollMonth.addEventListener(
    "change",
    clearSummary
  );


  [
    salaryDivisor,
    otRate,
    otherEarnings,
    bonus,
    pfDeduction,
    esiDeduction,
    advanceDeduction,
    otherDeduction
  ].forEach(field => {

    field.addEventListener(
      "input",
      () => {
        if (employee.value && payrollMonth.value) {
          calculatePayroll();
        }
      }
    );

  });


  form.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      if (!calculatePayroll()) {
        return;
      }


      const records =
        getData(PAYROLL_KEY);

      const editingId =
        recordId.value;


      const duplicate =
        records.some(item =>

          item.month === payrollMonth.value &&

          String(item.employee) ===
            String(employee.value) &&

          String(item.id) !==
            String(editingId)

        );


      if (duplicate) {

        message.textContent =
          "Payroll already exists for this employee and month.";

        return;
      }


      const oldRecord =
        records.find(
          item =>
            String(item.id) ===
            String(editingId)
        );


      const data = {

        id:
          editingId || uid(),

        month:
          payrollMonth.value,

        employee:
          employee.value,

        monthlySalary:
          num(monthlySalary.value),

        salaryDivisor:
          num(salaryDivisor.value),

        presentDays:
          num(presentDays.value),

        halfDays:
          num(halfDays.value),

        paidLeave:
          num(paidLeave.value),

        unpaidLeave:
          num(unpaidLeave.value),

        absentDays:
          num(absentDays.value),

        weeklyOff:
          num(weeklyOff.value),

        holidayDays:
          num(holidayDays.value),

        paidDays:
          num(paidDays.value),

        otHours:
          num(otHours.value),

        otRate:
          num(otRate.value),

        otAmount:
          num(otAmount.value),

        perDaySalary:
          num(perDaySalary.value),

        attendanceSalary:
          num(attendanceSalary.value),

        otherEarnings:
          num(otherEarnings.value),

        bonus:
          num(bonus.value),

        grossEarnings:
          num(grossEarnings.value),

        pfDeduction:
          num(pfDeduction.value),

        esiDeduction:
          num(esiDeduction.value),

        advanceDeduction:
          num(advanceDeduction.value),

        otherDeduction:
          num(otherDeduction.value),

        totalDeduction:
          num(totalDeduction.value),

        netSalary:
          num(netSalary.value),

        status:
          payrollStatus.value,

        remarks:
          remarks.value.trim(),

        createdAt:
          oldRecord?.createdAt ||
          new Date().toISOString(),

        updatedAt:
          new Date().toISOString()
      };


      if (editingId) {

        const index =
          records.findIndex(
            item =>
              String(item.id) ===
              String(editingId)
          );

        if (index !== -1) {
          records[index] = data;
        }

        message.textContent =
          "Payroll updated successfully.";

      } else {

        records.push(data);

        message.textContent =
          "Payroll saved successfully.";
      }


      saveData(records);

      renderPayroll();


      setTimeout(
        resetForm,
        700
      );

    }
  );


  table.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "button[data-action]"
        );

      if (!button) return;


      const records =
        getData(PAYROLL_KEY);

      const item =
        records.find(
          record =>
            String(record.id) ===
            String(button.dataset.id)
        );

      if (!item) return;


      if (button.dataset.action === "delete") {

        if (
          !confirm(
            `Delete payroll for ${employeeName(item.employee)} - ${item.month}?`
          )
        ) {
          return;
        }


        saveData(
          records.filter(
            record =>
              String(record.id) !==
              String(item.id)
          )
        );

        renderPayroll();

        return;
      }


      if (button.dataset.action === "edit") {

        recordId.value = item.id;
        payrollMonth.value = item.month;

        loadEmployees(item.employee);

        monthlySalary.value =
          item.monthlySalary;

        salaryDivisor.value =
          item.salaryDivisor || 26;

        presentDays.value = item.presentDays;
        halfDays.value = item.halfDays;
        paidLeave.value = item.paidLeave;
        unpaidLeave.value = item.unpaidLeave;
        absentDays.value = item.absentDays;
        weeklyOff.value = item.weeklyOff;
        holidayDays.value = item.holidayDays;
        paidDays.value = item.paidDays;

        otHours.value = item.otHours;
        otRate.value = item.otRate;
        otAmount.value = item.otAmount;

        perDaySalary.value =
          item.perDaySalary;

        attendanceSalary.value =
          item.attendanceSalary;

        otherEarnings.value =
          item.otherEarnings;

        bonus.value =
          item.bonus;

        grossEarnings.value =
          item.grossEarnings;

        pfDeduction.value =
          item.pfDeduction;

        esiDeduction.value =
          item.esiDeduction;

        advanceDeduction.value =
          item.advanceDeduction;

        otherDeduction.value =
          item.otherDeduction;

        totalDeduction.value =
          item.totalDeduction;

        netSalary.value =
          item.netSalary;

        payrollStatus.value =
          item.status || "Draft";

        remarks.value =
          item.remarks || "";

        saveBtn.textContent =
          "Update Payroll";

        message.textContent =
          "Editing Payroll.";

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      }

    }
  );


  search.addEventListener(
    "input",
    renderPayroll
  );


  cancelBtn.addEventListener(
    "click",
    resetForm
  );


  loadEmployees();
  setCurrentMonth();
  clearSummary();
  renderPayroll();

});
