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
!(function () {
    setInterval(() => {
        apiPing()
            .then(() => { document.getElementById("dialog-backend-disconnected").open = false })
            .catch(() => { document.getElementById("dialog-backend-disconnected").open = true })
    }, 3000)
})()


// 通用消息条
function showMessage(message, position = "bottom-end") {
    mdui.snackbar({
        message: message,
        closeable: true,
        placement: position
    })
}