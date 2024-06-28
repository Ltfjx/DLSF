
var cancelTokens = {}
var workers = []
var interval = 3000
var checkIfFull = true
var particlesLoaded = false
var particlesPaused = false
var studentId

// 深色模式
!(function () {
    const darkMode = localStorage.getItem('darkMode')
    if (darkMode === 'true' || darkMode === null) {
        document.getElementById("buttonDarkMode").icon = "light_mode"
        mdui.setTheme("dark")
    }
})()

document.getElementById("buttonDarkMode").addEventListener("click", () => {

    if (mdui.getTheme() == "light") {
        document.getElementById("buttonDarkMode").icon = "light_mode"
        localStorage.setItem('darkMode', 'true')
        mdui.setTheme("dark")
    } else {
        document.getElementById("buttonDarkMode").icon = "dark_mode"
        localStorage.setItem('darkMode', 'false')
        mdui.setTheme("light")
    }
})


// 配色自定义系统
!(function () {
    let colorPicker = document.getElementById("colorPicker")
    let color = localStorage.getItem("customColor")
    if (color != undefined) {
        mdui.setColorScheme(color)
    }
    colorPicker.addEventListener('input', function () {
        mdui.setColorScheme(colorPicker.value)
        localStorage.setItem("customColor", colorPicker.value)
    })
    document.getElementById("buttonColor").addEventListener("click", () => {
        colorPicker.click()
    })
})()


// 导轨
!(function () {
    let railItems = ["fucker", "cookie", "table", "about"]
    function hideAll() {
        railItems.forEach(item => {
            document.getElementById(`${item}-content`).setAttribute("hidden", "true")
        })
    }
    railItems.forEach(item => {
        document.getElementById(`rail-${item}`).addEventListener("click", () => {
            hideAll()
            document.getElementById(`${item}-content`).removeAttribute("hidden")

            // 加载课表
            if (item == "table") {
                buttonTableUpdate()
            }

            // 粒子效果控制逻辑
            if (item == "about") {
                if (!particlesLoaded) {
                    particlesJS.load('particles-js', 'particles.json')
                    particlesLoaded = true
                } else if (particlesPaused) {
                    pJSDom[0].pJS.fn.vendors.start()
                    particlesPaused = false
                }
            } else if (particlesLoaded && !particlesPaused) {
                cancelRequestAnimFrame(pJSDom[0].pJS.fn.checkAnimFrame)
                cancelRequestAnimFrame(pJSDom[0].pJS.fn.drawAnimFrame)
                pJSDom[0].pJS.fn.particlesEmpty()
                pJSDom[0].pJS.fn.canvasClear()
                particlesPaused = true
            }


        })
    })
    document.getElementById(`rail-${railItems[0]}`).click()
})()

// Clock
!(function () {
    function updateClock() {
        var now = new Date()
        var hours = now.getHours()
        var minutes = now.getMinutes()
        var seconds = now.getSeconds()

        hours = hours < 10 ? '0' + hours : hours
        minutes = minutes < 10 ? '0' + minutes : minutes
        seconds = seconds < 10 ? '0' + seconds : seconds

        var timeString = hours + ':' + minutes + ':' + seconds

        document.getElementById('clock').innerHTML = timeString
    }
    setInterval(updateClock, 1000)
    updateClock()
})()

// 设置项初始化
var cookie = JSON.parse(localStorage.getItem("DLSF_cookie")) || {}
var targetList = JSON.parse(localStorage.getItem("DLSF_target")) || []


!(async function () {
    document.getElementById("input-cookie-JSESSIONID").value = cookie.JSESSIONID ? cookie.JSESSIONID : ""
    document.getElementById("input-cookie-array").value = cookie.array ? cookie.array : ""
    document.getElementById("input-cookie-username").value = localStorage.getItem("DLSF_username") || ""
    document.getElementById("input-cookie-password").value = localStorage.getItem("DLSF_password") || ""
    if (!await checkCookie() && localStorage.getItem("DLSF_username") != "" && localStorage.getItem("DLSF_password") != "") {
        buttonSaveUser()
    }
    targetListRender()
})()


// 心跳包
!(function () {
    setInterval(() => {
        apiPing()
            .then(() => { document.getElementById("dialog-backend-disconnected").open = false })
            .catch(() => { document.getElementById("dialog-backend-disconnected").open = true })
    }, 3000)
})()


// API
async function apiPing() {

    const baseURL = "http://" + window.location.hostname + "/api"

    let config = {
        method: "GET",
        url: baseURL + "/ping",
        timeout: 1000
    }

    return new Promise((resolve, reject) => {
        axios(config)
            .then(function () {
                resolve(true)
            })
            .catch(function () {
                reject(false)
            })
    })


}

async function api(target, params) {
    if (cancelTokens[target + JSON.stringify(params)]) {
        cancelTokens[target + JSON.stringify(params)]()
    }

    let source = axios.CancelToken.source()
    cancelTokens[target + JSON.stringify(params)] = source.cancel
    if (params) {
        params = { ...params, j: cookie.JSESSIONID, a: cookie.array }
    } else {
        params = { j: cookie.JSESSIONID, a: cookie.array }
    }

    let queryString = params ? Object.keys(params).map(key => key + '=' + encodeURIComponent(params[key])).join('&') : ''

    const baseURL = "http://" + window.location.hostname + "/api"

    const methodMap = {
        "/studentui/initstudinfo": "GET",
        "/setToken": "POST",
        "/loginGetToken": "GET",
        "/selectcourse/initACC": "GET",
        "/selectcourse/scSubmit": "POST",
        "/common/semesterSS": "GET",
        "/StudentCourseTable/getData": "GET"
    }

    let config = {
        method: methodMap[target],
        url: baseURL + target + "?" + queryString,
        cancelToken: source.token
    }

    return new Promise((resolve, reject) => {
        axios(config)
            .then(function (response) {
                console.log(response.data)
                resolve(response.data)
            })
            .catch(function (error) {
                console.log(error)
                if (!error.code == "ERR_CANCELED") {
                    mdui.snackbar({
                        message: target + " API 请求出现了错误，请报告给开发者",
                        closeable: true,
                        placement: "bottom-end"
                    })
                }
                reject(null)
            })
    })

}


// 获取学期列表
var semesterList = []
!(function () {
    api("/common/semesterSS").then(result => {
        semesterList = result.semesterSS.slice(0, 10)
        semesterList.forEach(semester => {
            var menuItem = document.createElement("mdui-menu-item")
            menuItem.setAttribute("value", semester.id)
            menuItem.innerText = semester.name
            Array.from(document.getElementsByClassName("semester-select")).forEach(element => {
                element.appendChild(menuItem)
            })
            if (semester.current) {
                Array.from(document.getElementsByClassName("semester-select")).forEach(element => {
                    element.setAttribute("value", semester.id)
                })
            }
        })
    })
})()


function buttonSaveCookie() {
    cookie.JSESSIONID = document.getElementById("input-cookie-JSESSIONID").value
    cookie.array = document.getElementById("input-cookie-array").value
    localStorage.setItem("DLSF_cookie", JSON.stringify(cookie))
    checkCookie()
}

function buttonSaveUser() {
    const username = document.getElementById("input-cookie-username").value
    const password = document.getElementById("input-cookie-password").value
    localStorage.setItem("DLSF_username", username)
    localStorage.setItem("DLSF_password", password)
    api("/loginGetToken", { username: username, password: password }).then(result => {
        if (result.DLSF_SUCCESS) {
            document.getElementById("input-cookie-JSESSIONID").value = result.JSESSIONID
            document.getElementById("input-cookie-array").value = result.array
            buttonSaveCookie()
        } else {
            mdui.snackbar({
                message: "Cookie 更新失败，请检查用户名和密码",
                placement: "bottom-end"
            })
        }
    })
}

function switchMain() {
    let s = document.getElementById("switch-main")
    let activeWorker = undefined
    if (s.checked) {
        console.log("Start!")
        targetList.forEach((target, i) => {
            setTimeout(() => {
                let firstTry = true
                let worker = setInterval(async () => {
                    let w = document.getElementById(`worker-status-${i + 1}`)
                    let r = document.getElementById(`worker-raw-text-${i + 1}`)
                    w.children[0].style["background"] = "lightgoldenrodyellow"
                    w.children[1].innerHTML = `正在发送请求`
                    r.style["opacity"] = "0.3"

                    let isFull
                    let countString
                    if (checkIfFull) {
                        await api("/selectcourse/initACC", { courseCode: target.courseCode, _: target.id }).then((result) => {
                            lessonData = result.aaData.filter(course => course.cttId == target.id)[0]
                            if (lessonData.maxCnt > lessonData.enrollCnt) {
                                isFull = false
                            } else {
                                isFull = true
                                countString = `最大：${lessonData.maxCnt}<br>已录：${lessonData.enrollCnt}<br>申请：${lessonData.applyCnt}`
                            }
                        })
                    }

                    if (firstTry || !isFull) {
                        api("/selectcourse/scSubmit", { cttId: target.id }).then(result => {
                            r.innerHTML = JSON.stringify(result, null, 2).replace(/ /g, "&nbsp;").replace(/\n/g, "<br>")
                            r.style["opacity"] = "1"
                            if (result.msg == "F") {
                                w.children[0].style["background"] = "lightcoral"
                                w.children[1].innerHTML = `出现验证码，请降低请求速度，本线程已停止！`
                                clearInterval(workers.filter(worker => worker.target == target)[0].worker)
                                activeWorker--
                                document.getElementById("switch-main-status").children[2].innerHTML = `脚本运行中 (${activeWorker}/${targetList.length})`
                            } else if (result.msg == "你这门课已经选了,不允许再次选择了！" || result.success == true) {
                                w.children[0].style["background"] = "lightgreen"
                                w.children[1].innerHTML = `抢课成功！`
                                clearInterval(workers.filter(worker => worker.target == target)[0].worker)
                                activeWorker--
                                document.getElementById("switch-main-status").children[2].innerHTML = `脚本运行中 (${activeWorker}/${targetList.length})`
                            } else {
                                w.children[0].style["background"] = "lightgray"
                                w.children[1].innerHTML = `抢课失败，即将重试...`
                            }
                        })
                    } else {
                        r.innerHTML = countString
                        r.style["opacity"] = "1"
                        w.children[0].style["background"] = "lightgray"
                        w.children[1].innerHTML = "课程人数已满，即将重试..."
                    }
                    firstTry = false
                }, interval)
                workers.push({ "target": target, "worker": worker })

                let newParagraph = document.createElement('mdui-card')
                newParagraph.variant = "elevated"
                newParagraph.classList.add("grid-card")
                newParagraph.innerHTML = `
                <div style="display: flex;align-items: center;margin-bottom: 1rem;">
                    <mdui-icon name="smart_toy--outlined"
                        style="font-size: 2rem;margin-right: 1rem;"></mdui-icon>
                    <div style="font-size: x-large;font-weight: bold;">Worker #${i + 1}</div>
                </div>

                <div style="margin-bottom: 1rem;opacity: 0.75;">@ ${target.id} ${target.name} ${target.teacher}</div>


                <div id="worker-status-${i + 1}" style="display: flex;align-items: center;margin-bottom: 1rem;opacity: 0.75;">
                    <mdui-badge style="background-color: lightgoldenrodyellow;"></mdui-badge>
                    &nbsp;
                    <div>
                        即将开始抢课任务...
                    </div>
                </div>

                <mdui-card variant="filled" style="width: 100%;height: auto;padding: 1rem;">
                    <code id="worker-raw-text-${i + 1}" style="background: 0 0;">...</code>
                </mdui-card>
                `
                let parentDiv = document.getElementById('container-worker')
                parentDiv.appendChild(newParagraph)
            }, 50 * i)
        })
        document.getElementById("switch-main-status").children[1].style["background"] = "lightgreen"
        activeWorker = targetList.length
        document.getElementById("switch-main-status").children[2].innerHTML = `脚本运行中 (${activeWorker}/${targetList.length})`
        document.getElementById("slider-main-speed").disabled = true
        document.getElementById("switch-checkiffull").disabled = true
    } else {
        console.log("Stop!")
        workers.forEach(worker => {
            clearInterval(worker.worker)
        })
        workers = []
        let parentDiv = document.getElementById('container-worker')
        for (var i = parentDiv.children.length - 1; i > 1; i--) {
            parentDiv.removeChild(parentDiv.children[i])
        }
        document.getElementById("switch-main-status").children[1].style["background"] = "lightcoral"
        document.getElementById("switch-main-status").children[2].innerHTML = "脚本已停止"
        document.getElementById("slider-main-speed").disabled = false
        document.getElementById("switch-checkiffull").disabled = false
    }
}

async function checkCookie() {
    document.getElementById("checker-status").children[0].style["background"] = "lightgoldenrodyellow"
    document.getElementById("checker-status").children[1].innerHTML = "正在检查..."
    document.getElementById("checker-raw-text").innerHTML = "..."
    result = await api("/studentui/initstudinfo")
    if (result.success) {
        document.getElementById("checker-status").children[0].style["background"] = "lightgreen"
        document.getElementById("checker-status").children[1].innerHTML = "Token 检查通过"
        document.getElementById("checker-raw-text").innerHTML = JSON.stringify(result, null, 2).replace(/ /g, "&nbsp;").replace(/\n/g, "<br>")
        studentId = result.studBasis.basisNo
        mdui.snackbar({
            message: "Token 检查通过",
            placement: "bottom-end"
        })
        return true
    } else {
        document.getElementById("checker-status").children[0].style["background"] = "lightcoral"
        document.getElementById("checker-status").children[1].innerHTML = "Token 验证失败，请检查填写是否有误"
        document.getElementById("checker-raw-text").innerHTML = "(╯‵□′)╯︵┻━┻"
        mdui.snackbar({
            message: "Token 验证失败，请检查填写是否有误",
            placement: "bottom-end"
        })
        return false
    }

}



function targetListRender() {
    let t = document.getElementById("target-tbody")
    t.innerHTML = ""
    targetList.forEach(target => {
        t.innerHTML += `
        <tr>
            <td>${target.id}</td>
            <td>${target.name}</td>
            <th>${target.num}</th>
            <td>${target.teacher}</td>
            <td>${target.week}</td>
            <td>${target.time}</td>
            <td>${target.room}</td>
            <td>${target.info}</td>
            <td style="padding: 0.3rem;display: flex;height: 100%;align-items: center;">
                <mdui-button-icon icon="delete" onclick="targetDelete('${target.id}')"></mdui-button-icon>
                <mdui-button-icon icon="refresh" onclick="targetRefresh('${target.courseCode}','${target.id}')"></mdui-button-icon>
            </td>
        </tr>
        `
    })
}

function buttonTargetAdd() {
    let id = document.getElementById("input-target").value
    let courseCode = document.getElementById("input-target-courseCode").value
    document.getElementById("input-target").value = ""
    document.getElementById("input-target-courseCode").value = ""

    if (id && courseCode) {
        targetAdd(courseCode, id)
    } else if (courseCode) {
        dialogTargetAddOpen()
        let style = document.createElement('style')
        style.innerHTML = '.panel {max-width: 80rem !important;}'
        document.getElementById("dialog-target-add").shadowRoot.appendChild(style)

        let t = document.getElementById("target-add-tbody")
        t.innerHTML = ""
        document.getElementById("dialog-target-add-title").innerHTML = ""

        api("/selectcourse/initACC", { courseCode: courseCode }).then(result => {
            document.getElementById("dialog-target-add-title").innerHTML = result.curCourse.kcmc
            result.aaData.forEach(course => {
                t.innerHTML += `
                <tr>
                    <td>${course.cttId}</td>
                    <th>${course.maxCnt}/${course.applyCnt}/${course.enrollCnt}</th>
                    <td>${course.techName}</td>
                    <td>${course.useWeek1}</td>
                    <td>${course.classTime1}</td>
                    <td>${course.roomcode1}</td>
                    <td>${course.priorMajors}</td>
                    <td style="padding: 0.3rem;display: flex;height: 100%;align-items: center;">
                        <mdui-button-icon icon="add" onclick="targetAdd('${courseCode}','${course.cttId}')"></mdui-button-icon>
                    </td>
                </tr>
                `
            })
        })


    } else {
        mdui.snackbar({
            message: "请填写课程编号",
            closeable: true,
            placement: "bottom-end"
        })
    }

}

function targetAdd(courseCode, id) {
    if (targetList.some(t => t.id == id)) {
        mdui.snackbar({
            message: "选课序号有重复，请重新输入",
            closeable: true,
            placement: "bottom-end"
        })
    } else {
        targetList.push({
            "id": id,
            "courseCode": courseCode,
            "name": "",
            "num": "",
            "teacher": "",
            "week": "",
            "time": "",
            "room": "",
            "info": ""
        })
        targetListRender()
        targetRefresh(courseCode, id)
        targetSave()
        dialogTargetAddClose()
    }
}

function targetDelete(id) {
    const name = targetList.filter(t => t.id == id)[0].name
    mdui.confirm({
        headline: "要删除这门课吗？",
        description: "即将删除课程：" + (name == "..." ? id : name),
        icon: "delete",
        confirmText: "确定",
        cancelText: "取消",
        onConfirm: () => {
            targetList = targetList.filter(t => t.id != id)
            targetListRender()
            targetSave()
        },
        onCancel: () => { }
    })

}

function targetRefresh(courseCode, id) {

    target = targetList.filter(t => t.id == id)[0]
    target.name = "..."
    target.num = "..."
    target.teacher = "..."
    target.week = "..."
    target.time = "..."
    target.room = "..."
    target.info = "..."
    targetListRender()

    api("/selectcourse/initACC", { courseCode: courseCode }).then((result) => {
        lessonData = result.aaData.filter(course => course.cttId == id)[0]
        target.name = lessonData.crName
        target.num = `${lessonData.maxCnt}/${lessonData.applyCnt}/${lessonData.enrollCnt}`
        target.teacher = lessonData.techName
        target.week = lessonData.useWeek1
        target.time = lessonData.classTime1
        target.room = lessonData.roomcode1
        target.info = lessonData.priorMajors
        targetListRender()
        mdui.snackbar({
            message: "课程信息获取成功",
            closeable: true,
            placement: "bottom-end"
        })
        targetSave()
    })

}

function targetSave() {
    localStorage.setItem("DLSF_target", JSON.stringify(targetList))
}


function dialogTargetAddOpen() {
    document.getElementById("dialog-target-add").open = true
}

function dialogTargetAddClose() {
    document.getElementById("dialog-target-add").open = false
}

function alertSwitchCheckIfFull(s) {
    if (s.checked) {
        mdui.confirm({
            headline: "要开启不校验人数模式吗？",
            description: `由于系统限制，长时间连续请求选课接口会被限速。如果打开了本开关，脚本将不再检查课程是否有空余人数，可能导致被系统限速的情况。`,
            icon: "warning",
            confirmText: "确定",
            cancelText: "取消",
            onConfirm: () => {
                checkIfFull = false
            },
            onCancel: () => {
                s.checked = false
            },
        })

    } else {
        checkIfFull = true
    }
}

var buttonDarksideCounter = 0
var isDarkside = false
function buttonDarkside() {
    buttonDarksideCounter++
    setTimeout(() => {
        buttonDarksideCounter--
    }, 5000)
    if (buttonDarksideCounter >= 7 || isDarkside) {
        if (!isDarkside) { startDarkside() }
        mdui.snackbar({
            message: `您已处于 Darkside`,
            placement: "top"
        })
    } else if (buttonDarksideCounter >= 4) {
        mdui.snackbar({
            message: `还需 ${7 - buttonDarksideCounter} 步即可进入 Darkside`,
            placement: "top"
        })
    }
}

function startDarkside() {
    isDarkside = true
    mdui.setColorScheme("#FF0000")

    Array.from(document.getElementsByClassName("darkside")).forEach(element => {
        element.style["display"] = "block"
    })

    document.getElementById("dialog-darkside").open = true
    setTimeout(() => {
        document.getElementById("dialog-darkside").open = false
    }, 3000)
}

function isNumeric(str) {
    if (typeof str !== "string") return false
    return !isNaN(str) && !isNaN(parseFloat(str))
}

function buttonTableUpdate() {
    let id = document.getElementById("input-table-stdudent-id").value || studentId
    let termId = document.getElementById("input-table-term").value
    let termName = semesterList.find(semester => semester.id == termId).name
    api("/StudentCourseTable/getData", { studentCode: id, yearTermId: termId, yearTermName: termName }).then(result => {
        let t = result.content
        t = t.replace(/<table[^>]*>/, "")
        t = t.replace(/<\/table>/, "")
        t = t.replace(/width="8%"/g, "")
        t = t.replace(/width="11%"/g, "")
        t = t.replace(/style="border-top:2pt solid black"/g, "")
        t = t.replace(/<tr>(?:\s*<td>[^<]*<\/td>\s*){8}<\/tr>/, "")
        t = t.replace('一节', 1)
        t = t.replace('二节', 2)
        t = t.replace('三节', 3)
        t = t.replace('四节', 4)
        t = t.replace('五节', 5)
        t = t.replace('六节', 6)
        t = t.replace('七节', 7)
        t = t.replace('八节', 8)
        t = t.replace('九节', 9)
        t = t.replace('十节', 10)
        t = t.replace('十一节', 11)
        t = t.replace('十二节', 12)
        t = t.replace('十三节', 13)

        document.getElementById("table-tbody").innerHTML = t
        tb = document.getElementById("table-tbody").innerHTML
        var cells = document.querySelectorAll('#table-tbody td');
        cells.forEach(cell => {
            cell.style.verticalAlign = 'top'
            if (cell.innerText && !isNumeric(cell.innerText)) {
                cell.style["background-color"] = "#FFFFFF20"
                cell.innerText = cell.innerText.replace("\n", " ")
                let lesson = cell.innerText.split(" ")
                cell.innerText = ""
                for (let i = 0; i < lesson.length / 4; i++) {
                    cell.innerHTML += `<div style="font-size: larger;font-weight: bold;">${lesson[4 * i + 0]}</div>`
                    cell.innerHTML += `<div style="opacity: 0.75;">${lesson[4 * i + 1]} · ${lesson[4 * i + 3]}</div>`
                    cell.innerHTML += `<div style="opacity: 0.35;">${lesson[4 * i + 2]}</div>`
                    if (i + 1 < lesson.length / 4) { cell.innerHTML += `<hr style="opacity: 0.5;">` }
                }
            }
        })
    })

}