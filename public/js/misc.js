function isNumeric(str) {
    if (typeof str !== "string") return false
    return !isNaN(str) && !isNaN(parseFloat(str))
}

// 版本检查
if (localStorage.getItem("DLSF_checkupdate") == "true") {
    api("/dlsf/version").then(async result => {
        document.getElementById("version-current").innerText = result.currentVersion
        const versionCurrent = result.currentVersion.slice(0, 7)
        try {
            const response = await fetch(`https://api.github.com/repos/Ltfjx/DLSF/commits`)
            const data = await response.json()
            document.getElementById("version-latest").innerText = data[0].sha
            const versionLatest = data[0].sha.slice(0, 7)
            if (versionCurrent != versionLatest) {
                mdui.snackbar({
                    message: `检测到新版本 ${versionCurrent} -> ${versionLatest}，请前往 Github 获取更新。`,
                    placement: "top"
                })
            }
        } catch (error) {
            console.error('Error fetching latest commit hash:', error)
        }
    })
}


// 心跳包

ws = new WebSocket(`ws://${window.location.host.split(":")[0]}:${parseInt(window.location.host.split(":")[1]) + 1}`)

ws.onopen = () => {
    console.log('连接到 WebSocket 服务器')
    document.getElementById("dialog-backend-disconnected").open = false
}

ws.onclose = () => {
    console.log('WebSocket 连接关闭，尝试重新连接')
    document.getElementById("dialog-backend-disconnected").open = true
    setTimeout(() => {
        ws = new WebSocket(`ws://${window.location.host.split(":")[0]}:${window.location.host.split(":")[1] + 1}`)
    }, 1000)
}


// 通用消息条
function showMessage(message, position = "bottom-end") {
    mdui.snackbar({
        message: message,
        closeable: true,
        placement: position
    })
}