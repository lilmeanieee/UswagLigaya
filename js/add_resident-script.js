let isAddingMember = false;
//ethnicity
const ipRadio = document.getElementById("ipHousehold");
const nonIpRadio = document.getElementById("nonIpHousehold");
const tribeContainer = document.getElementById("tribeContainer");

function toggleTribeInput() {
    if (ipRadio.checked) {
        tribeContainer.style.display = "block";
    } else {
        tribeContainer.style.display = "none";
        document.getElementById("tribeInput").value = ""; // clear value if hidden
    }
}

ipRadio.addEventListener("change", toggleTribeInput);
nonIpRadio.addEventListener("change", toggleTribeInput);


// socioeconomic status
const nhts_4psRadio = document.getElementById("NHTS4ps");
const nhts_Non4psRadio = document.getElementById("NHTS_Non-4ps");
const nonNhtsRadio = document.getElementById("Non-NHTS");
const nhtsContainer = document.getElementById("nhtsContainer");

function toggleNHTSInput() {
    if (nhts_4psRadio.checked|| nhts_Non4psRadio.checked) {
        nhtsContainer.style.display = "block";
    } else {
        nhtsContainer.style.display = "none";
        document.getElementById("nhtsInput").value = ""; // clear value if hidden
    }
}

nhts_4psRadio.addEventListener("change", toggleNHTSInput);
nhts_Non4psRadio.addEventListener("change", toggleNHTSInput);
nonNhtsRadio.addEventListener("change", toggleNHTSInput);



function toggleOtherInput(selectElement) {
    const otherContainer = document.getElementById("otherWaterSourceContainer");
    const otherInput = document.getElementById("otherWaterSourceInput");

    if (selectElement.value === "Others") {
        otherContainer.style.display = "block";
    } else {
        otherContainer.style.display = "none";
        otherInput.value = ""; // optional: clear input when hidden
    }
}
function toISODateFormat(dateString) {
    const parts = dateString.split("/");
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return dateString;
}

function sendToAddResidents(fullData) {
    // Send POST request
fetch("/php-handlers/add-residents.php", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify(fullData)
})
.then(response => response.text())
.then(text => {
    console.log("Raw response:", text);
    if (!text || text.trim() === "") {
        throw new Error("Empty response from server.");
    }

    let data;
    try {
        data = JSON.parse(text);
    } catch (err) {
        console.error("Server returned invalid JSON:\n", text);
        throw new Error("Failed to parse server response.");
    }

    if (data.success && data.accounts?.length) {
        // ✅ Build table HTML
        let html = `<table class="table table-bordered">
                        <thead class="table-light">
                            <tr>
                                <th>Resident ID</th>
                                <th>Full Name</th>
                                <th>Email</th>
                                <th>Password</th>
                            </tr>
                        </thead>
                        <tbody>`;
        data.accounts.forEach(acc => {
            html += `
                <tr>
                    <td>${acc.residentCode}</td>
                    <td>${acc.fullName}</td>
                    <td>${acc.email}</td>
                    <td>${acc.password}</td>
                </tr>`;
        });
        html += `</tbody></table>`;

        // ✅ Show modal
        document.getElementById("accountInfoContent").innerHTML = html;
        const modal = new bootstrap.Modal(document.getElementById('accountInfoModal'));
        modal.show();

        localStorage.setItem("newResidentAdded", JSON.stringify(data.accounts));
        
        fetch("/php-handlers/fetch-residents.php")
        .then(res => res.json())
        .then(data => {
            if (data.residents) {
                renderResidents(data.residents); // Call your rendering logic again
            }
        });

        document.getElementById("closeModalBtn").addEventListener("click", () => {
            const confirmModal = new bootstrap.Modal(document.getElementById('confirmResetModal'));
            confirmModal.show();
        });

        document.getElementById("confirmResetBtn").addEventListener("click", () => {
            // Close both modals just in case
            bootstrap.Modal.getInstance(document.getElementById('confirmResetModal'))?.hide();
            bootstrap.Modal.getInstance(document.getElementById('accountInfoModal'))?.hide();
        
            // Remove any lingering backdrops
            document.querySelectorAll(".modal-backdrop").forEach(el => el.remove());
        
            // Redirect to form page to reset everything
            window.location.href = "household_profiling.html";
        });
        
        // Handle "Not Yet" button
        document.querySelector("#confirmResetModal .btn-secondary").addEventListener("click", () => {
            const confirmModal = bootstrap.Modal.getInstance(document.getElementById("confirmResetModal"));
            confirmModal.hide();
        
            // Show account info modal again safely
            setTimeout(() => {
                const accountModal = bootstrap.Modal.getOrCreateInstance(document.getElementById("accountInfoModal"));
                accountModal.show();
            }, 300); // allow fade-out transition
        });
        
        // Prevent closing via X button (shake and beep instead)
        document.querySelectorAll('.btn-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const modal = btn.closest('.modal');
                if (modal.classList.contains("show")) {
                    emphasizeModal(modal.id);
                }
            });
        });
        
        // Prevent closing by clicking outside
        document.querySelectorAll('.modal').forEach(modalEl => {
            modalEl.addEventListener('click', (e) => {
                if (e.target.classList.contains("modal")) {
                    emphasizeModal(modalEl.id);
                }
            });
        });
        
    } else {
        alert("Data submitted, but no account info returned.");
    }
})
}

document.getElementById("btn_submit").addEventListener("click", function (e) {
    e.preventDefault();
    if (!validateHouseholdForm()) return;

    const household = {
        purok: document.getElementById("purok").value,
        barangay: document.getElementById("barangay").value,
        householdNo: document.getElementById("householdNo").value,
        city: document.getElementById("city/district").value,
        province: document.getElementById("province").value
    };

    const fullData = gatherFullFormData();
    const memberOnlyCheck = {
        members: fullData.members.map(m => ({
            lastName: m.lastName,
            firstName: m.firstName,
            middleName: m.middleName,
            birthdate: m.birthdate,
            sex: m.sex.split(" ")[0] // Normalize
        }))
    };

    fetch("/php-handlers/check-duplicates.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ household })
    })
    .then(res => res.json())
    .then(data => {
        if (data.householdExists) {
            
            const modal = new bootstrap.Modal(document.getElementById("householdExistsModal"));
            modal.show();

            document.getElementById("btnAddMemberOnly").onclick = () => {
                modal.hide();

              isAddingMember = true;
            const d = data.householdData;
            const lock = (id, value) => {
                const el = document.getElementById(id);
                if (el) {
                    el.value = value || "";
                    el.readOnly = true;
                    el.disabled = true;
                }
            };
            document.querySelectorAll('input[name="ipStatus"]').forEach(rb => rb.disabled = true);
            document.querySelectorAll('input[name="SocioeconomicStatus"]').forEach(rb => rb.disabled = true);

            lock("purok", d.purok);
            lock("barangay", d.barangay);
            lock("householdNo", d.household_no);
            lock("city/district", d.city);
            lock("province", d.province);
            lock("nhtsInput", d.nhtsNo);
            lock("waterSource", d.waterSource);
            lock("toiletFacility", d.toilet);
            lock("tribeInput", d.tribe);
            if (d.waterSource === "Others") {
                document.getElementById("otherWaterSourceContainer").style.display = "block";
                lock("otherWaterSourceInput", d.otherWater);
            }

            // Check member duplication
            fetch("/php-handlers/check-member-duplicate.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(memberOnlyCheck)
            })
            .then(res => res.json())
            .then(result => {
                if (result.matchingMembers && result.matchingMembers.length > 0) {
                    const modal = new bootstrap.Modal(document.getElementById("memberExistsModal"));
                    modal.show();
                    document.getElementById("memberExistsOkayBtn").onclick = () => {
                        window.location.href = "/html/admin/manage_residents/household_profiling.html";
                    };
                } else {
                    // Proceed to add only members with existing household_id
                    fullData.household.householdId = d.household_id;
                    sendToAddResidents(fullData);
                }
            });
        }
        } else {
            // Household doesn't exist, check members before inserting
            fetch("/php-handlers/check-member-duplicate.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(memberOnlyCheck)
            })
            .then(res => res.json())
            .then(result => {
                if (result.matchingMembers && result.matchingMembers.length > 0) {
                    const modal = new bootstrap.Modal(document.getElementById("memberExistsModal"));
                    modal.show();
                    document.getElementById("memberExistsOkayBtn").onclick = () => modal.hide();
                } else {
                    // Insert full new household + members
                    sendToAddResidents(fullData);
                }
            });
        }
    })
    .catch(err => {
        console.error("❌ Error during submission check:", err);
        alert("Submission failed. Please try again.");
    });
});

        
  



// Gather all data from the form    
function gatherFullFormData() {
    const household = {
        purok: document.getElementById("purok").value,
        barangay: document.getElementById("barangay").value,
        householdNo: document.getElementById("householdNo").value,
        city: document.getElementById("city/district").value,
        province: document.getElementById("province").value,
        ethnicity: document.querySelector('input[name="ipStatus"]:checked')?.value || "",
        tribe: document.getElementById("tribeInput").value,
        socioStatus: document.querySelector('input[name="SocioeconomicStatus"]:checked')?.value || "",
        nhtsNo: document.getElementById("nhtsInput").value,
        waterSource: document.getElementById("waterSource").value,
        otherWater: document.getElementById("otherWaterSourceInput").value,
        toilet: document.getElementById("toiletFacility").value
    };

    const members = [];
    const rows = document.querySelectorAll(".member-row");

    rows.forEach((row, i) => {
        const idx = i + 1;
        const getValue = (id) => document.getElementById(`${id}_${idx}`)?.value || "";

        const member = {
            lastName: getValue("lastName"),
            firstName: getValue("firstName"),
            middleName: getValue("middleName"),
            suffix: getValue("suffix"),
            relationship: getValue("relationship"),
            sex: getValue("sex"),
            birthdate: getValue("birthdate"),
            civilStatus: getValue("civilStatus"),
            philhealthId: getValue("philhealthId"),
            membership: getValue("membership"),
            category: getValue("category"),
            medicalHistory: getValue("medicalHistory"),
            usingFp: getValue("usingFp"),
            fpStatus: getValue("fpStatus"),
            education: getValue("education"),
            religion: getValue("religion"),
            remarks: getValue("remarks"),
            quarters: [],
            fpMethods: Array.from(document.querySelectorAll(`#fpDropdown_${idx} ~ .dropdown-menu input[type="checkbox"]:checked`)).map(cb => cb.value)
        };

        for (let q = 1; q <= 4; q++) {
            member.quarters.push({
                age: getValue(`ageQ${q}`),
                class: getValue(`classQ${q}`)
            });
        }

        if (member.lastName && member.firstName) {
            members.push(member);
        }
    });

    return {
        household,
        members
    };
}


//print the account info
function printAccountInfo() {
    const printContent = document.getElementById("accountInfoContent").innerHTML;

    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
        <html>
        <head>
            <title>Resident Account Information</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                }
                h2 {
                    text-align: center;
                    color: green;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                th, td {
                    border: 1px solid #333;
                    padding: 8px;
                    text-align: center;
                }
                th {
                    background-color: #f2f2f2;
                }
            </style>
        </head>
        <body>
            <h2>Resident Account Information</h2>
            ${printContent}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
}

function emphasizeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    // Add shake animation
    modal.classList.add("shake");

    // Remove it after animation ends
    setTimeout(() => {
        modal.classList.remove("shake");
    }, 400);

}

function validateHouseholdForm() {
    let isValid = true;
    const errors = [];

    // Helper to highlight or clear error styling
    function markInvalid(el) {
        if (el) el.classList.add("is-invalid");
    }

    function clearInvalids() {
        document.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));
    }

    clearInvalids(); // reset styles first

    const purok = document.getElementById("purok");
    const householdNo = document.getElementById("householdNo");

    if (!purok.value.trim()) {
        isValid = false;
        errors.push("Purok is required.");
        markInvalid(purok);
    }

    if (!householdNo.value.trim()) {
        isValid = false;
        errors.push("Household Number is required.");
        markInvalid(householdNo);
    }

    // 1. Ethnicity
    const ethnicity = document.querySelector('input[name="ipStatus"]:checked');
    const tribeInput = document.getElementById("tribeInput");
    if (!ethnicity) {
        isValid = false;
        errors.push("Please select Ethnicity.");
        document.querySelectorAll('input[name="ipStatus"]').forEach(markInvalid);
    } else if (ethnicity.value === "IP" && tribeInput.value.trim() === "") {
        isValid = false;
        errors.push("Please specify Tribe for IP Household.");
        markInvalid(tribeInput);
    }

    // 2. Socioeconomic Status
    const socio = document.querySelector('input[name="SocioeconomicStatus"]:checked');
    const nhtsInput = document.getElementById("nhtsInput");
    if (!socio) {
        isValid = false;
        errors.push("Please select a Socioeconomic Status.");
        document.querySelectorAll('input[name="SocioeconomicStatus"]').forEach(markInvalid);
    } else if ((socio.id === "NHTS4ps" || socio.id === "NHTS_Non-4ps") && nhtsInput.value.trim() === "") {
        isValid = false;
        errors.push("Please provide NHTS number.");
        markInvalid(nhtsInput);
    }

    // 3. Environmental Health
    const waterSource = document.getElementById("waterSource");
    const otherWater = document.getElementById("otherWaterSourceInput");
    const toilet = document.getElementById("toiletFacility");

    if (!waterSource.value) {
        isValid = false;
        errors.push("Please select Water Source.");
        markInvalid(waterSource);
    } else if (waterSource.value === "Others" && otherWater.value.trim() === "") {
        isValid = false;
        errors.push("Please specify Other Water Source.");
        markInvalid(otherWater);
    }

    if (!toilet.value) {
        isValid = false;
        errors.push("Please select a Toilet Facility Type.");
        markInvalid(toilet);
    }

    // 4. Household Members
    const rows = document.querySelectorAll(".member-row");
    rows.forEach((row, i) => {
        const idx = i + 1;
        const get = id => document.getElementById(`${id}_${idx}`);
        const getVal = id => get(id)?.value.trim();

        const requiredFields = ["lastName", "firstName", "relationship", "sex", "birthdate", "civilStatus", "education", "religion"];
        requiredFields.forEach(field => {
            if (!getVal(field)) {
                isValid = false;
                errors.push(`Row ${idx}: ${field.replace(/([A-Z])/g, ' $1')} is required.`);
                markInvalid(get(field));
            }
        });

        // PhilHealth logic
        const philhealthId = getVal("philhealthId");
        const membership = getVal("membership");
        const category = getVal("category");
        const anyPhilhealth = philhealthId || membership || category;

        if (anyPhilhealth && (!philhealthId || !membership || !category)) {
            isValid = false;
            errors.push(`Row ${idx}: All PhilHealth fields are required if one is filled.`);
            if (!philhealthId) markInvalid(get("philhealthId"));
            if (!membership) markInvalid(get("membership"));
            if (!category) markInvalid(get("category"));
        }

        // WRA logic
        const usingFp = getVal("usingFp");
        const fpStatus = getVal("fpStatus");
        const fpMethods = Array.from(document.querySelectorAll(`#fpDropdown_${idx} ~ .dropdown-menu input[type="checkbox"]:checked`)).map(cb => cb.value);

        if (!usingFp) {
            isValid = false;
            errors.push(`Row ${idx}: 'Using any FP Method?' is required.`);
            markInvalid(get("usingFp"));
        } else if (usingFp === "Y") {
            if (fpMethods.length === 0) {
                isValid = false;
                errors.push(`Row ${idx}: Please select at least one FP Method.`);
                document.querySelector(`#fpDropdown_${idx}`)?.classList.add("is-invalid");
            }
            if (!fpStatus) {
                isValid = false;
                errors.push(`Row ${idx}: FP Status is required.`);
                markInvalid(get("fpStatus"));
            }
        }
    });

    if (!isValid) {
        
        
        // Scroll to first invalid field
        const firstInvalid = document.querySelector(".is-invalid");
        if (firstInvalid) {
            firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
            firstInvalid.focus({ preventScroll: true });
        }
    }
    
    return isValid;
}

function enableLiveValidation() {
    // Remove .is-invalid when user types or selects something
    document.querySelectorAll("input, select, textarea").forEach(el => {
        el.addEventListener("input", () => {
            if (el.classList.contains("is-invalid")) {
                el.classList.remove("is-invalid");
            }
        });

        // Also handle radio buttons and checkboxes specifically
        el.addEventListener("change", () => {
            if (el.classList.contains("is-invalid")) {
                el.classList.remove("is-invalid");
            }

            // For grouped radios: remove all red borders in group
            if (el.type === "radio" || el.type === "checkbox") {
                const groupName = el.name;
                document.querySelectorAll(`input[name="${groupName}"]`).forEach(rb => {
                    rb.classList.remove("is-invalid");
                });
            }
        });
    });
}

// Call this once on page load
enableLiveValidation();
window.toggleOtherInput = toggleOtherInput;