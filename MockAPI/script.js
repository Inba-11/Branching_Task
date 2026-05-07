
  const apiUrl = "https://69c747cb63393440b31698cb.mockapi.io/api/v1/passwords";
        let editId = -1;
        showResults();
        function setStatus(message) {
            document.getElementById("statusMsg").innerText = message;
        }
        function cancelEdit() {
            editId = -1;
            document.getElementById("passwordInput").value = "";
            document.getElementById("passwordInput").style.border = "";
            document.getElementById("button").innerText = "Analyze";
            document.getElementById("cancelBtn").style.display = "none";
        }
        function showResults() {
            setStatus("Loading...");

            fetch(apiUrl)
                .then(function (response) {
                    return response.json();
                })
                .then(function (allItems) {
                    setStatus("");
                    const field = document.getElementById("sortField").value;
                    const order = document.getElementById("sortOrder").value;
                    let activeItems = [];
                    for (let i = 0; i < allItems.length; i++) {
                        if (allItems[i].isDeleted === false || allItems[i].isDeleted === "false") {
                            activeItems.push(allItems[i]);
                        }
                    }
                    for (let i = 0; i < activeItems.length; i++) {
                        for (let j = i + 1; j < activeItems.length; j++) {
                            const a = new Date(activeItems[i][field]);
                            const b = new Date(activeItems[j][field]);
                            if (order === "asc" && a > b) {
                                let temp = activeItems[i];
                                activeItems[i] = activeItems[j];
                                activeItems[j] = temp;
                            }
                            if (order === "desc" && a < b) {
                                let temp = activeItems[i];
                                activeItems[i] = activeItems[j];
                                activeItems[j] = temp;
                            }
                        }
                    }
                    const tbody = document.querySelector("tbody");
                    tbody.innerHTML = "";
                    if (activeItems.length === 0) {
                        const emptyRow = document.createElement("tr");
                        const emptyCell = document.createElement("td");
                        emptyCell.innerText = "No records found";
                        emptyCell.setAttribute("colspan", "5");
                        emptyCell.style.textAlign = "center";
                        emptyRow.appendChild(emptyCell);
                        tbody.appendChild(emptyRow);
                        document.getElementById("summary").innerHTML = "Weak: 0 | Medium: 0 | Strong: 0";
                        return;
                    }
                    let weak = 0;
                    let medium = 0;
                    let strong = 0;
                    for (let i = 0; i < activeItems.length; i++) {
                        if (activeItems[i].strength === "weak")   { weak++; }
                        if (activeItems[i].strength === "medium") { medium++; }
                        if (activeItems[i].strength === "strong") { strong++; }
                        const tr = document.createElement("tr");
                        const td1 = document.createElement("td");
                        td1.innerText = activeItems[i].password;
                        const td2 = document.createElement("td");
                        td2.innerText = activeItems[i].strength;
                        const td3 = document.createElement("td");
                        td3.innerText = new Date(activeItems[i].createdAt).toLocaleString();
                        const td4 = document.createElement("td");
                        td4.innerText = new Date(activeItems[i].updatedAt).toLocaleString();
                        const td5 = document.createElement("td");
                        const editBtn = document.createElement("button");
                        editBtn.innerText = "Edit";
                        editBtn.onclick = function () { fillEditForm(activeItems[i].id, activeItems[i].password); };
                        const deleteBtn = document.createElement("button");
                        deleteBtn.innerText = "Delete";
                        deleteBtn.onclick = function () { softDeletePassword(activeItems[i].id); };
                        td5.appendChild(editBtn);
                        td5.appendChild(deleteBtn);
                        tr.appendChild(td1);
                        tr.appendChild(td2);
                        tr.appendChild(td3);
                        tr.appendChild(td4);
                        tr.appendChild(td5);
                        tbody.appendChild(tr);
                    }

                    document.getElementById("summary").innerHTML =
                        "Weak: " + weak + " | Medium: " + medium + " | Strong: " + strong;
                })
                .catch(function () {
                    setStatus("Failed to load data. Check your internet connection.");
                });
        }
        function addPassword(password, strength) {
            const newItem = {
                password: password,
                strength: strength,
                createdAt: new Date(Date.now()).toISOString(),
                updatedAt: new Date(Date.now()).toISOString(),
                isDeleted: false
            };

            setStatus("Saving...");

            fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newItem)
            })
                .then(function (response) {
                    return response.json();
                })
                .then(function () {
                    setStatus("Password saved!");
                    showResults();
                })
                .catch(function () {
                    setStatus("Failed to save. Try again.");
                });
        }
        function updatePassword(id, password, strength) {
            const updatedItem = {
                password: password,
                strength: strength,
                updatedAt: new Date(Date.now()).toISOString()
            };
            setStatus("Updating...");
            fetch(apiUrl + "/" + id, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedItem)
            })
                .then(function (response) {
                    return response.json();
                })
                .then(function () {
                    setStatus("Password updated!");
                    showResults();
                })
                .catch(function () {
                    setStatus("Failed to update. Try again.");
                });
        }
        function softDeletePassword(id) {
            const confirmed = confirm("Are you sure you want to delete this password?");
            if (confirmed === false) {
                return;
            }
            setStatus("Deleting...");
            fetch(apiUrl + "/" + id, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isDeleted: true })
            })
                .then(function (response) {
                    return response.json();
                })
                .then(function () {
                    setStatus("Password deleted!");
                    showResults();
                })
                .catch(function () {
                    setStatus("Failed to delete. Try again.");
                });
        }
        function clearAll() {
            const confirmed = confirm("Are you sure you want to delete ALL passwords?");
            if (confirmed === false) {
                return;
            }
            setStatus("Clearing all...");
            document.getElementById("passwordInput").value = "";
            fetch(apiUrl)
                .then(function (response) {
                    return response.json();
                })
                .then(function (allItems) {
                    for (let i = 0; i < allItems.length; i++) {
                        fetch(apiUrl + "/" + allItems[i].id, {
                            method: "DELETE"
                        });
                    }
                    setTimeout(function () {
                        setStatus("All cleared!");
                        showResults();
                    }, 500);
                })
                .catch(function () {
                    setStatus("Failed to clear. Try again.");
                });
        }
        function fillEditForm(id, password) {
            document.getElementById("passwordInput").value = password;
            document.getElementById("button").innerText = "Update";
            document.getElementById("cancelBtn").style.display = "inline";
            editId = id;
        }
        function getFlags(temp) {
            let upper = false;
            let number = false;
            let Symbol = false;
            for (let c = 0; c < temp.length; c++) {
                const ch = temp[c];
                if (ch >= 'A' && ch <= 'Z') { upper = true; }
                if (ch >= '0' && ch <= '9') { number = true; }
                if (ch === '!' || ch === '/' || ch === ':' || ch === '@' || ch === '`' || ch === '_' || ch === '-') {
                    Symbol = true;
                }
            }
            return { upper, number, Symbol };
        }
        function handleButtonClick() {
            const input = document.getElementById("passwordInput").value.trim();
            if (input === "") {
                document.getElementById("passwordInput").style.border = "2px solid red";
                return;
            }
            const result = getFlags(input);
            const upper = result.upper;
            const number = result.number;
            const Symbol = result.Symbol;
            let strength = "";
            switch (true) {
                case (input.length >= 8 && upper && number && Symbol):
                    strength = "strong";
                    break;
                case (input.length >= 6 && (upper || number || Symbol)):
                    strength = "medium";
                    break;
                default:
                    strength = "weak";
            }
            if (editId === -1) {
                fetch(apiUrl)
                    .then(function (response) {
                        return response.json();
                    })
                    .then(function (allItems) {
                        let isDuplicate = false;
                        for (let i = 0; i < allItems.length; i++) {
                            if (allItems[i].password === input && allItems[i].isDeleted === false) {
                                isDuplicate = true;
                                break;
                            }
                        }
                        if (isDuplicate === true) {
                            alert("Password already exists :(");
                            return;
                        }
                        addPassword(input, strength);
                    });
            } else {
                updatePassword(editId, input, strength);
                editId = -1;
            }
            document.getElementById("passwordInput").value = "";
            document.getElementById("button").innerText = "Analyze";
            document.getElementById("cancelBtn").style.display = "none";
        }

