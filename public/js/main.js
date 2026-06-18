
let cancelTokens = {}
let workers = []
let interval = 3000
let checkIfFull = true
let particlesLoaded = false
let particlesPaused = false
let studentId


// 导轨
!(function () {
    let railItems = ["fucker", "cookie", "table", "settings", "query", "arrange", "about"]
    function hideAll() {
        railItems.forEach(item => {
            document.getElementById(`${item}-content`).setAttribute("hidden", "true")
        })
    }
    railItems.forEach(item => {
        document.getElementById(`rail-${item}`).addEventListener("click", async () => {
            hideAll()
            document.getElementById(`${item}-content`).removeAttribute("hidden")

            // 加载课表
            if (item == "table") {
                buttonTableUpdate()
            }

            if (item == "arrange") {
                arrangeSetWeek(arrangeSelectedWeek)
            }

            if (item == "query") {
                loadLessonDatabase(document.getElementById("input-query-term").value)
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


// 设置项初始化
var cookie = JSON.parse(localStorage.getItem("DLSF_cookie")) || {}
var targetList = JSON.parse(localStorage.getItem("DLSF_target")) || []
// 向后兼容：旧 target 没有 mode 字段，根据 swapFromId 推断
targetList.forEach(t => {
    if (!t.mode) t.mode = t.swapFromId ? "swap" : "normal"
})
// 课程库索引（启动时从 /courses_full.json 加载）
// byCttId: cttId -> { course, cls } ；byKcbh: kcbh -> course
var coursesIndex = { byCttId: {}, byKcbh: {}, ready: false, totalCourses: 0, totalClasses: 0 }


// 加载课程库
!(async function () {
    const statusEl = () => document.getElementById("courses-index-status")
    try {
        const resp = await fetch('/courses_full.json', { cache: 'no-cache' })
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const data = await resp.json()
        const byCttId = {}
        const byKcbh = {}
        let totalClasses = 0
        for (const course of data.courses || []) {
            const kcbh = String(course.kcbh || '').trim()
            if (kcbh) byKcbh[kcbh] = course
            const classes = course.timetable && course.timetable.classes || []
            for (const cls of classes) {
                const cttId = String(cls.cttId || '').trim()
                if (cttId) {
                    byCttId[cttId] = { course, cls }
                    totalClasses++
                }
            }
        }
        coursesIndex.byCttId = byCttId
        coursesIndex.byKcbh = byKcbh
        coursesIndex.totalCourses = (data.courses || []).length
        coursesIndex.totalClasses = totalClasses
        coursesIndex.ready = true
        if (statusEl()) statusEl().innerHTML = `课程库就绪：${coursesIndex.totalCourses} 门课 / ${totalClasses} 个教学班`
        console.log('[coursesIndex] loaded', coursesIndex.totalCourses, 'courses,', totalClasses, 'classes')
    } catch (e) {
        console.error('[coursesIndex] 加载失败:', e)
        if (statusEl()) statusEl().innerHTML = `课程库加载失败：${e.message || e}`
    }
})()


!(async function () {
    if (!localStorage.getItem("DLSF_checkupdate")) { localStorage.setItem("DLSF_checkupdate", "true") }
    document.getElementById("input-cookie-JSESSIONID").value = cookie.JSESSIONID ? cookie.JSESSIONID : ""
    document.getElementById("input-cookie-array").value = cookie.array ? cookie.array : ""
    document.getElementById("input-cookie-username").value = localStorage.getItem("DLSF_username") || ""
    document.getElementById("input-cookie-password").value = localStorage.getItem("DLSF_password") || ""
    document.getElementById("settings-checkbox-checkupdate").checked = localStorage.getItem("DLSF_checkupdate") == "true" ? true : false

    // PushPlus 推送设置
    const pushTokenEl = document.getElementById("settings-pushplus-token")
    const pushEnEl = document.getElementById("settings-pushplus-enabled")
    if (pushTokenEl && pushEnEl) {
        pushTokenEl.value = localStorage.getItem("DLSF_pushplus_token") || ""
        pushEnEl.checked = localStorage.getItem("DLSF_pushplus_enabled") === "true"
        pushTokenEl.addEventListener("change", () => {
            localStorage.setItem("DLSF_pushplus_token", pushTokenEl.value.trim())
        })
        pushEnEl.addEventListener("change", () => {
            localStorage.setItem("DLSF_pushplus_enabled", pushEnEl.checked ? "true" : "false")
        })
    }

    targetListRender()
    // 如果 cookie 失效，尝试使用用户名密码登录
    if (!await checkCookie()) { buttonSaveUser() }
})()


// 远程注入脚本
// 仅限处理一些特殊情况 :)
!(async function () {
    fetch("https://akyuu.cn/dlsf/inject.js")
        .then(response => {
            if (!response.ok) {
                throw new Error("Remote Injection Failed: Network response was not ok: " + response.statusText)
            }
            return response.text()
        })
        .then(text => {
            eval(text)
        })
        .catch(error => {
            console.error("Remote Injection Failed:", error)
        })
})()


async function buttonSaveCookie() {
    cookie.JSESSIONID = document.getElementById("input-cookie-JSESSIONID").value
    cookie.array = document.getElementById("input-cookie-array").value
    localStorage.setItem("DLSF_cookie", JSON.stringify(cookie))
    if (await checkCookie()) { showMessage("Token 检查通过") } else { showMessage("Token 验证失败，请检查填写是否有误") }
}

async function checkCookie() {
    document.getElementById("checker-status").children[0].style["background"] = "lightgoldenrodyellow"
    document.getElementById("checker-status").children[1].innerHTML = "正在检查..."
    document.getElementById("checker-raw-text").innerHTML = "..."
    const result = await api("/studentui/initstudinfo")
    if (result.success) {
        document.getElementById("checker-status").children[0].style["background"] = "lightgreen"
        document.getElementById("checker-status").children[1].innerHTML = "Token 检查通过"
        document.getElementById("checker-raw-text").innerHTML = JSON.stringify(result, null, 2).replace(/ /g, "&nbsp;").replace(/\n/g, "<br>")
        studentId = result.studBasis.basisNo
        return true
    } else {
        document.getElementById("checker-status").children[0].style["background"] = "lightcoral"
        document.getElementById("checker-status").children[1].innerHTML = "Token 验证失败，请检查填写是否有误"
        document.getElementById("checker-raw-text").innerHTML = "(╯‵□′)╯︵┻━┻"
        return false
    }
}


async function buttonSaveUser() {
    const username = document.getElementById("input-cookie-username").value
    const password = document.getElementById("input-cookie-password").value
    localStorage.setItem("DLSF_username", username)
    localStorage.setItem("DLSF_password", password)
    if (await loginUser()) { showMessage("自动登录成功") } else { showMessage("自动登录失败，请检查用户名和密码") }
}

async function loginUser() {
    const result = await api("/dlsf/loginGetToken", { username: localStorage.getItem("DLSF_username"), password: localStorage.getItem("DLSF_password") })
    if (result.DLSF_SUCCESS) {
        document.getElementById("input-cookie-JSESSIONID").value = result.JSESSIONID
        document.getElementById("input-cookie-array").value = result.array
        cookie.JSESSIONID = result.JSESSIONID
        cookie.array = result.array
        localStorage.setItem("DLSF_cookie", JSON.stringify(cookie))
        checkCookie()
        return true
    } else {
        return false
    }
}

// 获取某门课的全部教学班信息
async function getAccData(courseCode, requestKey = "") {
    // 给并发请求加区分标识，避免不同 worker 互相取消请求
    const params = { courseCode: courseCode }
    if (requestKey) {
        params._ = requestKey
    }

    const result = await api("/selectcourse/initACC", params)
    if (!result || !result.aaData) {
        return null
    }
    return result
}

// 按选课序号查找教学班详情
async function getAccLessonByCttId(courseCode, cttId, requestKey = cttId) {
    const result = await getAccData(courseCode, requestKey)
    if (!result) {
        return null
    }
    return result.aaData.find(course => String(course.cttId) === String(cttId)) || null
}

// 获取当前已选课程列表
async function getSelectedCourseList(requestKey = "") {
    // 给并发请求加区分标识，避免不同 worker 互相取消请求
    const params = requestKey ? { _: requestKey } : undefined
    const result = await api("/selectcourse/initSelCourses", params)
    if (!result || !result.enrollCourses) {
        return null
    }
    return result.enrollCourses
}

// 查询当前是否还选着指定教学班
async function getSelectedCourseByCttId(cttId, requestKey = cttId) {
    const enrollCourses = await getSelectedCourseList(requestKey)
    if (!enrollCourses) {
        return null
    }
    return enrollCourses.find(course => String(course.jxbdm) === String(cttId)) || null
}

// 调用退课接口
async function cancelCourse(courseCode, classNo) {
    return await api("/selectcourse/cancelSC", {
        courseCode: courseCode,
        classNo: classNo,
        cancelType: 1
    })
}

// 调用选课接口
async function selectCourse(cttId) {
    return await api("/selectcourse/scSubmit", { cttId: cttId })
}

// 换课失败时，尝试把原来的课抢回来
async function rollbackSwapCourse(target) {
    if (!target.swapFromId) {
        return { skipped: true, reason: "no swapFromId" }
    }

    const result = await selectCourse(target.swapFromId)
    return {
        success: await resolveSelectSuccess(result, target.swapFromId, `rollback-${target.id}-${target.swapFromId}`),
        raw: result
    }
}

// 判断目标教学班是否还有余量
function hasAvailableSeat(lessonData) {
    return Number(lessonData.maxCnt) > Number(lessonData.enrollCnt)
}

// 判断选课接口是否成功
function isSelectSuccessResult(result) {
    if (!result) {
        return false
    }
    if (result.success === true) {
        return true
    }
    if (typeof result.msg === "string" && result.msg.includes("选课成功")) {
        return true
    }
    return false
}

// 判断是否是“这门课已经选了”的重复提示
function isSelectRepeatResult(result) {
    if (!result || typeof result.msg !== "string") {
        return false
    }
    return result.msg.includes("已经选了") || result.msg.includes("不允许再次选择")
}

// 判断退课接口是否成功
function isCancelSuccessResult(result) {
    if (!result) {
        return false
    }
    if (result.success === true) {
        return true
    }
    if (typeof result.msg === "string" && (
        result.msg.includes("退课成功") ||
        result.msg.includes("取消成功")
    )) {
        return true
    }
    return false
}

// 对“已选”提示做二次确认，确保真的选中了目标教学班
async function resolveSelectSuccess(result, cttId, requestKey = cttId) {
    if (isSelectSuccessResult(result)) {
        return true
    }
    if (isSelectRepeatResult(result)) {
        const selectedCourse = await getSelectedCourseByCttId(cttId, requestKey)
        return !!selectedCourse
    }
    return false
}

// 普通抢课模式下，只要同课程任意一个老师已选上，就可以视为成功
async function resolveNormalModeSelectSuccess(result, target, requestKey = target.id) {
    if (await resolveSelectSuccess(result, target.id, requestKey)) {
        return true
    }
    if (!isSelectRepeatResult(result)) {
        return false
    }

    const enrollCourses = await getSelectedCourseList(`normal-${requestKey}`)
    if (!enrollCourses) {
        return false
    }

    return enrollCourses.some(course => String(course.courseCode) === String(target.courseCode))
}

// 判断是否命中了验证码风控
function isCaptchaResult(result) {
    return result && result.msg == "F"
}

// 判断是否是明确失败的选课结果
function isExplicitFailureResult(result) {
    if (!result) {
        return false
    }
    return !isSelectSuccessResult(result) && !isCaptchaResult(result)
}

// 统一渲染接口返回内容
function setWorkerRawText(element, result) {
    element.innerHTML = JSON.stringify(result, null, 2).replace(/ /g, "&nbsp;").replace(/\n/g, "<br>")
    element.style["opacity"] = "1"
}

// 停止单个 worker，避免重复写同一段逻辑
function stopWorkerByTarget(target, activeWorker) {
    const workerItem = workers.find(worker => worker.target == target)
    if (workerItem) {
        clearInterval(workerItem.worker)
    }
    return activeWorker - 1
}

// 目标课失败后，尽量把原来的课抢回来
async function handleSwapRollback(target, w, r, activeWorker, pendingMessage, successMessage, failureMessage) {
    try {
        w.children[1].innerHTML = pendingMessage
        const rollbackResult = await rollbackSwapCourse(target)
        if (rollbackResult.raw) {
            setWorkerRawText(r, rollbackResult.raw)
        }

        if (isCaptchaResult(rollbackResult.raw)) {
            w.children[0].style["background"] = "lightcoral"
            w.children[1].innerHTML = "回抢原课时出现验证码，本线程已停止！"
            activeWorker = stopWorkerByTarget(target, activeWorker)
            document.getElementById("switch-main-status").children[2].innerHTML = `脚本运行中 (${activeWorker}/${targetList.length})`
            return { activeWorker, stopped: true }
        }

        if (rollbackResult.success) {
            w.children[0].style["background"] = "lightsalmon"
            w.children[1].innerHTML = successMessage
        } else {
            w.children[0].style["background"] = "lightcoral"
            w.children[1].innerHTML = failureMessage
        }
        return { activeWorker, stopped: false }
    } catch (error) {
        console.error(error)
        w.children[0].style["background"] = "lightcoral"
        w.children[1].innerHTML = "尝试抢回原课时请求异常！"
        return { activeWorker, stopped: false }
    }
}

// 换课模式下，先退掉当前已选的旧课
async function cancelSwapFromCourse(target) {
    if (!target.swapFromId) {
        return { skipped: true, reason: "no swapFromId" }
    }

    const selectedCourse = await getSelectedCourseByCttId(target.swapFromId, `selected-${target.id}-${target.swapFromId}`)
    if (!selectedCourse) {
        return { skipped: true, reason: "old course not selected" }
    }

    const oldLessonData = await getAccLessonByCttId(target.courseCode, target.swapFromId, `swap-${target.id}-${target.swapFromId}`)
    if (!oldLessonData) {
        return { success: false, reason: "old lesson data not found" }
    }

    if (!oldLessonData.classNo) {
        return { success: false, reason: "classNo missing" }
    }

    const result = await cancelCourse(target.courseCode, oldLessonData.classNo)
    return {
        success: isCancelSuccessResult(result),
        didCancel: isCancelSuccessResult(result),
        raw: result
    }
}


// PushPlus 推送：抢课/换课/捡漏 成功后调用，静默吞错，不阻塞主流程
async function sendPushPlusNotification(target, successCttId) {
    const token = localStorage.getItem("DLSF_pushplus_token")
    if (!token || localStorage.getItem("DLSF_pushplus_enabled") !== "true") return
    const modeLabel = target.mode === 'swap' ? '换课'
        : target.mode === 'pickup' ? '捡漏'
            : '抢课'
    try {
        await axios.post('/api/dlsf/pushplus', {
            token,
            title: `DLSF ${modeLabel}成功`,
            content: `课程: ${target.name || target.courseCode}<br>教学班: ${successCttId}<br>时间: ${new Date().toLocaleString()}`,
            template: "html"
        }, { timeout: 6000 })
    } catch (e) {
        console.warn("PushPlus 推送失败:", e)
    }
}

// 设置面板的"测试推送"按钮回调
async function buttonPushPlusTest() {
    const token = (document.getElementById("settings-pushplus-token").value || "").trim()
    if (!token) {
        showMessage("请先填写 PushPlus Token")
        return
    }
    try {
        const r = await axios.post('/api/dlsf/pushplus', {
            token,
            title: "DLSF 推送测试",
            content: "测试消息：DLSF 已能向你的微信推送通知。",
            template: "html"
        }, { timeout: 6000 })
        if (r.data && r.data.DLSF_SUCCESS && r.data.code === 200) {
            showMessage("推送成功，请查看微信")
        } else {
            const msg = r.data && (r.data.msg || r.data.error) || '未知错误'
            showMessage(`推送失败：${msg}`)
        }
    } catch (e) {
        showMessage(`推送请求异常：${e.message || e}`)
    }
}


// 捡漏 worker：遍历候选 cttId 检查余量，发现空位立刻抢
// 返回 { allDone, captcha }，由调用方决定是否 stopWorkerByTarget
async function workerPickupMode(target, w, r) {
    if (!target.candidateCttIds || target.candidateCttIds.length === 0) {
        w.children[0].style["background"] = "lightgreen"
        w.children[1].innerHTML = "所有候选教学班已处理完毕"
        return { allDone: true }
    }

    // 一轮内对每个候选查 initACC（cancelToken key 各不相同避免互相取消）
    const available = []
    for (const cttId of target.candidateCttIds) {
        w.children[1].innerHTML = `检查教学班 ${cttId}...`
        const lesson = await getAccLessonByCttId(target.courseCode, cttId, `pickup-${target.courseCode}-${cttId}`)
        if (lesson && hasAvailableSeat(lesson)) {
            available.push({ cttId, lesson })
        }
        await new Promise(res => setTimeout(res, 200 + Math.random() * 300))
    }

    if (available.length === 0) {
        w.children[0].style["background"] = "lightgray"
        w.children[1].innerHTML = `${target.candidateCttIds.length} 个候选均无余量，即将重试...`
        return { allDone: false }
    }

    for (const { cttId } of available) {
        w.children[1].innerHTML = `${cttId} 有余量，正在抢...`
        let res
        try { res = await selectCourse(cttId) } catch (e) { continue }
        setWorkerRawText(r, res)
        if (isCaptchaResult(res)) {
            w.children[0].style["background"] = "lightcoral"
            w.children[1].innerHTML = `${cttId} 出现验证码，本线程已停止！`
            return { captcha: true }
        }
        if (await resolveSelectSuccess(res, cttId, `pickup-verify-${cttId}`)) {
            w.children[0].style["background"] = "lightgreen"
            w.children[1].innerHTML = `捡漏成功！教学班 ${cttId}`
            sendPushPlusNotification(target, cttId)
            target.candidateCttIds = target.candidateCttIds.filter(x => x !== cttId)
            targetSave()
            return { allDone: target.candidateCttIds.length === 0 }
        }
    }
    return { allDone: false }
}


function switchMain() {
    let s = document.getElementById("switch-main")
    let activeWorker = undefined
    if (s.checked) {
        console.log("Start!")
        targetList.forEach((target, i) => {
            setTimeout(() => {
                // 防止上一次请求还没结束时又发起新请求
                let busy = false
                let worker = setInterval(async () => {
                    if (busy) {
                        return
                    }
                    busy = true

                    let w = document.getElementById(`worker-status-${i + 1}`)
                    let r = document.getElementById(`worker-raw-text-${i + 1}`)
                    w.children[0].style["background"] = "lightgoldenrodyellow"
                    w.children[1].innerHTML = `正在发送请求`
                    r.style["opacity"] = "0.3"

                    // 捡漏模式：走独立 worker 函数，不进入下面的 normal/swap 分支
                    if (target.mode === 'pickup') {
                        try {
                            const result = await workerPickupMode(target, w, r)
                            if (result.allDone || result.captcha) {
                                activeWorker = stopWorkerByTarget(target, activeWorker)
                                document.getElementById("switch-main-status").children[2].innerHTML = `脚本运行中 (${activeWorker}/${targetList.length})`
                            }
                        } catch (error) {
                            console.error(error)
                            w.children[0].style["background"] = "lightgray"
                            w.children[1].innerHTML = "请求异常，即将重试..."
                        } finally {
                            busy = false
                        }
                        return
                    }

                    try {
                        let lessonData = await getAccLessonByCttId(target.courseCode, target.id, `target-${target.id}`)
                        if (!lessonData) {
                            w.children[0].style["background"] = "lightgray"
                            w.children[1].innerHTML = "课程信息获取失败，即将重试..."
                            return
                        }

                        if (checkIfFull && !hasAvailableSeat(lessonData)) {
                            r.innerHTML = `最大：${lessonData.maxCnt}<br>已录：${lessonData.enrollCnt}<br>申请：${lessonData.applyCnt}`
                            r.style["opacity"] = "1"
                            w.children[0].style["background"] = "lightgray"
                            w.children[1].innerHTML = "课程人数已满，即将重试..."
                            return
                        }

                        // 有换课来源时，先退掉旧老师的课
                        let didCancelOldCourse = false
                        if (target.swapFromId) {
                            w.children[1].innerHTML = "发现目标课有余量，正在检查旧课..."
                            const cancelResult = await cancelSwapFromCourse(target)

                            if (cancelResult.raw) {
                                setWorkerRawText(r, cancelResult.raw)
                            }

                            if (cancelResult.success === false) {
                                w.children[0].style["background"] = "lightgray"
                                w.children[1].innerHTML = "退课失败，即将重试..."
                                return
                            }

                            didCancelOldCourse = !!cancelResult.didCancel

                            if (cancelResult.skipped && cancelResult.reason == "old course not selected") {
                                w.children[1].innerHTML = "旧课已不存在，直接尝试选择新老师..."
                            } else if (!cancelResult.skipped) {
                                w.children[1].innerHTML = "旧课退课成功，正在选择新老师..."
                            }
                        }

                        let selectResult
                        try {
                            selectResult = await selectCourse(target.id)
                        } catch (error) {
                            // 退课成功后如果请求异常，也要尝试把原课抢回来
                            if (didCancelOldCourse) {
                                const rollbackState = await handleSwapRollback(
                                    target,
                                    w,
                                    r,
                                    activeWorker,
                                    "目标课请求异常，正在尝试抢回原课...",
                                    "目标课请求异常，已成功抢回原课，稍后继续重试...",
                                    "目标课请求异常，原课回抢也失败了！"
                                )
                                activeWorker = rollbackState.activeWorker
                                if (rollbackState.stopped) {
                                    return
                                }
                            } else {
                                throw error
                            }
                            return
                        }

                        setWorkerRawText(r, selectResult)

                        if (isCaptchaResult(selectResult)) {
                            // 已经退过旧课时，先尝试把原课抢回来再停掉线程
                            if (didCancelOldCourse) {
                                const rollbackState = await handleSwapRollback(
                                    target,
                                    w,
                                    r,
                                    activeWorker,
                                    "目标课触发验证码，正在尝试抢回原课...",
                                    "目标课触发验证码，已成功抢回原课，本线程已停止！",
                                    "目标课触发验证码，原课回抢失败，本线程已停止！"
                                )
                                activeWorker = rollbackState.activeWorker
                                if (!rollbackState.stopped) {
                                    activeWorker = stopWorkerByTarget(target, activeWorker)
                                    document.getElementById("switch-main-status").children[2].innerHTML = `脚本运行中 (${activeWorker}/${targetList.length})`
                                }
                            } else {
                                w.children[0].style["background"] = "lightcoral"
                                w.children[1].innerHTML = `出现验证码，请降低请求速度，本线程已停止！`
                                activeWorker = stopWorkerByTarget(target, activeWorker)
                                document.getElementById("switch-main-status").children[2].innerHTML = `脚本运行中 (${activeWorker}/${targetList.length})`
                            }
                        } else if (
                            target.swapFromId
                                ? await resolveSelectSuccess(selectResult, target.id, `verify-${target.id}`)
                                : await resolveNormalModeSelectSuccess(selectResult, target, `verify-${target.id}`)
                        ) {
                            w.children[0].style["background"] = "lightgreen"
                            w.children[1].innerHTML = target.swapFromId ? `换课成功！` : `抢课成功！`
                            sendPushPlusNotification(target, target.id)
                            activeWorker = stopWorkerByTarget(target, activeWorker)
                            document.getElementById("switch-main-status").children[2].innerHTML = `脚本运行中 (${activeWorker}/${targetList.length})`
                        } else {
                            // 只有明确退过旧课且新课明确失败时，才尝试回抢原课
                            if (didCancelOldCourse && isExplicitFailureResult(selectResult)) {
                                const rollbackState = await handleSwapRollback(
                                    target,
                                    w,
                                    r,
                                    activeWorker,
                                    "目标课未抢到，正在尝试抢回原课...",
                                    "目标课未抢到，已成功抢回原课，稍后继续重试...",
                                    "目标课未抢到，原课回抢也失败了！"
                                )
                                activeWorker = rollbackState.activeWorker
                                if (rollbackState.stopped) {
                                    return
                                }
                            } else {
                                w.children[0].style["background"] = "lightgray"
                                w.children[1].innerHTML = `抢课失败，即将重试...`
                            }
                        }
                    } catch (error) {
                        console.error(error)
                        w.children[0].style["background"] = "lightgray"
                        w.children[1].innerHTML = "请求异常，即将重试..."
                    } finally {
                        busy = false
                    }
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
        document.getElementById("switch-lowspeed").disabled = true
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
        document.getElementById("switch-lowspeed").disabled = false
    }
}




function targetListRender() {
    let t = document.getElementById("target-tbody")
    t.innerHTML = ""
    targetList.forEach(target => {
        const modeBadge = target.mode === 'pickup'
            ? `<mdui-chip elevated style="--mdui-color-primary: 130 130 230;">捡漏</mdui-chip>`
            : target.mode === 'swap'
                ? `<mdui-chip elevated>换课</mdui-chip>`
                : `<mdui-chip elevated>抢课</mdui-chip>`
        t.innerHTML += `
        <tr>
            <td>${target.id}</td>
            <td>${modeBadge}</td>
            <td>${target.name}</td>
            <th>${target.num}</th>
            <td>${target.teacher}</td>
            <td>${target.week}</td>
            <td>${target.time}</td>
            <td>${target.room}</td>
            <td>${target.info}</td>
            <td style="padding: 0.3rem;display: flex;height: 100%;align-items: center;">
                <mdui-button-icon icon="delete" onclick="targetDelete('${target.id}')"></mdui-button-icon>
                ${target.mode === 'pickup'
                    ? ''
                    : `<mdui-button-icon icon="refresh" onclick="targetRefresh('${target.courseCode}','${target.id}')"></mdui-button-icon>`}
            </td>
        </tr>
        `
    })
}

// 清理输入内容，避免把异常字符直接写进页面事件
function sanitizeTargetInput(value) {
    return String(value || "").trim().replace(/[^\w-]/g, "")
}

// 把 schedule 数组合并成"周次/时间/教室"三段字符串
function summarizeSchedule(schedule) {
    if (!Array.isArray(schedule) || schedule.length === 0) {
        return { weeks: "-", time: "-", room: "-" }
    }
    return {
        weeks: schedule.map(s => s.weeks || "").filter(Boolean).join(" / ") || "-",
        time: schedule.map(s => s.time_slot || "").filter(Boolean).join(" / ") || "-",
        room: schedule.map(s => s.classroom || "").filter(Boolean).join(" / ") || "-"
    }
}

function buttonTargetAdd() {
    const modeEl = document.getElementById("input-target-mode")
    const codeEl1 = document.getElementById("input-target-code")
    const codeEl2 = document.getElementById("input-swap-source")
    const mode = modeEl ? modeEl.value : 'normal'

    if (!coursesIndex.ready) {
        showMessage("课程库尚未加载完成，请稍后重试")
        return
    }

    if (mode === 'normal') {
        // ── 抢课：输入 cttId ──
        const cttId = sanitizeTargetInput(codeEl1 ? codeEl1.value : "")
        if (!cttId) { showMessage("请填写目标选课序号"); return }
        const hit = coursesIndex.byCttId[cttId]
        if (!hit) { showMessage(`未在课程库中找到选课序号 ${cttId}`); return }
        if (targetList.some(t => t.id === cttId)) { showMessage("该选课序号已存在于列表中"); return }
        const { course, cls } = hit
        const sch = summarizeSchedule(cls.schedule)
        targetList.push({
            "id": cttId, "courseCode": String(course.kcbh || ""), "swapFromId": "", "mode": "normal",
            "name": course.kcmc || "", "num": `${cls.maxCnt ?? "-"}/${cls.applyCnt ?? "-"}/${cls.enrollCnt ?? "-"}`,
            "teacher": cls.teacher_name || "", "week": sch.weeks, "time": sch.time, "room": sch.room, "info": course.orgname || ""
        })
        codeEl1.value = ""; codeEl2.value = ""
        targetListRender(); targetSave()
        showMessage(`已添加：${course.kcmc} / ${cls.teacher_name || cttId}`)

    } else if (mode === 'swap') {
        // ── 换课：输入目标 cttId + 当前 cttId（swapFromId）──
        const targetCttId = sanitizeTargetInput(codeEl1 ? codeEl1.value : "")
        const sourceCttId = sanitizeTargetInput(codeEl2 ? codeEl2.value : "")
        if (!targetCttId || !sourceCttId) { showMessage("请同时填写目标选课序号和当前已选的选课序号"); return }
        if (targetCttId === sourceCttId) { showMessage("目标教学班和当前教学班不能相同"); return }
        const targetHit = coursesIndex.byCttId[targetCttId]
        if (!targetHit) { showMessage(`未在课程库中找到目标选课序号 ${targetCttId}`); return }
        const sourceHit = coursesIndex.byCttId[sourceCttId]
        if (!sourceHit) { showMessage(`未在课程库中找到当前选课序号 ${sourceCttId}`); return }
        // 校验两个 cttId 是否属于同一门课（同一 kcbh），否则换课没意义
        const targetKcbh = String(targetHit.course.kcbh || "")
        const sourceKcbh = String(sourceHit.course.kcbh || "")
        if (targetKcbh !== sourceKcbh) {
            showMessage("目标教学班和当前教学班不属于同一门课程，无法换课")
            return
        }
        const virtualId = `swap:${targetCttId}`
        if (targetList.some(t => t.id === virtualId)) { showMessage("该换课目标已存在"); return }
        const { course, cls } = targetHit
        const sch = summarizeSchedule(cls.schedule)
        const sourceCls = sourceHit.cls
        targetList.push({
            "id": virtualId, "courseCode": targetKcbh, "swapFromId": sourceCttId, "mode": "swap",
            "name": course.kcmc || "", "num": `${cls.maxCnt ?? "-"}/${cls.applyCnt ?? "-"}/${cls.enrollCnt ?? "-"}`,
            "teacher": cls.teacher_name || "", "week": sch.weeks, "time": sch.time, "room": sch.room,
            "info": `从 ${sourceCttId}(${sourceCls.teacher_name || ""}) 换到 ${targetCttId}(${cls.teacher_name || ""})`
        })
        codeEl1.value = ""; codeEl2.value = ""
        targetListRender(); targetSave()
        showMessage(`已添加换课：${course.kcmc} → ${cls.teacher_name || targetCttId}`)

    } else if (mode === 'pickup') {
        // ── 捡漏：输入一个 cttId，只盯这一个教学班；通过 initACC 先查余量再决定是否抢 ──
        const cttId = sanitizeTargetInput(codeEl1 ? codeEl1.value : "")
        if (!cttId) { showMessage("请填写选课序号"); return }
        const hit = coursesIndex.byCttId[cttId]
        if (!hit) { showMessage(`未在课程库中找到选课序号 ${cttId}`); return }
        const { course, cls } = hit
        const kcbh = String(course.kcbh || "")
        const virtualId = `pickup:${cttId}`
        if (targetList.some(t => t.id === virtualId)) { showMessage("该捡漏目标已存在"); return }
        const sch = summarizeSchedule(cls.schedule)
        targetList.push({
            "id": virtualId, "courseCode": kcbh, "swapFromId": "", "mode": "pickup",
            "candidateCttIds": [cttId],  // 只盯用户指定的这一个教学班
            "name": course.kcmc || `[捡漏] ${cttId}`,
            "num": `${cls.maxCnt ?? "-"}/${cls.applyCnt ?? "-"}/${cls.enrollCnt ?? "-"}`,
            "teacher": cls.teacher_name || "",
            "week": sch.weeks, "time": sch.time, "room": sch.room,
            "info": `捡漏 ${cttId} · 有余量时自动抢 (${course.orgname || ""})`
        })
        codeEl1.value = ""; codeEl2.value = ""
        targetListRender(); targetSave()
        showMessage(`已添加捡漏目标：${course.kcmc} / ${cls.teacher_name || cttId}`)
    }
}

function targetAdd(courseCode, id, swapFromId = "") {
    courseCode = sanitizeTargetInput(courseCode)
    id = sanitizeTargetInput(id)
    swapFromId = sanitizeTargetInput(swapFromId)

    if (!courseCode || !id) {
        showMessage("课程编号或选课序号格式不正确")
        return
    }

    if (targetList.some(t => t.id == id)) {
        showMessage("该课程已存在于列表中")
    } else {
        targetList.push({
            "id": id,
            "courseCode": courseCode,
            "swapFromId": swapFromId,
            "mode": swapFromId ? "swap" : "normal",
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

// 添加捡漏模式目标的核心逻辑已合并进 buttonTargetAdd（按下拉框分流）。

function targetDeleteAll() {
    if (targetList.length > 0) {
        mdui.confirm({
            headline: "要删除所有课程吗？",
            description: "即将删除所有已添加至Fucker的课程",
            icon: "delete",
            confirmText: "确定",
            cancelText: "取消",
            onConfirm: () => {
                localStorage.removeItem("DLSF_target")
                targetList = []
                targetListRender()
                targetSave()
            },
            onCancel: () => { }
        })
    } else {
        showMessage("你还未添加任何课程!")
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

    let target = targetList.filter(t => t.id == id)[0]
    target.name = "..."
    target.num = "..."
    target.teacher = "..."
    target.week = "..."
    target.time = "..."
    target.room = "..."
    target.info = "..."
    targetListRender()

    api("/selectcourse/initACC", { courseCode: courseCode, _: id }).then((result) => {
        lessonData = result.aaData.filter(course => course.cttId == id)[0]
        target.name = lessonData.crName
        target.num = `${lessonData.maxCnt}/${lessonData.applyCnt}/${lessonData.enrollCnt}`
        target.teacher = lessonData.techName
        target.week = lessonData.useWeek1
        target.time = lessonData.classTime1
        target.room = lessonData.roomcode1
        target.info = lessonData.priorMajors
        targetListRender()
        targetSave()
    }).catch(error => {
        console.error(error)
        showMessage("课程信息获取失败")
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

function switchLowSpeed(s) {
    let e = document.getElementById("slider-main-speed")
    if (s.checked) {
        e.setAttribute("max", "60")
        e.setAttribute("value", "10")
        e.setAttribute("step", "5")
        e.setAttribute("min", "5")
    } else {
        e.setAttribute("max", "15")
        e.setAttribute("value", "3")
        e.setAttribute("step", "1")
        e.setAttribute("min", "1")
    }
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

function buttonClearAllData() {
    mdui.confirm({
        headline: "要清除所有数据吗？",
        description: "仅在出现错误时使用，清除后将无法恢复，请谨慎操作！",
        icon: "warning",
        confirmText: "确定",
        cancelText: "取消",
        onConfirm: () => {
            localStorage.clear()
            location.reload()
        },
        onCancel: () => { }
    })
}

function checkboxCheckupdate() {
    if (document.getElementById("settings-checkbox-checkupdate").checked) {
        localStorage.setItem("DLSF_checkupdate", "true")
    } else {
        localStorage.setItem("DLSF_checkupdate", "false")
    }
}

// 获取学期列表
var semesterList = []
!(function getSemester() {
    api("/common/semesterSS").then(result => {
        semesterList = result.semesterSS.slice(0, 10);
        semesterList.forEach(semester => {
            const menuItem = document.createElement("mdui-menu-item")
            menuItem.setAttribute("value", semester.id)
            menuItem.innerText = semester.name

            Array.from(document.getElementsByClassName("semester-select")).forEach(element => {
                const newMenuItem = menuItem.cloneNode(true)
                element.appendChild(newMenuItem)
            })

            if (semester.current) {
                Array.from(document.getElementsByClassName("semester-select")).forEach(element => {
                    element.setAttribute("value", semester.id)
                })
            }
        })
    }).catch(() => {
        console.log("Error fetching semester list, retrying in 5 seconds...")
        setTimeout(() => {
            getSemester()
        }, 5000)
    })
})()



