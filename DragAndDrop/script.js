const drag = document.getElementById("drag");
const dropArea = document.getElementById("dropArea");

drag.addEventListener("dragstart", (e) => {
    console.log(e.target.id);
    e.dataTransfer.setData("text/plain", e.target.id);
});

dropArea.addEventListener("dragover", (e) => {
    e.preventDefault();
});

dropArea.addEventListener("drop", (e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const val = document.getElementById(id);

    if (id == "item1") {
        const input = document.createElement("input");
        val.style.height = "110px";
        val.style.width = "170px";
        input.classList.add("box");
        input.setAttribute("draggable", "false");
        val.appendChild(input);
    }
    else if (id == "item2") {
        const select = `
                <select>
                    <option>Peter Parker</option>
                    <option>Bruce Wayne</option>
                    <option>Steve Roggers</option>
                </select>`;
        val.innerHTML = select;
    }
    else {
        const radio = `
                <input type="radio" name="universe">Marvel
                <input type="radio" name="universe">DC
                `;
        val.style.display = "flex";
        val.style.flexDirection = "column";
        val.innerHTML = radio;
    }
    dropArea.appendChild(val);
});
