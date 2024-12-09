var arrangeLessonList = []
if (localStorage.getItem("arrangeLessonList") != null) {
    arrangeLessonList = JSON.parse(localStorage.getItem("arrangeLessonList"))
}

renderPreviewTable()
renderArrangeList()


var arrangePreviewTable = []
var arrangeSelectedWeek = 1

document.getElementById("arrange-list").addEventListener("change", event => {
    Array.from(document.getElementById("arrange-list").children).forEach(element => {
        if (element.value == event.target.value) {
            element.querySelector(".arrange-list-icon-arrow").setAttribute("icon", "keyboard_arrow_up")
        } else {
            element.querySelector(".arrange-list-icon-arrow").setAttribute("icon", "keyboard_arrow_down")
        }
    })
})

function addLessonToArrange(id) {

    if (!arrangeLessonList.some(item => item.code === id)) {
        api("/selectcourse/initACC", { courseCode: id }).then(result => {
            const name = result.curCourse.kcmc
            const code = id
            let lessons = []

            if (result.aaData.length != 0) {

                result.aaData.forEach(course => {
                    const selectCode = course.cttId
                    const status = `总${course.maxCnt}/申${course.applyCnt}/录${course.enrollCnt}`
                    const teacher = course.techName
                    const weekString = course.useWeek1
                    const timeString = course.classTime1
                    const location = `${course.roomcode1}（${course.priorMajors}）`
                    const classroom = course.roomcode1

                    function getArray(start, end) {
                        start = Number(start)
                        end = Number(end)
                        let _ = []
                        for (let i = start; i <= end; i++) {
                            _.push(Number(i))
                        }
                        return _
                    }

                    const weekStart = course.useWeek1.replace(/周/g, "").split("-")[0]
                    const weekEnd = course.useWeek1.replace(/周/g, "").split("-")[1]
                    let week = getArray(weekStart, weekEnd)

                    const timeWeekDay = course.classTime1.split(".")[0]
                    let timeTemp = course.classTime1.replace(/节/g, "").split(".")
                    timeTemp.shift()
                    const time = timeTemp.map(item => Number(item));

                    lessons.push({
                        selectCode: selectCode,
                        status: status,
                        teacher: teacher,
                        week: week,
                        weekString: weekString,
                        time: time,
                        timeString: timeString,
                        timeWeekDay: timeWeekDay,
                        location: location,
                        classroom: classroom,
                        selected: false,
                        conflict: false
                    })
                })

                arrangeLessonList.push({
                    name: name,
                    code: code,
                    selected: false,
                    lessons: lessons
                })

                renderArrangeList()
                localStorage.setItem("arrangeLessonList", JSON.stringify(arrangeLessonList))

                showMessage("课程添加成功")

            } else {
                showMessage("本课程暂无可选课程")
            }

        })
    } else {
        showMessage("课程已存在于列表中")
    }

}

function removeLessonFromArrange(id) {
    arrangeLessonList = arrangeLessonList.filter(item => item.code !== id)
    renderArrangeList()
    localStorage.setItem("arrangeLessonList", JSON.stringify(arrangeLessonList))
    showMessage("课程已从列表中移除")
}

function removeLessonFromArrangeButton(id) {
    const name = arrangeLessonList.find(item => item.code === id).name
    mdui.confirm({
        headline: "要删除这门课吗？",
        description: "即将删除课程：" + (name == "..." ? id : name),
        icon: "delete",
        confirmText: "确定",
        cancelText: "取消",
        onConfirm: () => {
            removeLessonFromArrange(id)
        },
        onCancel: () => { }
    })
}

function arrangeSelectLesson(id, selectCode) {
    arrangeLessonList.find(item => item.code === id).lessons.forEach(lesson => {
        if (lesson.selectCode == selectCode) {
            lesson.selected = !lesson.selected
        } else {
            lesson.selected = false
        }
    })
    arrangeLessonList.find(item => item.code === id).selected = arrangeLessonList.find(item => item.code === id).lessons.some(lesson => lesson.selected)
    renderPreviewTable()
    updateArrangeList()
    localStorage.setItem("arrangeLessonList", JSON.stringify(arrangeLessonList))
}

function arrangeClearAllSelect() {
    arrangeLessonList.forEach(item => {
        item.lessons.forEach(lesson => {
            lesson.selected = false
        })
        item.selected = false
    })
    renderPreviewTable()
    updateArrangeList()
    localStorage.setItem("arrangeLessonList", JSON.stringify(arrangeLessonList))
}

function arrangeSetWeek(week, element) {
    arrangeSelectedWeek = week
    renderPreviewTable(element)
}

document.querySelectorAll(".arrange-week").forEach(element => {
    element.addEventListener("click", event => {
        const week = parseInt(event.currentTarget.querySelector("div").innerHTML)
        document.querySelectorAll(".arrange-week").forEach(element => {
            if (element.querySelector("div").innerHTML == week) {
                element.classList.add("button-icon-selected")
            } else {
                element.classList.remove("button-icon-selected")
            }
        })
        element.setAttribute("loading", "true")
        arrangeSetWeek(week, element)
    })
})

function renderArrangeList() {
    const arrangeList = document.getElementById("arrange-list")
    let _ = ""
    if (arrangeLessonList.length == 0) { arrangeList.innerHTML = ""; return }
    arrangeLessonList.forEach(item => {
        _ += `<mdui-collapse-item value="${item.code}">`
        _ += `
        <mdui-list-item slot="header" class="arrange-list-icon-arrow" icon="keyboard_arrow_down">
          ${item.name}
          <mdui-icon style="margin-right: 0.5rem;display: none;" slot="end-icon" name="done" class="arrange-list-icon-ok"></mdui-icon>
          <mdui-icon style="margin-right: 0.5rem;" slot="end-icon" name="delete" onclick="removeLessonFromArrangeButton('${item.code}');"></mdui-icon>
        </mdui-list-item>
        `
        _ += `<div style="margin-left: 2.5rem">`

        item.lessons.forEach(lesson => {
            _ += `
            <mdui-list-item class="arrange-list-item" code="${item.code}" selectcode="${lesson.selectCode}" value="${lesson.selectCode}" onclick="arrangeSelectLesson('${item.code}', '${lesson.selectCode}')">
              <div style="display: flex;align-items: center;gap: 0.5rem;">
                <div>${lesson.teacher}</div>
                <div style="opacity: 0.25;">${item.name}</div>
              </div>
              <div style="display: flex;align-items: center;gap: 0.25rem;font-size: smaller;opacity: 0.5;">
                <mdui-icon style="font-size: 18px;" name="date_range"></mdui-icon>
                <div style="margin-right: 0.5rem;">${lesson.weekString}</div>
                <mdui-icon style="font-size: 18px;" name="schedule"></mdui-icon>
                <div style="margin-right: 0.5rem;">${lesson.timeString}</div>
                <mdui-icon style="font-size: 18px;" name="flag"></mdui-icon>
                <div style="margin-right: 0.5rem;">${lesson.status}</div>
                <mdui-icon style="font-size: 18px;" name="location_on"></mdui-icon>
                <div style="margin-right: 0.5rem;">${lesson.location}</div>
              </div>
              <mdui-icon slot="end-icon" class="arrange-list-icon-radio" code="${item.code}" selectcode="${lesson.selectCode}" name="radio_button_unchecked" onclick="arrangeSelectLesson('${item.code}', '${lesson.selectCode}')"></mdui-icon>
            </mdui-list-item>
            `
        })

        _ += `
          </div>
        </mdui-collapse-item>
        `
    })
    arrangeList.innerHTML = _
    updateArrangeList()
}

function updateArrangeList() {
    const arrangeList = document.getElementById("arrange-list")
    arrangeList.querySelectorAll(".arrange-list-icon-radio").forEach(element => {
        const code = element.getAttribute("code")
        const selectCode = element.getAttribute("selectcode")
        const selected = arrangeLessonList.find(item => item.code === code).lessons.find(lesson => lesson.selectCode == selectCode).selected
        if (selected) {
            element.setAttribute("name", "radio_button_checked")
        } else {
            element.setAttribute("name", "radio_button_unchecked")
        }
    })
    arrangeList.querySelectorAll(".arrange-list-icon-ok").forEach(element => {
        const code = element.parentElement.parentElement.value
        const selected = arrangeLessonList.find(item => item.code === code).selected
        if (selected) {
            element.style.display = "inline-block"
        } else {
            element.style.display = "none"
        }
    })
    arrangeList.querySelectorAll(".arrange-list-item").forEach(element => {
        const code = element.getAttribute("code")
        const selectCode = element.getAttribute("selectcode")
        const conflict = arrangeLessonList.find(item => item.code === code).lessons.find(lesson => lesson.selectCode == selectCode).conflict
        if (conflict) {
            element.style.backgroundColor = "rgba(255, 0, 0, 0.125)"
        } else {
            element.style.backgroundColor = "rgba(0, 0, 0, 0)"
        }
    })
}

function renderPreviewTable(element) {
    api("/selectcourse/initSelCourses").then(result => {
        arrangePreviewTable = []

        // type 0: 已录取课程
        result.enrollCourses.forEach(lesson => {

            function getArray(start, end) {
                start = Number(start)
                end = Number(end)
                let _ = []
                for (let i = start; i <= end; i++) {
                    _.push(Number(i))
                }
                return _
            }

            try {
                const selectCode = lesson.jxbdm
                const teacher = lesson.teachName
                const location = lesson.classRoom1
                const name = lesson.courseName

                const weekStart = lesson.useWeek1.replace(/周/g, "").split("-")[0]
                const weekEnd = lesson.useWeek1.replace(/周/g, "").split("-")[1]
                let week = getArray(weekStart, weekEnd)

                const timeWeekDay = lesson.classTime1.split(".")[0]
                let timeTemp = lesson.classTime1.replace(/节/g, "").split(".")
                timeTemp.shift()
                const time = timeTemp.map(item => Number(item));


                arrangePreviewTable.push({
                    type: 0,
                    selectCode: selectCode,
                    name: name,
                    teacher: teacher,
                    week: week,
                    weekString: lesson.useWeek1,
                    timeWeekDay: timeWeekDay,
                    time: time,
                    location: location
                })
            } catch (e) {
                console.error(e)
                console.error(`课程 ${lesson.courseName} 解析失败，跳过`)
                console.error(lesson)
            }

        })

        // type 1: 已选课程
        result.selectedCourses.forEach(lesson => {

            function getArray(start, end) {
                start = Number(start)
                end = Number(end)
                let _ = []
                for (let i = start; i <= end; i++) {
                    _.push(Number(i))
                }
                return _
            }

            try {
                const selectCode = lesson.jxbdm
                const teacher = lesson.teachName
                const location = lesson.classRoom1
                const name = lesson.courseName

                const weekStart = lesson.useWeek1.replace(/周/g, "").split("-")[0]
                const weekEnd = lesson.useWeek1.replace(/周/g, "").split("-")[1]
                let week = getArray(weekStart, weekEnd)

                const timeWeekDay = lesson.classTime1.split(".")[0]
                let timeTemp = lesson.classTime1.replace(/节/g, "").split(".")
                timeTemp.shift()
                const time = timeTemp.map(item => Number(item));

                arrangePreviewTable.push({
                    type: 1,
                    selectCode: selectCode,
                    name: name,
                    teacher: teacher,
                    week: week,
                    weekString: lesson.useWeek1,
                    timeWeekDay: timeWeekDay,
                    time: time,
                    location: location
                })
            } catch (e) {
                console.warn(e)
                console.warn(`课程 ${lesson.courseName} 解析失败，跳过`)
                console.warn(lesson)
            }

        })

        // type 2: arrangeLessonList 课程
        arrangeLessonList.forEach(item => {
            if (item.selected) {
                item.lessons.forEach(lesson => {
                    if (lesson.selected) {
                        arrangePreviewTable.push({
                            type: 2,
                            selectCode: lesson.selectCode.toString(),
                            name: item.name,
                            teacher: lesson.teacher,
                            week: lesson.week,
                            weekString: lesson.weekString,
                            timeWeekDay: lesson.timeWeekDay,
                            time: lesson.time,
                            timeString: lesson.timeString,
                            location: lesson.classroom
                        })
                    }
                })
            }
        })

        const previewTable = document.getElementById("arrange-preview-table")

        previewTable.innerHTML = ""

        let tdRowToSkipMap = {
            "周一": 0,
            "周二": 0,
            "周三": 0,
            "周四": 0,
            "周五": 0,
            "周六": 0,
            "周日": 0
        }

        const bgColorMap = {
            "0": "rgba(255, 255, 255, 0.08)", // 已录取课程
            "1": "rgba(63, 255, 63, 0.08)", // 已选课程
            "2": "rgba(63, 63, 255, 0.08)" // arrangeLessonList 课程
        }

        for (let i = 1; i <= 13; i++) {
            const tr = document.createElement("tr")
            const td0 = document.createElement("td")
            const td1 = document.createElement("td")
            const td2 = document.createElement("td")
            const td3 = document.createElement("td")
            const td4 = document.createElement("td")
            const td5 = document.createElement("td")
            const td6 = document.createElement("td")
            const td7 = document.createElement("td")

            td0.innerHTML = i // 第i节课
            arrangePreviewTable.forEach(lesson => {
                if (lesson.week.includes(arrangeSelectedWeek)) {
                    const day2TdMap = {
                        "周一": td1,
                        "周二": td2,
                        "周三": td3,
                        "周四": td4,
                        "周五": td5,
                        "周六": td6,
                        "周日": td7
                    }
                    if (day2TdMap[lesson.timeWeekDay]) {
                        if (lesson.time[0] == i) {
                            const tdElement = day2TdMap[lesson.timeWeekDay]
                            tdElement.rowSpan = lesson.time.length
                            if (tdRowToSkipMap[lesson.timeWeekDay] == 0) {
                                tdRowToSkipMap[lesson.timeWeekDay] = 0 - (lesson.time.length - 1)
                            }
                            tdElement.style["vertical-align"] = "top"
                            tdElement.style["background-color"] = bgColorMap[lesson.type]
                            tdElement.innerHTML = `
                            <div style="font-size: larger;font-weight: bold;">${lesson.name}</div>
                            <div style="opacity: 0.75;">${lesson.weekString} · ${lesson.location}</div>
                            <div style="opacity: 0.35;">${lesson.teacher}</div>
                            `
                        }
                    } else {
                        console.error(`未识别的星期: ${lesson.timeWeekDay}`)
                    }
                }
            })

            tr.appendChild(td0)



            if (tdRowToSkipMap["周一"] > 0) {
                tdRowToSkipMap["周一"]--
            } else if (tdRowToSkipMap["周一"] < 0) {
                tr.appendChild(td1)
                tdRowToSkipMap["周一"] = 0 - tdRowToSkipMap["周一"]
            } else {
                tr.appendChild(td1)
            }

            if (tdRowToSkipMap["周二"] > 0) {
                tdRowToSkipMap["周二"]--
            } else if (tdRowToSkipMap["周二"] < 0) {
                tr.appendChild(td2)
                tdRowToSkipMap["周二"] = 0 - tdRowToSkipMap["周二"]
            } else {
                tr.appendChild(td2)
            }

            if (tdRowToSkipMap["周三"] > 0) {
                tdRowToSkipMap["周三"]--
            } else if (tdRowToSkipMap["周三"] < 0) {
                tr.appendChild(td3)
                tdRowToSkipMap["周三"] = 0 - tdRowToSkipMap["周三"]
            } else {
                tr.appendChild(td3)
            }

            if (tdRowToSkipMap["周四"] > 0) {
                tdRowToSkipMap["周四"]--
            } else if (tdRowToSkipMap["周四"] < 0) {
                tr.appendChild(td4)
                tdRowToSkipMap["周四"] = 0 - tdRowToSkipMap["周四"]
            } else {
                tr.appendChild(td4)
            }

            if (tdRowToSkipMap["周五"] > 0) {
                tdRowToSkipMap["周五"]--
            } else if (tdRowToSkipMap["周五"] < 0) {
                tr.appendChild(td5)
                tdRowToSkipMap["周五"] = 0 - tdRowToSkipMap["周五"]
            } else {
                tr.appendChild(td5)
            }

            if (tdRowToSkipMap["周六"] > 0) {
                tdRowToSkipMap["周六"]--
            } else if (tdRowToSkipMap["周六"] < 0) {
                tr.appendChild(td6)
                tdRowToSkipMap["周六"] = 0 - tdRowToSkipMap["周六"]
            } else {
                tr.appendChild(td6)
            }

            if (tdRowToSkipMap["周日"] > 0) {
                tdRowToSkipMap["周日"]--
            } else if (tdRowToSkipMap["周日"] < 0) {
                tr.appendChild(td7)
                tdRowToSkipMap["周日"] = 0 - tdRowToSkipMap["周日"]
            } else {
                tr.appendChild(td7)
            }



            previewTable.appendChild(tr)

        }

        updateConflictHightlight()

        if (element) {
            // 移除loading 属性
            element.removeAttribute("loading")
        }

    })
}

function updateConflictHightlight() {

    function hasCommonItems(arr1, arr2) {
        const set1 = new Set(arr1);
        return arr2.some(item => set1.has(item))
    }


    arrangeLessonList.forEach(item => {
        item.lessons.forEach(lesson => {
            let conflict = false
            arrangePreviewTable.forEach(previewLesson => {
                if (previewLesson.selectCode == lesson.selectCode) return
                if (previewLesson.timeWeekDay == lesson.timeWeekDay && hasCommonItems(previewLesson.time, lesson.time) && hasCommonItems(previewLesson.week, lesson.week)) {
                    conflict = true
                }
            })

            lesson.conflict = conflict

        })
    })

    updateArrangeList()
}

function arrangeSendToFucker() {
    let count = 0
    arrangeLessonList.forEach(item => {
        item.lessons.forEach(lesson => {
            if (lesson.selected) {
                document.getElementById("input-target-courseCode").value = item.code
                document.getElementById("input-target").value = lesson.selectCode
                buttonTargetAdd()
                count++
            }
        })
    })
    showMessage(`成功添加了 ${count} 门课程`)
}