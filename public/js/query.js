var lessonDatabase = {}

async function updateLessonDatabase(termId) {
    const result = await api("/PublicQuery/getSelectCourseTermList", { termId: termId })
    if (result.success) {
        const data = {
            data: result.aaData,
            timeStamp: new Date().getTime()
        }
        localStorage.setItem(`lessonDatabase_${termId}`, JSON.stringify(data))
        showMessage("课程数据库更新成功")
    } else {
        showMessage("课程数据库更新失败")
    }
}

async function buttonDatabaseUpdate() {
    const termId = document.getElementById("input-query-term").value
    await updateLessonDatabase(termId)
    loadLessonDatabase(termId)
}

function loadLessonDatabase(termId) {
    try {
        lessonDatabase = JSON.parse(localStorage.getItem(`lessonDatabase_${termId}`))
        document.getElementById("text-database-time").innerHTML = `当前所选学期课程数据库更新时间：${new Date(lessonDatabase.timeStamp).toLocaleString()}`
        databaseShowPage(1, 1000)
    } catch (e) {
        console.log(e)
        document.getElementById("text-database-time").innerHTML = `暂未获取当前所选学期课程数据`
        clearLessonDatabaseDisplay()
    }
}

function clearLessonDatabaseDisplay() {
    document.getElementById("lesson-database-table").innerHTML = ""
}

function addLessonByLessonCode(lessonCode) {
    document.getElementById("input-target-courseCode").value = lessonCode
    buttonTargetAdd()
}

function databaseShowPage(page, count) {
    document.getElementById("lesson-database-table").innerHTML = ""
    const start = (page - 1) * count
    const end = start + count
    const data = lessonDatabase.data.slice(start, end)

    const table = document.createElement("table")
    const thead = document.createElement("thead")

    const tr = document.createElement("tr")
    const th1 = document.createElement("th")
    const th2 = document.createElement("th")
    const th3 = document.createElement("th")
    const th4 = document.createElement("th")
    const th5 = document.createElement("th")

    th1.innerHTML = "课程名称"
    th2.innerHTML = "课程代码"
    th3.innerHTML = "学分"
    th4.innerHTML = "开课学院"
    th5.innerHTML = "操作"

    tr.appendChild(th1)
    tr.appendChild(th2)
    tr.appendChild(th3)
    tr.appendChild(th4)
    tr.appendChild(th5)

    thead.appendChild(tr)
    table.appendChild(thead)

    const tbody = document.createElement("tbody")

    data.forEach(item => {
        const tr = document.createElement("tr")
        const td1 = document.createElement("td")
        const td2 = document.createElement("td")
        const td3 = document.createElement("td")
        const td4 = document.createElement("td")
        const td5 = document.createElement("td")
        td5.style["padding"] = "0"

        td1.innerHTML = item.kcmc
        td2.innerHTML = item.kcbh
        td3.innerHTML = item.xf
        td4.innerHTML = item.orgname
        td5.innerHTML = `
        <mdui-button-icon icon="add" style="margin:0" onclick="addLessonByLessonCode('${item.kcbh}')"></mdui-button-icon>
        `

        tr.appendChild(td1)
        tr.appendChild(td2)
        tr.appendChild(td3)
        tr.appendChild(td4)
        tr.appendChild(td5)

        tbody.appendChild(tr)
    })
    table.appendChild(tbody)
    document.getElementById("lesson-database-table").appendChild(table)
}
