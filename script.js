const components = {
    TEXT: "TEXT",
    EMAIL: "EMAIL",
    NUMBER: "NUMBER",
    TEXTAREA: "TEXTAREA",
    RADIO: "RADIO",
    CHECKBOX: "CHECKBOX",
    SELECT: "SELECT",
    SUBMIT: "SUBMIT"
};
const componentsEnum = Object.freeze(components);
function createField(type) {
    const now = new Date().toISOString();
    return {
        id: Date.now(),
        type: type,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        properties: {
            label: getDefaultLabel(type),
            placeholder: "Enter " + getDefaultLabel(type).toLowerCase(),
            options: needsOptions(type) ? ["Option 1", "Option 2", "Option 3"] : [],
            labelStyles: {
                color: "#222222",
                backgroundColor: "#ffffff",
                padding: "2px 4px",
                fontFamily: "inherit",
                fontSize: "14px"
            },
            inputStyles: {
                color: "#222222",
                backgroundColor: "#ffffff",
                padding: "6px 10px",
                fontFamily: "inherit",
                fontSize: "14px",
                borderColor: "#cccccc"
            },
            minValue: type === componentsEnum.NUMBER ? 0 : null,
            maxValue: type === componentsEnum.NUMBER ? 100 : null,
            minChar: null,
            maxChar: null,
            readOnly: false,
            hideOnly: false,
            checkMultiple: false,
            isRequired: true
        }
    };
}

function getDefaultLabel(type) {
    const map = {
        TEXT: "Text Input",
        EMAIL: "Email Input",
        NUMBER: "Number",
        TEXTAREA: "TextArea",
        RADIO: "Radio Group",
        CHECKBOX: "Checkbox Group",
        SELECT: "Select Dropdown",
        SUBMIT: "Submit Form"
    };
    return map[type] || "Field";
}

function needsOptions(type) {
    return type === componentsEnum.RADIO ||
        type === componentsEnum.CHECKBOX ||
        type === componentsEnum.SELECT;
}

function escapeHtml(val) {
    return String(val)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

const urlParams = new URLSearchParams(window.location.search);
const urlFormId = urlParams.get("formId");
const urlIsNew  = urlParams.get("isNew");  

const FORMS_KEY = "forms";
let fieldList = [];
if (urlFormId) {
    try {
        const _forms = JSON.parse(localStorage.getItem(FORMS_KEY)) || [];
        const _thisForm = _forms.find(function (f) { return String(f.id) === String(urlFormId); });
        if (_thisForm) fieldList = _thisForm.components || [];
    } catch (e) { fieldList = []; }
}

let currentEditId = null;

function saveToStorage() {
    const _forms = JSON.parse(localStorage.getItem(FORMS_KEY)) || [];
    const _form  = _forms.find(function (f) { return String(f.id) === String(urlFormId); });
    if (_form) {
        _form.components = fieldList;
        _form.updatedAt  = new Date().toISOString();
    }
    localStorage.setItem(FORMS_KEY, JSON.stringify(_forms));
}
if (urlFormId) {
    try {
        const _forms = JSON.parse(localStorage.getItem(FORMS_KEY)) || [];
        const _form  = _forms.find(function (f) { return String(f.id) === String(urlFormId); });
        if (_form && _form.formName) {
            const inp = document.getElementById("formNameInput");
            if (inp) inp.value = _form.formName;
        }
    } catch (e) {}
}


function openSaveModal() {
    const overlay = document.getElementById("saveNameOverlay");
    const inp = document.getElementById("formNameInput");
    const errEl = document.getElementById("saveNameModalError");
    if (errEl) errEl.textContent = "";
    if (inp) inp.classList.remove("input-error");
    overlay.style.display = "flex";
    setTimeout(function () { if (inp) inp.focus(); }, 80);
}

function closeSaveModal() {
    const overlay = document.getElementById("saveNameOverlay");
    overlay.style.display = "none";
}

function confirmSaveName() {
    const input  = document.getElementById("formNameInput");
    const errEl  = document.getElementById("saveNameModalError");
    const name   = input ? input.value.trim() : "";

    if (!name) {
        errEl.textContent = "Please enter a form name before saving.";
        input.classList.add("input-error");
        input.focus();
        return;
    }

    const _forms = JSON.parse(localStorage.getItem(FORMS_KEY)) || [];
    const _form  = _forms.find(function (f) { return String(f.id) === String(urlFormId); });
    if (_form) {
        _form.formName  = name;
        _form.updatedAt = new Date().toISOString();
        localStorage.setItem(FORMS_KEY, JSON.stringify(_forms));
    }

    window.location.href = "home.html";
}

function saveFormName() { confirmSaveName(); }
const toolbox      = document.getElementById("toolbox");
const builderZone  = document.getElementById("builderZone");
const builderFields = document.getElementById("builderFields");
const modalOverlay = document.getElementById("modalOverlay");

toolbox.addEventListener("dragstart", function (e) {
    e.dataTransfer.setData("fieldType", e.target.getAttribute("data-type"));
});

builderZone.addEventListener("dragover", function (e) {
    e.preventDefault();
    builderZone.classList.add("dragOver");
});

builderZone.addEventListener("dragleave", function () {
    builderZone.classList.remove("dragOver");
});

builderZone.addEventListener("drop", function (e) {
    builderZone.classList.remove("dragOver");
    const droppedType = e.dataTransfer.getData("fieldType");
    if (!droppedType) return;
    const actualType = droppedType === "INPUT" ? "TEXT" : droppedType;
    fieldList.push(createField(actualType));
    saveToStorage();
    renderAllFields();
});


function renderAllFields() {
    builderFields.innerHTML = "";
    for (let i = 0; i < fieldList.length; i++) {
        const field = fieldList[i];
        if (field.deletedAt) continue;

        const card = document.createElement("div");
        card.className = "fieldCard";

        const hideBadge = field.properties.hideOnly
            ? '<span class="badge badge-hide">hidden</span>' : "";
        const roBadge = field.properties.readOnly
            ? '<span class="badge badge-ro">read-only</span>' : "";

        let previewHTML = "";
        if (!field.properties.hideOnly) {
            previewHTML = buildFieldHTML(field);
        } else {
            previewHTML = `<p class="hiddenNote"> </p>`;
        }

        card.innerHTML = `
            <div class="cardHeader">
                <span class="cardTitle">${escapeHtml(field.properties.label)}</span>
                ${hideBadge}${roBadge}
            </div>
            <div class="cardPreview">${previewHTML}</div>`;

        const editBtn = document.createElement("button");
        editBtn.className = "editBtn";
        editBtn.textContent = "Edit";
        editBtn.onclick = function () { openModal(field.id); };

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "deleteBtn";
        deleteBtn.textContent = "Delete";
        deleteBtn.onclick = function () { deleteField(field.id); };

        card.appendChild(editBtn);
        card.appendChild(deleteBtn);
        builderFields.appendChild(card);
    }
}

function buildFieldHTML(field) {
    const p = field.properties;
    const ls = p.labelStyles;
    const is = p.inputStyles;
    const labelStyle =
        `color:${ls.color};` +
        `background-color:${ls.backgroundColor};` +
        `padding:${ls.padding};` +
        `font-family:${ls.fontFamily};` +
        `font-size:${ls.fontSize};`;
    const inputStyle =
        `color:${is.color};` +
        `background-color:${is.backgroundColor};` +
        `padding:${is.padding};` +
        `font-family:${is.fontFamily};` +
        `font-size:${is.fontSize};` +
        `border:1px solid ${is.borderColor};`;
    const labelHTML = `<label style="${labelStyle}">${escapeHtml(p.label)}</label>`;
    const ro = p.readOnly ? "readonly" : "";

    switch (field.type) {
        case componentsEnum.TEXT:
        case componentsEnum.EMAIL: {
            let attrs = `style="${inputStyle}" placeholder="${escapeHtml(p.placeholder)}" ${ro}`;
            if (p.minChar !== null && p.minChar !== "") attrs += ` minlength="${p.minChar}"`;
            if (p.maxChar !== null && p.maxChar !== "") attrs += ` maxlength="${p.maxChar}"`;
            return `${labelHTML}<input type="${field.type.toLowerCase()}" ${attrs} />`;
        }
        case componentsEnum.NUMBER: {
            let attrs = `style="${inputStyle}" placeholder="${escapeHtml(p.placeholder)}" ${ro}`;
            if (p.minValue !== null && p.minValue !== "") attrs += ` min="${p.minValue}"`;
            if (p.maxValue !== null && p.maxValue !== "") attrs += ` max="${p.maxValue}"`;
            return `${labelHTML}<input type="number" ${attrs} />`;
        }
        case componentsEnum.TEXTAREA: {
            let attrs = `style="${inputStyle}resize:vertical;" placeholder="${escapeHtml(p.placeholder)}" ${ro}`;
            if (p.minChar !== null && p.minChar !== "") attrs += ` minlength="${p.minChar}"`;
            if (p.maxChar !== null && p.maxChar !== "") attrs += ` maxlength="${p.maxChar}"`;
            return `${labelHTML}<textarea rows="3" ${attrs}></textarea>`;
        }
        case componentsEnum.SELECT: {
            let html = `${labelHTML}<select style="${inputStyle}" ${ro}>`;
            for (let i = 0; i < p.options.length; i++) {
                html += `<option>${escapeHtml(p.options[i])}</option>`;
            }
            html += "</select>";
            return html;
        }
        case componentsEnum.RADIO: {
            let html = labelHTML;
            for (let i = 0; i < p.options.length; i++) {
                html += `<label class="optionLabel" style="color:${ls.color};font-size:${ls.fontSize};font-family:${ls.fontFamily};">
                    <input type="radio" name="radio_${field.id}" ${ro} /> ${escapeHtml(p.options[i])}</label>`;
            }
            return html;
        }
        case componentsEnum.CHECKBOX: {
            let html = labelHTML;
            for (let i = 0; i < p.options.length; i++) {
                html += `<label class="optionLabel" style="color:${ls.color};font-size:${ls.fontSize};font-family:${ls.fontFamily};">
                    <input type="checkbox" ${ro} /> ${escapeHtml(p.options[i])}</label>`;
            }
            return html;
        }
        case componentsEnum.SUBMIT: {
            return `<button onclick="submitForm()" style="
                background-color:${is.backgroundColor};
                color:${is.color};
                padding:${is.padding};
                font-size:${is.fontSize};
                font-family:${is.fontFamily};
                border:1px solid ${is.borderColor};
                cursor:pointer;
                width:100%;
                border-radius:6px;
                font-weight:700;
            ">${escapeHtml(p.label)}</button>`;
        }
        default:
            return labelHTML;
    }
}

function deleteField(id) {
    const field = fieldList.find(function (f) { return f.id == id; });
    if (!field) return;
    field.deletedAt = new Date().toISOString();
    saveToStorage();
    renderAllFields();
}


function openModal(id) {
    currentEditId = id;
    const field = fieldList.find(function (f) { return f.id == id; });
    if (!field) return;
    const p = field.properties;
    const ls = p.labelStyles;
    const is = p.inputStyles;
    document.getElementById("modalTitle").textContent = "Edit " + field.type;
    document.getElementById("mLabel").value = p.label;
    document.getElementById("mPlaceholder").value = p.placeholder || "";
    document.getElementById("lsColor").value = ls.color || "#222222";
    document.getElementById("lsBg").value = ls.backgroundColor || "#ffffff";
    document.getElementById("lsSize").value = parseInt(ls.fontSize) || 14;
    document.getElementById("lsPadding").value = ls.padding || "";
    document.getElementById("lsFont").value = ls.fontFamily || "inherit";
    document.getElementById("isColor").value = is.color || "#222222";
    document.getElementById("isBg").value = is.backgroundColor || "#ffffff";
    document.getElementById("isBorderColor").value = is.borderColor || "#cccccc";
    document.getElementById("isSize").value = parseInt(is.fontSize) || 14;
    document.getElementById("isPadding").value = is.padding || "";
    document.getElementById("isFont").value = is.fontFamily || "inherit";
    document.getElementById("mHideOnly").checked = !!p.hideOnly;
    document.getElementById("mReadOnly").checked = !!p.readOnly;
    document.getElementById("mRequired").checked = !!p.isRequired;
    document.getElementById("mCheckMultiple").checked = !!p.checkMultiple;
    const INPUT_TYPES = ["TEXT", "EMAIL", "NUMBER", "TEXTAREA"];
    const isInputType = INPUT_TYPES.includes(field.type);
    document.getElementById("typeSection").style.display = isInputType ? "block" : "none";
    if (isInputType) {
        document.getElementById("mFieldType").value = field.type;
    }
    document.getElementById("charSection").style.display = "none";
    document.getElementById("numSection").style.display = "none";
    if (field.type === componentsEnum.TEXT ||
        field.type === componentsEnum.EMAIL ||
        field.type === componentsEnum.TEXTAREA) {
        document.getElementById("charSection").style.display = "block";
        document.getElementById("mMinChar").value = p.minChar !== null ? p.minChar : "";
        document.getElementById("mMaxChar").value = p.maxChar !== null ? p.maxChar : "";
    }
    if (field.type === componentsEnum.NUMBER) {
        document.getElementById("numSection").style.display = "block";
        document.getElementById("mMinNum").value = p.minValue !== null ? p.minValue : "";
        document.getElementById("mMaxNum").value = p.maxValue !== null ? p.maxValue : "";
    }
    const needsOpts = needsOptions(field.type);
    document.getElementById("optionsSection").style.display = needsOpts ? "block" : "none";
    if (needsOpts) renderOptionsList(p.options);
    document.getElementById("multiRow").style.display =
        field.type === componentsEnum.CHECKBOX ? "block" : "none";
    document.getElementById("modalError").textContent = "";
    modalOverlay.style.display = "flex";
}

function renderOptionsList(options) {
    const list = document.getElementById("optionsList");
    list.innerHTML = "";
    for (let i = 0; i < options.length; i++) {
        const row = document.createElement("div");
        row.className = "optionRow";
        const input = document.createElement("input");
        input.type = "text";
        input.value = options[i];
        input.className = "optionInput";
        input.setAttribute("data-index", i);
        const del = document.createElement("button");
        del.textContent = "✕";
        del.className = "deleteOptionBtn";
        del.onclick = (function (idx) {
            return function () { deleteOption(idx); };
        })(i);
        row.appendChild(input);
        row.appendChild(del);
        list.appendChild(row);
    }
}

function addNewOption() {
    const field = fieldList.find(function (f) { return f.id == currentEditId; });
    if (!field) return;
    field.properties.options.push("New Option");
    renderOptionsList(field.properties.options);
}

function deleteOption(index) {
    const field = fieldList.find(function (f) { return f.id == currentEditId; });
    if (!field) return;
    field.properties.options = field.properties.options.filter(function (_, i) { return i !== index; });
    renderOptionsList(field.properties.options);
}

function saveModal() {
    const errEl = document.getElementById("modalError");
    const label = document.getElementById("mLabel").value.trim();
    if (!label) {
        errEl.textContent = "Label cannot be empty.";
        return;
    }
    const field = fieldList.find(function (f) { return f.id == currentEditId; });
    if (!field) return;
    const p = field.properties;
    const INPUT_TYPES = ["TEXT", "EMAIL", "NUMBER", "TEXTAREA"];
    if (INPUT_TYPES.includes(field.type)) {
        field.type = document.getElementById("mFieldType").value;
    }

    p.label = label;
    p.placeholder = document.getElementById("mPlaceholder").value.trim();
    p.labelStyles = {
        color: document.getElementById("lsColor").value,
        backgroundColor: document.getElementById("lsBg").value,
        padding: document.getElementById("lsPadding").value || "2px 4px",
        fontFamily: document.getElementById("lsFont").value,
        fontSize: document.getElementById("lsSize").value + "px"
    };
    p.inputStyles = {
        color: document.getElementById("isColor").value,
        backgroundColor: document.getElementById("isBg").value,
        padding: document.getElementById("isPadding").value || "6px 10px",
        fontFamily: document.getElementById("isFont").value,
        fontSize: document.getElementById("isSize").value + "px",
        borderColor: document.getElementById("isBorderColor").value
    };
    p.hideOnly = document.getElementById("mHideOnly").checked;
    p.readOnly = document.getElementById("mReadOnly").checked;
    p.isRequired = document.getElementById("mRequired").checked;
    p.checkMultiple = document.getElementById("mCheckMultiple").checked;
    if (field.type === componentsEnum.TEXT ||
        field.type === componentsEnum.EMAIL ||
        field.type === componentsEnum.TEXTAREA) {
        const min = document.getElementById("mMinChar").value;
        const max = document.getElementById("mMaxChar").value;
        p.minChar = min !== "" ? Number(min) : null;
        p.maxChar = max !== "" ? Number(max) : null;
    }
    if (field.type === componentsEnum.NUMBER) {
        const min = document.getElementById("mMinNum").value;
        const max = document.getElementById("mMaxNum").value;
        p.minValue = min !== "" ? Number(min) : null;
        p.maxValue = max !== "" ? Number(max) : null;
    }
    if (needsOptions(field.type)) {
        const inputs = document.getElementById("optionsList").querySelectorAll(".optionInput");
        const savedOpts = [];
        let hasDuplicate = false;
        for (let j = 0; j < inputs.length; j++) {
            const val = inputs[j].value.trim();
            const lower = val.toLowerCase();
            for (let k = 0; k < savedOpts.length; k++) {
                if (savedOpts[k].toLowerCase() === lower) {
                    hasDuplicate = true;
                }
            }
            if (val) savedOpts.push(val);
        }
        if (hasDuplicate) {
            errEl.textContent = "Duplicate options are not allowed.";
            return;
        }
        p.options = savedOpts;
    }
    field.updatedAt = new Date().toISOString();
    saveToStorage();
    renderAllFields();
    closeModal();
}

function closeModal() {
    modalOverlay.style.display = "none";
    currentEditId = null;
}


function submitForm() {
    const activeFields = fieldList.filter(function (f) { return !f.deletedAt; });
    const submitIndex = activeFields.findIndex(function (f) {
        return f.type === componentsEnum.SUBMIT;
    });
    if (submitIndex === -1) {
        alert("No Submit button found. Drag a Submit button into the form.");
        return;
    }
    if (submitIndex === 0) {
        alert("No fields above the Submit button. Please add fields first.");
        return;
    }
    const formData = {};
    const cards = document.querySelectorAll(".fieldCard");
    let cardIndex = 0;
    for (let i = 0; i < activeFields.length; i++) {
        const field = activeFields[i];
        if (field.type === componentsEnum.SUBMIT) break;
        if (field.properties.hideOnly) { cardIndex++; continue; }
        const card = cards[cardIndex];
        cardIndex++;
        let value = null;
        switch (field.type) {
            case componentsEnum.TEXT:
            case componentsEnum.EMAIL:
            case componentsEnum.NUMBER:
                value = card.querySelector("input")?.value?.trim() ?? null;
                break;
            case componentsEnum.TEXTAREA:
                value = card.querySelector("textarea")?.value?.trim() ?? null;
                break;
            case componentsEnum.SELECT:
                value = card.querySelector("select")?.value ?? null;
                break;
            case componentsEnum.RADIO: {
                const checked = card.querySelector("input[type='radio']:checked");
                value = checked ? checked.parentElement.textContent.trim() : null;
                break;
            }
            case componentsEnum.CHECKBOX: {
                const checked = card.querySelectorAll("input[type='checkbox']:checked");
                value = Array.from(checked).map(function (cb) {
                    return cb.parentElement.textContent.trim();
                });
                break;
            }
        }
        const isEmpty = value === null || value === "" ||
            (Array.isArray(value) && value.length === 0);
        if (field.properties.isRequired && isEmpty) {
            alert(`"${field.properties.label}" is required. Please fill it in.`);
            return;
        }
        formData[field.properties.label] = value;
    }
    if (Object.keys(formData).length === 0) {
        alert("Nothing to submit. Add fields above the Submit button.");
        return;
    }
    console.log("Form Data:", formData);
    clearForm();
}

function clearForm() {
    const cards = document.querySelectorAll(".fieldCard");
    let cardIndex = 0;
    for (let i = 0; i < fieldList.length; i++) {
        const field = fieldList[i];
        if (field.deletedAt) continue;
        if (field.type === componentsEnum.SUBMIT) { cardIndex++; continue; }
        const card = cards[cardIndex];
        cardIndex++;
        if (!card || field.properties.hideOnly) continue;
        switch (field.type) {
            case componentsEnum.TEXT:
            case componentsEnum.EMAIL:
            case componentsEnum.NUMBER: {
                const input = card.querySelector("input");
                if (input) input.value = "";
                break;
            }
            case componentsEnum.TEXTAREA: {
                const ta = card.querySelector("textarea");
                if (ta) ta.value = "";
                break;
            }
            case componentsEnum.SELECT: {
                const sel = card.querySelector("select");
                if (sel) sel.selectedIndex = 0;
                break;
            }
            case componentsEnum.RADIO:
                card.querySelectorAll("input[type='radio']")
                    .forEach(function (r) { r.checked = false; });
                break;
            case componentsEnum.CHECKBOX:
                card.querySelectorAll("input[type='checkbox']")
                    .forEach(function (cb) { cb.checked = false; });
                break;
        }
    }
}


document.getElementById("mFieldType").addEventListener("change", function () {
    const newType = this.value;
    const newLabel = getDefaultLabel(newType);
    const newPlaceholder = "Enter " + newLabel.toLowerCase();

    document.getElementById("mLabel").value = newLabel;
    document.getElementById("mPlaceholder").value = newPlaceholder;
    document.getElementById("charSection").style.display = "none";
    document.getElementById("numSection").style.display = "none";

    if (newType === "TEXT" || newType === "EMAIL" || newType === "TEXTAREA") {
        document.getElementById("charSection").style.display = "block";
        document.getElementById("mMinChar").value = "";
        document.getElementById("mMaxChar").value = "";
    }
    if (newType === "NUMBER") {
        document.getElementById("numSection").style.display = "block";
        document.getElementById("mMinNum").value = "";
        document.getElementById("mMaxNum").value = "";
    }
});

modalOverlay.addEventListener("click", function (e) {
    if (e.target === modalOverlay) closeModal();
});

document.getElementById("saveNameOverlay").addEventListener("click", function (e) {
    if (e.target === document.getElementById("saveNameOverlay")) closeSaveModal();
});

document.getElementById("formNameInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter") confirmSaveName();
});

document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        closeModal();
        closeSaveModal();
    }
});

function migrateFields() {
    let changed = false;
    const now = new Date().toISOString();
    fieldList.forEach(function (field) {
        if (!field.createdAt) { field.createdAt = now; changed = true; }
        if (!field.updatedAt) { field.updatedAt = now; changed = true; }
        if (!field.hasOwnProperty("deletedAt")) { field.deletedAt = null; changed = true; }
    });
    if (changed) saveToStorage();
}
migrateFields();
renderAllFields();