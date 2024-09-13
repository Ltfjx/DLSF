var lessonDatabase = {}
var lessonDatabasePage = 1
var lessonDatabaseCountPerPage = 20
var lessonDatabaseSearched = []
var lessonDatabaseIsSearch = false

console.log(1, pinyinPro.match('语文', 'yw')); // true
console.log(1, pinyinPro.match('语文', 'yuwen')); // true
console.log(1, pinyinPro.match('语文', 'ywen')); // true
console.log(1, pinyinPro.match('语文', 'ywq')); // false

async function lessonDatabaseNextPage() {
    if (lessonDatabasePage < Math.ceil((lessonDatabaseIsSearch ? lessonDatabaseSearched.length : lessonDatabase.data.length) / lessonDatabaseCountPerPage)) {
        databaseShowPage(lessonDatabasePage + 1, lessonDatabaseCountPerPage)
    }
}

async function lessonDatabasePrevPage() {
    if (lessonDatabasePage > 1) {
        databaseShowPage(lessonDatabasePage - 1, lessonDatabaseCountPerPage)
    }
}

async function lessonDatabaseFirstPage() {
    lessonDatabasePage = 1
    databaseShowPage(lessonDatabasePage, lessonDatabaseCountPerPage)
}

async function lessonDatabaseLastPage() {
    const totalPage = Math.ceil((lessonDatabaseIsSearch ? lessonDatabaseSearched.length : lessonDatabase.data.length) / lessonDatabaseCountPerPage)
    lessonDatabasePage = totalPage
    databaseShowPage(lessonDatabasePage, lessonDatabaseCountPerPage)
}

async function lessonDatabaseScrollTop() {
    document.getElementById("main-content-area").scrollTo({
        top: 0,
        behavior: "smooth",
    })
}

async function lessonDatabaseSearch(value) {
    if (value != "") {
        lessonDatabaseSearched = lessonDatabase.data.filter(item => {
            return pinyinPro.match(item.kcmc, value) || item.kcbh.includes(value) || pinyinPro.match(item.orgname, value)
        })
        lessonDatabaseIsSearch = true
        databaseShowPage(1, lessonDatabaseCountPerPage)
    } else {
        lessonDatabaseIsSearch = false
        databaseShowPage(1, lessonDatabaseCountPerPage)
    }
}

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
        lessonDatabaseIsSearch = false
        document.getElementById("lesson-database-search-input").value = ""
    } catch (e) {
        console.log(e)
        lessonDatabase = {
            data: [],
            timeStamp: 0
        }
        document.getElementById("text-database-time").innerHTML = `暂未获取当前所选学期课程数据，点击上方的按钮来获取`
    }

    databaseShowPage(1, lessonDatabaseCountPerPage)

}

function showEmptyTable() {
    document.querySelectorAll(".text-database-page").forEach(element => {
        element.innerHTML = `0 / 0`
    })
    document.querySelectorAll(".lesson-database-prev").forEach(element => {
        element.style.opacity = "0.5"
    })
    document.querySelectorAll(".lesson-database-next").forEach(element => {
        element.style.opacity = "0.5"
    })
    document.getElementById("lesson-database-table").innerHTML = `
    <div style="text-align: center;margin-top: 1rem;margin-bottom: 1rem;opacity: 0.5;">
        一切皆已遁入幻想
    </div>
  `
}

function addLessonByLessonCode(lessonCode) {
    document.getElementById("input-target-courseCode").value = lessonCode
    buttonTargetAdd()
}

function databaseShowPage(page) {
    if ((lessonDatabaseIsSearch ? lessonDatabaseSearched.length : lessonDatabase.data.length) == 0) {
        showEmptyTable()
        return
    }
    lessonDatabasePage = page
    document.getElementById("lesson-database-table").innerHTML = ""
    const start = (page - 1) * lessonDatabaseCountPerPage
    const end = start + lessonDatabaseCountPerPage
    var data = []
    if (lessonDatabaseIsSearch) {
        data = lessonDatabaseSearched.slice(start, end)
    } else {
        data = lessonDatabase.data.slice(start, end)
    }

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

    th1.style["width"] = "40%"
    th2.style["width"] = "15%"
    th3.style["width"] = "15%"
    th4.style["width"] = "20%"
    th5.style["width"] = "10%"

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

    const pageTotal = Math.ceil((lessonDatabaseIsSearch ? lessonDatabaseSearched.length : lessonDatabase.data.length) / lessonDatabaseCountPerPage)
    // 显示页数
    document.querySelectorAll(".text-database-page").forEach(element => {
        element.innerHTML = `${lessonDatabasePage} / ${pageTotal}`
    })

    // 前一页
    if (lessonDatabasePage == 1) {
        document.querySelectorAll(".lesson-database-prev").forEach(element => {
            element.style.opacity = "0.5"
        })
    } else {
        document.querySelectorAll(".lesson-database-prev").forEach(element => {
            element.style.opacity = "1"
        })
    }

    // 后一页
    if (lessonDatabasePage == pageTotal) {
        document.querySelectorAll(".lesson-database-next").forEach(element => {
            element.style.opacity = "0.5"
        })
    } else {
        document.querySelectorAll(".lesson-database-next").forEach(element => {
            element.style.opacity = "1"
        })
    }
}
