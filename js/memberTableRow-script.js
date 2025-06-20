
document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById('memberTableBody');

    function createMemberRow(index) {
        const tr = document.createElement("tr");
        tr.classList.add("member-row");
    
        tr.innerHTML = `
            <td>${index}</td>
            <td><input class="form-control" id="lastName_${index}" placeholder="Last Name" /></td>
            <td><input class="form-control" id="firstName_${index}" placeholder="First Name" /></td>
            <td><input class="form-control" id="middleName_${index}" placeholder="Middle Name" /></td>
            <td><input class="form-control" id="suffix_${index}" placeholder="Suffix" /></td>
            <td>
                <select class="form-select" id="relationship_${index}">
                    <option value="" disabled selected>Select</option>
                    <option value="1">1 - Head</option>
                    <option value="2">2 - Spouse</option>
                    <option value="3">3 - Son</option>
                    <option value="4">4 - Daughter</option>
                    <option value="5">5 - Others (specify)</option>
                </select>
            </td>
            <td>
                <select class="form-select" id="sex_${index}">
                    <option value="" disabled selected>Select</option>
                    <option>F - Female</option>
                    <option>M - Male</option>
                </select>
            </td>
            <td><input class="form-control" id="birthdate_${index}" type="date" placeholder="Birthdate" /></td>
            <td>
                <select class="form-select" id="civilStatus_${index}">
                    <option value="" disabled selected>Select</option>
                    <option>S - Single</option>
                    <option>M - Married</option>
                    <option>W - Widower</option>
                    <option>SP - Separated</option>
                    <option>C - Cohabitation</option>
                </select>
            </td>
            <td><input class="form-control" id="philhealthId_${index}" placeholder="PhilHealth ID" /></td>
            <td>
                <select class="form-select" id="membership_${index}">
                    <option value="" disabled selected>Select</option>
                    <option>M - Member</option>
                    <option>D - Dependent</option>
                </select>
            </td>
            <td>
                <select class="form-select" id="category_${index}">
                    <option value="" disabled selected>Select</option>
                    <option>HPH - Hypertension</option>
                    <option>D - Diabetes</option>
                    <option>TB - Tuberculosis</option>
                    <option>S - Surgery</option>
                </select>
            </td>
            <td>
                <select class="form-select" id="medicalHistory_${index}">
                    <option value="" disabled selected>Select</option>
                    <option>HPH - Hypertension</option>
                    <option>D - Diabetes</option>
                    <option>TB - Tuberculosis</option>
                    <option>S - Surgery</option>
                </select>
            </td>
            <td>
                <select class="form-select" id="usingFp_${index}">
                    <option value="" disabled selected>Select</option>
                    <option>Y - Yes</option>
                    <option>N - No</option>
                </select>
            </td>
            <td>
                <div class="dropdown dropup">
                    <button class="btn btn-outline-secondary dropdown-toggle w-100" type="button"
                        id="fpDropdown_${index}" data-bs-toggle="dropdown" aria-expanded="false">Select FP Method(s)</button>
                    <ul class="dropdown-menu p-2 dropdown-menu-scrollable">
                        ${['COC','POP','Injectable','Condom','LAM','BT2','Implant','BOM','DPT','Withdrawal','Others'].map(method => `
                            <li>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" value="${method}" id="fp${method}_${index}">
                                    <label class="form-check-label" for="fp${method}_${index}">${method}</label>
                                </div>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </td>
            <td>
                <select class="form-select" id="fpStatus_${index}">
                    <option value="" disabled selected>Select</option>
                    <option>NA - New Acceptor</option>
                    <option>CU - Current User</option>
                    <option>CM - Changing Method</option>
                    <option>CC - Changing Clinic</option>
                    <option>DP - Drop Out</option>
                    <option>R - Restarter</option>
                </select>
            </td>
            ${[1, 2, 3, 4].map(q => `
                <td><input class="form-control" id="ageQ${q}_${index}" placeholder="Age Q${q}" /></td>
                <td><input class="form-control" id="classQ${q}_${index}" placeholder="Class Q${q}" /></td>
            `).join('')}
            <td>
                <select class="form-select" id="education_${index}">
                    <option value="" disabled selected>Select</option>
                    <option>N - None</option>
                    <option>K - Kinder</option>
                    <option>ES - Elementary Student</option>
                    <option>EU - Elementary Undergraduate</option>
                    <option>EG - Elementary Graduate</option>
                    <option>HS - High School Student</option>
                    <option>HU - High School Undergraduate</option>
                    <option>HG - High School Graduate</option>
                    <option>V - Vocational Course</option>
                    <option>CS - College Student</option>
                    <option>CU - College Undergraduate</option>
                    <option>CG - College Graduate</option>
                    <option>PQ - Postgraduate</option>
                </select>
            </td>
            <td>
                <select class="form-select" id="religion_${index}">
                    <option value="" disabled selected>Select</option>
                    <option>Roman Catholic</option>
                    <option>Christian</option>
                    <option>INC</option>
                    <option>Catholic</option>
                    <option>Islam</option>
                    <option>Baptist</option>
                    <option>Born Again</option>
                    <option>Buddhism</option>
                    <option>Church of God</option>
                    <option>Jehovah's Witness</option>
                    <option>Protestant</option>
                    <option>Seventh Day Adventist</option>
                    <option>LDS - Mormons</option>
                    <option>Evangelical</option>
                    <option>Pentecostal</option>
                    <option>Unknown</option>
                    <option>Other</option>
                </select>
            </td>
            <td><input class="form-control" id="remarks_${index}" placeholder="Remarks" /></td>
        `;
    
        Array.from(tr.querySelectorAll("input, select")).forEach(el => {
            el.addEventListener("input", () => {
                el.classList.remove("is-invalid");
            });
        
            el.addEventListener("change", () => {
                el.classList.remove("is-invalid");
        
                // Also clear is-invalid from grouped radio buttons
                if (el.type === "radio" || el.type === "checkbox") {
                    const group = document.querySelectorAll(`input[name="${el.name}"]`);
                    group.forEach(rb => rb.classList.remove("is-invalid"));
                }
            });
        });
    
        return tr;
    }
    

   // ✅ This function adds a new row manually
   function addNewMemberRow() {
    const currentRows = document.querySelectorAll(".member-row");
    const newIndex = currentRows.length + 1;
    const newRow = createMemberRow(newIndex);
    tbody.appendChild(newRow);

    
}

// ✅ Pressing Enter inside the last row adds a new one
document.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        const active = document.activeElement;
        const allRows = document.querySelectorAll(".member-row");

        if (active && active.closest(".member-row") === allRows[allRows.length - 1]) {
            e.preventDefault();
            addNewMemberRow();
        }
    }
});

// ✅ Render the initial 1 row
const row = createMemberRow(1);
tbody.appendChild(row);
});